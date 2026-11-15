import { ThreeScene } from './threeScene.js';
import { SliderManager, ModalManager, AudioUploadManager } from './uiComponents.js';
import { BlendshapeProcessor } from './blendshapeProcessor.js';
import { AudioProcessor } from './audioProcessor.js';


let threeScene;
let sliderManager;
let blendshapeProcessor;
let modalManager;
let audioProcessor;
let audioUploadManager;
let modelLoadSequence = 0;

function initThreeJS() {
    threeScene = new ThreeScene();
    threeScene.init('threejs-container');
    loadModel(() => threeScene.loadDefaultModel(), 'Ally Face Model', true).finally(() => {
        document.getElementById('modelFileInput').disabled = false;
    });
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
        blendshapeProcessor.applyPendingValues();
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
    blendshapeProcessor = new BlendshapeProcessor(sliderManager);
    modalManager = new ModalManager();
    audioProcessor = new AudioProcessor(sliderManager);
    audioUploadManager = new AudioUploadManager(audioProcessor);
    
    initThreeJS();
    threeScene.setupModelControls();
    document.getElementById('modelFileInput').addEventListener('change', event => {
        const files = Array.from(event.target.files);
        if (files.length) {
            const model = files.find(file => /\.(glb|gltf|fbx)$/i.test(file.name));
            loadModel(() => threeScene.loadModelFiles(files), model ? model.name : 'model');
        }
        event.target.value = '';
    });

    const exampleData = `[0.0, 0.0, 0.0, 0.0, 0.0, 0.026174580678343773, 0.594277560710907, 0.0, 0.0, 0.0, 0.0, 0.0, 0.026059681549668312, 0.5944592952728271, 0.023094596341252327, 0.0006808243924751878, 0.024826038628816605, 0.046770986169576645, 0.0009422543807886541, 0.06569699943065643, 0.00044532548054121435, 0.019521566107869148, -3.756374280783348e-05, 0.12610526382923126, 0.09840516000986099, -0.00028435199055820704, 0.0003598964831326157, 0.03203817084431648, 0.02757873758673668, 0.11394623667001724, 0.11269740760326385, 0.006579927634447813, 0.009613755159080029, 0.00030736744520254433, 0.0003520186000969261, 6.487023347290233e-05, 0.0011935947695747018, 0.23282714188098907, 0.22038716077804565, 0.04937620460987091, 0.043106041848659515, -0.00029014566098339856, -0.0003475777921266854, 0.2671084403991699, 0.134125217795372, 0.13437339663505554, 0.00018445044406689703, 0.04482872411608696, 0.04833042994141579, 0.000261367968050763, -0.00020279570890124887, 0.0]`;
    document.getElementById('inputData').value = exampleData;
    window.parseData();
});

window.parseData = function () {
    const input = document.getElementById('inputData').value.trim();
    blendshapeProcessor.parseData(input);
};

window.showInfoModal = () => modalManager.showInfoModal();
window.closeInfoModal = () => modalManager.closeInfoModal();