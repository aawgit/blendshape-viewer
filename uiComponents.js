import { blendshapeNameMap, arkitBlendshapeOrder } from './constants.js';

export class SliderManager {
    constructor() {
        this.sliders = [];
        this.morphMeshes = [];
    }

    setMorphMeshes(meshes) {
        this.morphMeshes = meshes;
    }

    createSlidersForMesh(mesh) {
        const container = document.getElementById("sliderContainer");
        const groupDiv = document.createElement("div");

        const title = document.createElement("h3");
        title.innerText = mesh.name || "Unnamed Mesh";
        groupDiv.appendChild(title);

        const dict = mesh.morphTargetDictionary || {};
        const influences = mesh.morphTargetInfluences || [];

        const modelNameByArkit = {};
        for (const [modelName, index] of Object.entries(dict)) {
            const arkitName = blendshapeNameMap[modelName];
            if (arkitName) {
                modelNameByArkit[arkitName] = { modelName, index };
            }
        }

        for (let i = 0; i < arkitBlendshapeOrder.length; i++) {
            const arkitName = arkitBlendshapeOrder[i];
            const mapping = modelNameByArkit[arkitName];

            const sliderGroup = this.createSliderGroup(i, arkitName, mapping, influences);
            groupDiv.appendChild(sliderGroup);
        }

        container.appendChild(groupDiv);
    }

    createSliderGroup(index, arkitName, mapping, influences) {
        const sliderGroup = document.createElement("div");
        sliderGroup.className = "slider-group";
        sliderGroup.id = `slider-group-${index}`;

        const label = document.createElement("label");
        label.textContent = `${index} ${arkitName}`;
        sliderGroup.appendChild(label);

        const sliderContainer = document.createElement("div");
        sliderContainer.className = "slider-container";

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.01;
        slider.id = `slider-${index}`;
        slider.value = 0.0;

        const valueDisplay = document.createElement("span");
        valueDisplay.className = "slider-value";
        valueDisplay.id = `value-${index}`;
        valueDisplay.textContent = slider.value;
        sliderGroup.appendChild(valueDisplay);

        if (mapping) {
            slider.value = influences[mapping.index] || 0;
            slider.oninput = () => {
                const val = parseFloat(slider.value);
                influences[mapping.index] = val;
                valueDisplay.textContent = val.toFixed(2);
                this.updateSliderGroupState(sliderGroup, val);
            };

            this.sliders[index] = {
                slider,
                valueDisplay,
                sliderGroup,
                mapping
            };
        } else {
            slider.value = 0;
            slider.disabled = true;

            this.sliders[index] = {
                slider,
                valueDisplay,
                sliderGroup,
                mapping: null
            };
        }

        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);
        sliderGroup.appendChild(sliderContainer);

        return sliderGroup;
    }

    updateSliderGroupState(sliderGroup, value) {
        if (Math.abs(value) > 0.01) {
            sliderGroup.classList.add('active');
        } else {
            sliderGroup.classList.remove('active');
        }
    }

    applyBlendshapeValues(values) {
        for (let i = 0; i < Math.min(values.length, arkitBlendshapeOrder.length); i++) {
            const value = Math.max(0, Math.min(1, values[i]));
            
            if (this.sliders[i]) {
                this.sliders[i].slider.value = value;
                this.sliders[i].valueDisplay.textContent = value.toFixed(2);
                this.updateSliderGroupState(this.sliders[i].sliderGroup, value);

                if (this.sliders[i].mapping) {
                    this.morphMeshes.forEach(mesh => {
                        if (mesh.morphTargetInfluences) {
                            mesh.morphTargetInfluences[this.sliders[i].mapping.index] = value;
                        }
                    });
                }
            }
        }
    }

    getSliders() {
        return this.sliders;
    }

    hasSliders() {
        return Object.keys(this.sliders).length > 0;
    }
}

export class ModalManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.onclick = (event) => {
            const modal = document.getElementById('infoModal');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    showInfoModal() {
        this.populateBlendshapeOrder();
        this.generateExampleArray();
        
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeInfoModal() {
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    populateBlendshapeOrder() {
        const orderList = document.getElementById('blendshapeOrderList');
        if (!orderList) return;
        
        orderList.innerHTML = '';
        
        arkitBlendshapeOrder.forEach((name, index) => {
            const item = document.createElement('div');
            item.className = 'blendshape-list-item';
            item.innerHTML = `
                <span class="blendshape-index">[${index}]</span>
                <span class="blendshape-name-modal">${name}</span>
            `;
            orderList.appendChild(item);
        });
    }

    generateExampleArray() {
        const exampleValues = arkitBlendshapeOrder.map((_, index) => {
            if (index === 8 || index === 9) return 0.3; // eye blinks
            if (index === 24) return 0.2; // jaw open
            if (index === 43 || index === 44) return 0.15; // mouth smile
            if (index < 5) return Math.round(Math.random() * 20) / 100; // brow variations
            return 0.0;
        });
        
        const exampleArray = document.getElementById('exampleArray');
        if (exampleArray) {
            exampleArray.textContent = `[${exampleValues.join(', ')}]`;
        }
    }
}