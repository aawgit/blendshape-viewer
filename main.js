import { ThreeScene } from './threeScene.js?v=framing-controls';
import { SliderManager } from './uiComponents.js';

let threeScene;
let sliderManager;
let modelLoadSequence = 0;

function initThreeJS() {
    threeScene = new ThreeScene();
    threeScene.init('threejs-container');
    loadModel(() => threeScene.loadDefaultModel(), 'Ally Face Model', true);
}

async function loadModel(load, name, isDefault = false) {
    const sequence = ++modelLoadSequence;
    const status = document.getElementById('modelStatus');
    status.textContent = `Loading ${name}...`;
    status.className = 'upload-status processing';
    try {
        const meshes = await load();
        if (sequence !== modelLoadSequence || !meshes) return;
        const values = sliderManager.getSliders().map(entry => Number(entry.slider.value));
        sliderManager.createSlidersForMeshes(meshes);
        sliderManager.applyBlendshapeValues(values);
        document.getElementById('defaultModelAttribution').hidden = !isDefault;
        const targetCount = meshes.reduce((count, mesh) => count + Object.keys(mesh.morphTargetDictionary).length, 0);
        status.textContent = targetCount
            ? `Loaded ${name}: ${targetCount} blendshape targets on ${meshes.length} mesh(es).`
            : `Loaded ${name}, but it has no blendshape targets.`;
        status.className = 'upload-status success';
    } catch (error) {
        console.error('Error loading model:', error);
        if (sequence !== modelLoadSequence) return;
        status.textContent = `Could not load ${name}: ${error.message}`;
        status.className = 'upload-status error';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    sliderManager = new SliderManager();
    initThreeJS();
    threeScene.setupModelControls();
    const modelFileInput = document.getElementById('modelFileInput');
    const handleModelSelection = () => {
        const files = Array.from(modelFileInput.files);
        if (files.length) {
            const model = files.find(file => /\.(glb|gltf|fbx)$/i.test(file.name));
            loadModel(() => threeScene.loadModelFiles(files), model ? model.name : 'model');
        }
        modelFileInput.value = '';
    };
    modelFileInput.addEventListener('change', handleModelSelection);
    if (modelFileInput.files.length) handleModelSelection();
});