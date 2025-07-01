import * as THREE from 'https://esm.sh/three@0.160.0';
import { FBXLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js';

export class ThreeScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.morphMeshes = [];
        this.onMeshLoadedCallback = null;
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

    loadModel(modelPath, onMeshLoaded) {
        this.onMeshLoadedCallback = onMeshLoaded;
        const loader = new FBXLoader();
        
        loader.load(modelPath, (fbx) => {
            fbx.scale.set(4.4, 4.4, 4.4);
            fbx.rotation.x = 0.1;
            this.scene.add(fbx);

            fbx.traverse((child) => {
                if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                    this.morphMeshes.push(child);
                    if (this.onMeshLoadedCallback) {
                        this.onMeshLoadedCallback(child);
                    }
                }
            });

            if (this.morphMeshes.length === 0) {
                console.warn('No morph targets found in this model.');
            }
        }, undefined, (err) => {
            console.error('Error loading FBX:', err);
        });
        
        this.onWindowResize();
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

        if (scaleSlider) {
            scaleSlider.oninput = () => {
                const scale = parseFloat(scaleSlider.value);
                this.scene.children.forEach(child => {
                    if (child.type === 'Group' || child.isMesh) {
                        child.scale.set(scale, scale, scale);
                    }
                });
            };
        }

        if (rotationSlider) {
            rotationSlider.oninput = () => {
                const rotation = parseFloat(rotationSlider.value);
                this.scene.children.forEach(child => {
                    if (child.type === 'Group' || child.isMesh) {
                        child.rotation.y = rotation;
                    }
                });
            };
        }
    }

    getMorphMeshes() {
        return this.morphMeshes;
    }
}