import * as THREE from 'https://esm.sh/three@0.160.0';
import { FBXLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'https://esm.sh/three@0.160.0/examples/jsm/libs/meshopt_decoder.module.js';

export class ThreeScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.loadSequence = 0;
    }

    init(containerId) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);

        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        this.camera.position.set(0, 0.07, 2.5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        const container = document.getElementById(containerId);
        const rect = container.getBoundingClientRect();
        this.renderer.setSize(rect.width, rect.height);
        container.appendChild(this.renderer.domElement);

        this.setupLighting();
        this.setupEventListeners();
        this.onWindowResize();
        this.animate();
    }

    setupLighting() {
        this.scene.add(new THREE.AmbientLight(0x888888));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
        dirLight.position.set(1, 2, 3);
        this.scene.add(dirLight);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    async loadDefaultModel() {
        const sequence = ++this.loadSequence;
        const model = await new FBXLoader().loadAsync('./assets/Ally Face Head Model with hair.fbx');
        model.scale.setScalar(4.4);
        model.rotation.x = 0.1;
        return this.showModel(model, sequence);
    }

    async loadModelFiles(files) {
        const sequence = ++this.loadSequence;
        const models = files.filter(file => /\.(glb|gltf|fbx)$/i.test(file.name));
        if (models.length !== 1) {
            throw new Error('Choose exactly one .glb, .gltf, or .fbx model.');
        }
        const file = models[0];
        const extension = file.name.split('.').pop().toLowerCase();
        const resources = new Map();
        for (const resource of files.filter(item => item !== file)) {
            const name = resource.name.toLowerCase();
            if (resources.has(name)) throw new Error(`Duplicate resource filename: ${resource.name}`);
            resources.set(name, resource);
        }

        const manager = new THREE.LoadingManager();
        const objectURLs = [];
        let requestedResources = false;
        let resourceError = null;
        const resourcesLoaded = new Promise(resolve => {
            manager.onLoad = resolve;
            manager.onError = url => { resourceError = url; };
        });
        manager.setURLModifier(url => {
            requestedResources = true;
            if (url.startsWith('blob:') || url.startsWith('data:')) return url;
            const name = decodeURIComponent(url.replace(/\\/g, '/').split('/').pop()).toLowerCase();
            const resource = resources.get(name);
            if (!resource) throw new Error(`Missing model resource: ${name}. Select it with the model.`);
            const objectURL = URL.createObjectURL(resource);
            objectURLs.push(objectURL);
            return objectURL;
        });
        let model;
        try {
            const data = await file.arrayBuffer();
            if (extension === 'glb' || extension === 'gltf') {
                const loader = new GLTFLoader(manager);
                loader.setMeshoptDecoder(MeshoptDecoder);
                model = (await loader.parseAsync(data, '')).scene;
            } else {
                model = new FBXLoader(manager).parse(data, '');
            }
            if (requestedResources) await resourcesLoaded;
            if (resourceError) {
                this.disposeModel(model);
                throw new Error(`Could not load model resource: ${resourceError}`);
            }
        } finally {
            objectURLs.forEach(url => URL.revokeObjectURL(url));
        }

        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(maxSize) || maxSize <= 0) {
            this.disposeModel(model);
            throw new Error('The model has no visible geometry to display.');
        }
        const center = bounds.getCenter(new THREE.Vector3());
        const wrapper = new THREE.Group();
        model.position.sub(center);
        wrapper.add(model);
        const fitScale = 1.6 * Math.min(1, this.camera.aspect) / maxSize;
        wrapper.scale.setScalar(fitScale);
        return this.showModel(wrapper, sequence, fitScale / 4, 4);
    }

    showModel(model, sequence, controlScale = 1, sliderScale = 4.4) {
        if (sequence !== this.loadSequence) {
            this.disposeModel(model);
            return null;
        }
        const meshes = [];
        model.traverse(child => {
            if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                meshes.push(child);
            }
        });
        if (this.model) {
            this.scene.remove(this.model);
            this.disposeModel(this.model);
        }
        this.model = model;
        this.controlScale = controlScale;
        this.scene.add(model);
        document.getElementById('modelScale').value = sliderScale;
        document.getElementById('modelRotation').value = 0;
        document.getElementById('modelHorizontalOffset').value = 0;
        document.getElementById('modelVerticalOffset').value = 0;
        this.updateModelFraming();
        return meshes;
    }

    disposeModel(model) {
        const geometries = new Set();
        const materials = new Set();
        const textures = new Set();
        model.traverse(child => {
            if (child.geometry) geometries.add(child.geometry);
            if (child.material) {
                const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
                childMaterials.forEach(material => materials.add(material));
            }
        });
        materials.forEach(material => {
            Object.values(material).forEach(value => {
                if (value && value.isTexture) textures.add(value);
            });
            material.dispose();
        });
        textures.forEach(texture => texture.dispose());
        geometries.forEach(geometry => geometry.dispose());
    }

    onWindowResize() {
        const container = document.getElementById('threejs-container');
        const rect = container.getBoundingClientRect();
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(rect.width, rect.height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    setupModelControls() {
        const scaleSlider = document.getElementById('modelScale');
        const rotationSlider = document.getElementById('modelRotation');
        const horizontalOffsetSlider = document.getElementById('modelHorizontalOffset');
        const verticalOffsetSlider = document.getElementById('modelVerticalOffset');

        if (scaleSlider) {
            scaleSlider.oninput = () => {
                const scale = parseFloat(scaleSlider.value);
                if (this.model) this.model.scale.setScalar(scale * this.controlScale);
            };
        }

        if (rotationSlider) {
            rotationSlider.oninput = () => {
                const rotation = parseFloat(rotationSlider.value);
                if (this.model) this.model.rotation.y = rotation;
            };
        }

        [horizontalOffsetSlider, verticalOffsetSlider].forEach(slider => {
            if (slider) slider.oninput = () => this.updateModelFraming();
        });
    }

    updateModelFraming() {
        if (!this.model) return;
        this.model.position.x = Number(document.getElementById('modelHorizontalOffset').value);
        this.model.position.y = Number(document.getElementById('modelVerticalOffset').value);
    }

}