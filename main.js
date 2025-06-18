import * as THREE from 'https://esm.sh/three@0.160.0';
import { FBXLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js';
import { blendshapeNameMap, arkitBlendshapeOrder } from './constants.js'

// ARKit 52 standard blendshapes in order
const arkitBlendshapes = [
    'browDownLeft', 'browDownRight', 'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight',
    'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight', 'eyeBlinkLeft', 'eyeBlinkRight',
    'eyeLookDownLeft', 'eyeLookDownRight', 'eyeLookInLeft', 'eyeLookInRight', 'eyeLookOutLeft',
    'eyeLookOutRight', 'eyeLookUpLeft', 'eyeLookUpRight', 'eyeSquintLeft', 'eyeSquintRight',
    'eyeWideLeft', 'eyeWideRight', 'jawForward', 'jawLeft', 'jawOpen', 'jawRight',
    'mouthClose', 'mouthDimpleLeft', 'mouthDimpleRight', 'mouthFrownLeft', 'mouthFrownRight',
    'mouthFunnel', 'mouthLeft', 'mouthLowerDownLeft', 'mouthLowerDownRight', 'mouthPressLeft',
    'mouthPressRight', 'mouthPucker', 'mouthRight', 'mouthRollLower', 'mouthRollUpper',
    'mouthShrugLower', 'mouthShrugUpper', 'mouthSmileLeft', 'mouthSmileRight', 'mouthStretchLeft',
    'mouthStretchRight', 'mouthUpperUpLeft', 'mouthUpperUpRight', 'noseSneerLeft', 'noseSneerRight',
    'tongueOut'
];

let pendingBlendshapeValues = null;


// Three.js setup
let scene, camera, renderer, morphMeshes = [];
let sliders = [];
let currentBlendshapeValues = new Array(52).fill(0);

function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0.07, 2.5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    const container = document.getElementById('threejs-container');
    const rect = container.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0x888888));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(1, 2, 3);
    scene.add(dirLight);

    // Handle resize
    window.addEventListener('resize', onWindowResize);

    // Load model (you'll need to provide the correct path)
    loadModel();

    animate();

}

function loadModel() {
    const loader = new FBXLoader();
    // Note: You'll need to update this path to your actual model
    loader.load('./assets/Ally Face Head Model with hair.fbx', (fbx) => {
        fbx.scale.set(4.4, 4.4, 4.4);
        scene.add(fbx);

        fbx.traverse((child) => {
            if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                morphMeshes.push(child);
                createSlidersForMesh(child);
            }
        });

        if (morphMeshes.length === 0) {
            console.warn('No morph targets found in this model.');
        }
    }, undefined, (err) => {
        console.error('Error loading FBX:', err);
        // Create a placeholder sphere if model fails to load

    });
    onWindowResize()
}


function createSlidersForMesh(mesh) {
    const container = document.getElementById("sliderContainer");

    const groupDiv = document.createElement("div");
    // groupDiv.className = "mesh-group";

    const title = document.createElement("h3");
    title.innerText = mesh.name || "Unnamed Mesh";
    groupDiv.appendChild(title);

    const dict = mesh.morphTargetDictionary || {};
    const influences = mesh.morphTargetInfluences || [];

    // Reverse lookup: ARKit name -> modelName
    const modelNameByArkit = {};
    for (const [modelName, index] of Object.entries(dict)) {
        const arkitName = blendshapeNameMap[modelName];
        if (arkitName) {
            modelNameByArkit[arkitName] = { modelName, index };
        }
    }

    // Create sliders in fixed order
    for (let i = 0; i < arkitBlendshapeOrder.length; i++) {
        const arkitName = arkitBlendshapeOrder[i];
        const mapping = modelNameByArkit[arkitName];

        const sliderGroup = document.createElement("div");
        sliderGroup.className = "slider-group";
        sliderGroup.id = `slider-group-${i}`;

        const label = document.createElement("label");
        label.textContent = `${i} ${arkitName}`;
        sliderGroup.appendChild(label);

        const sliderContainer = document.createElement("div");
        sliderContainer.className = "slider-container";

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.01;
        slider.id = `slider-${i}`;
        slider.value = 0.0

        let valueDisplay = document.createElement("span");
        valueDisplay.className = "slider-value";
        valueDisplay.id = `value-${i}`;
        valueDisplay.textContent = slider.value;
        sliderGroup.appendChild(valueDisplay);

        if (mapping) {
            slider.value = influences[mapping.index] || 0;
            slider.oninput = () => {
                const val = parseFloat(slider.value);
                influences[mapping.index] = val;
                valueDisplay.textContent = val.toFixed(2);
                updateSliderGroupState?.(sliderGroup, val);
            };

            sliders[i] = {
                slider,
                valueDisplay,
                sliderGroup,
                mapping
            };
        } else {
            slider.value = 0;
            slider.disabled = true;

            sliders[i] = {
                slider,
                valueDisplay,
                sliderGroup,
                mapping: null
            };
        }

        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);
        sliderGroup.appendChild(sliderContainer);
        groupDiv.appendChild(sliderGroup);
    }

    container.appendChild(groupDiv);

    if (pendingBlendshapeValues) {
        applyBlendshapeValues(pendingBlendshapeValues);
        pendingBlendshapeValues = null;
    }

}

function updateSliderGroupState(sliderGroup, value) {
    if (Math.abs(value) > 0.01) {
        sliderGroup.classList.add('active');
    } else {
        sliderGroup.classList.remove('active');
    }
}

function onWindowResize() {
    const container = document.getElementById('threejs-container');
    const rect = container.getBoundingClientRect();
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Model controls
function setupModelControls() {
    const scaleSlider = document.getElementById('modelScale');
    const rotationSlider = document.getElementById('modelRotation');

    scaleSlider.oninput = () => {
        const scale = parseFloat(scaleSlider.value);
        scene.children.forEach(child => {
            if (child.type === 'Group' || child.isMesh) {
                child.scale.set(scale, scale, scale);
            }
        });
    };

    rotationSlider.oninput = () => {
        const rotation = parseFloat(rotationSlider.value);
        scene.children.forEach(child => {
            if (child.type === 'Group' || child.isMesh) {
                child.rotation.y = rotation;
            }
        });
    };
}

// Parse data function
window.parseData = function () {
    const input = document.getElementById('inputData').value.trim();

    if (!input) {
        alert('Please paste your blendshape array');
        return;
    }

    try {
        let values;
        if (input.startsWith('[') && input.endsWith(']')) {
            values = JSON.parse(input);
        } else {
            values = input.split(',').map(v => parseFloat(v.trim()));
        }

        if (!Array.isArray(values)) {
            throw new Error('Invalid array format');
        }

        if (Object.keys(sliders).length === 0) {
            pendingBlendshapeValues = values;  // Save until model is ready
        } else {
            applyBlendshapeValues(values);
        }
        displayStats(values);
    } catch (error) {
        alert('Error parsing data: ' + error.message);
    }
};


function applyBlendshapeValues(values) {
    for (let i = 0; i < Math.min(values.length, arkitBlendshapes.length); i++) {
        const value = Math.max(0, Math.min(1, values[i]));
        currentBlendshapeValues[i] = value;
        console.log(`sliders[i] ${sliders[i]}`)
        if (sliders[i]) {
            sliders[i].slider.value = value;
            sliders[i].valueDisplay.textContent = value.toFixed(2);
            updateSliderGroupState(sliders[i].sliderGroup, value);

            // Apply to mesh if available
            if (sliders[i].mapping) {
                morphMeshes.forEach(mesh => {
                    if (mesh.morphTargetInfluences) {
                        mesh.morphTargetInfluences[sliders[i].mapping.index] = value;
                    }
                });
            }
        }
    }
}

function displayStats(values) {
    document.getElementById('stats').style.display = 'block';
    document.getElementById('totalValues').textContent = values.length;

    const activeValues = values.filter(v => Math.abs(v) > 0.01);
    document.getElementById('activeCount').textContent = activeValues.length;

    const maxValue = Math.max(...values.map(Math.abs));
    document.getElementById('maxValue').textContent = maxValue.toFixed(3);

}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    setupModelControls();

    // Parse example data on load
    const exampleData = `[0.0, 0.0, 0.0, 0.0, 0.0, 0.026174580678343773, 0.594277560710907, 0.0, 0.0, 0.0, 0.0, 0.0, 0.026059681549668312, 0.5944592952728271, 0.023094596341252327, 0.0006808243924751878, 0.024826038628816605, 0.046770986169576645, 0.0009422543807886541, 0.06569699943065643, 0.00044532548054121435, 0.019521566107869148, -3.756374280783348e-05, 0.12610526382923126, 0.09840516000986099, -0.00028435199055820704, 0.0003598964831326157, 0.03203817084431648, 0.02757873758673668, 0.11394623667001724, 0.11269740760326385, 0.006579927634447813, 0.009613755159080029, 0.00030736744520254433, 0.0003520186000969261, 6.487023347290233e-05, 0.0011935947695747018, 0.23282714188098907, 0.22038716077804565, 0.04937620460987091, 0.043106041848659515, -0.00029014566098339856, -0.0003475777921266854, 0.2671084403991699, 0.134125217795372, 0.13437339663505554, 0.00018445044406689703, 0.04482872411608696, 0.04833042994141579, 0.000261367968050763, -0.00020279570890124887, 0.0]`;
    document.getElementById('inputData').value = exampleData;
    parseData();
});

window.parseData = function () {
    const input = document.getElementById('inputData').value.trim();

    if (!input) {
        alert('Please paste your NeuroSync response array');
        return;
    }

    try {
        let values;
        if (input.startsWith('[') && input.endsWith(']')) {
            values = JSON.parse(input);
        } else {
            values = input.split(',').map(v => parseFloat(v.trim()));
        }

        if (!Array.isArray(values)) {
            throw new Error('Invalid array format');
        }

        applyBlendshapeValues(values);
        displayStats(values);

    } catch (error) {
        alert('Error parsing data: ' + error.message);
    }
};

function showInfoModal() {
    // Populate the blendshape order list
    const orderList = document.getElementById('blendshapeOrderList');
    orderList.innerHTML = '';
    
    arkitBlendshapes.forEach((name, index) => {
        const item = document.createElement('div');
        item.className = 'blendshape-list-item';
        item.innerHTML = `
            <span class="blendshape-index">[${index}]</span>
            <span class="blendshape-name-modal">${name}</span>
        `;
        orderList.appendChild(item);
    });
    
    // Generate example array with dummy values
    const exampleValues = arkitBlendshapes.map((_, index) => {
        // Create some interesting dummy values for demonstration
        if (index === 8 || index === 9) return 0.3; // eye blinks
        if (index === 24) return 0.2; // jaw open
        if (index === 43 || index === 44) return 0.15; // mouth smile
        if (index < 5) return Math.round(Math.random() * 20) / 100; // brow variations
        return 0.0;
    });
    
    const exampleArray = document.getElementById('exampleArray');
    exampleArray.textContent = `[${exampleValues.join(', ')}]`;
    
    // Show the modal
    document.getElementById('infoModal').style.display = 'block';
}

function closeInfoModal() {
    document.getElementById('infoModal').style.display = 'none';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('infoModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

window.showInfoModal = showInfoModal;
window.closeInfoModal = closeInfoModal;