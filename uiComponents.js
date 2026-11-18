import { blendshapeNameMap, arkitBlendshapeOrder } from './constants.js';

export class SliderManager {
    constructor() {
        this.sliders = [];
    }

    createSlidersForMeshes(meshes) {
        const container = document.getElementById("sliderContainer");
        container.replaceChildren();
        this.sliders = [];
        const arkitTargets = new Map(arkitBlendshapeOrder.map(name => [name, []]));
        const otherTargets = new Map();
        const arkitNames = new Map(arkitBlendshapeOrder.map(name => [name.toLowerCase(), name]));

        meshes.forEach(mesh => {
            for (const [name, index] of Object.entries(mesh.morphTargetDictionary)) {
                const arkitName = Object.hasOwn(blendshapeNameMap, name)
                    ? blendshapeNameMap[name] : arkitNames.get(name.toLowerCase());
                const targets = arkitName ? arkitTargets.get(arkitName) : otherTargets.get(name) || [];
                targets.push({ influences: mesh.morphTargetInfluences, index });
                if (!arkitName) otherTargets.set(name, targets);
            }
        });

        arkitBlendshapeOrder.forEach((name, index) => {
            const entry = this.createSliderGroup(`${index} ${name}`, arkitTargets.get(name));
            this.sliders.push(entry);
            container.appendChild(entry.sliderGroup);
        });

        if (otherTargets.size) {
            const title = document.createElement("h3");
            title.textContent = "Other model blendshapes";
            container.appendChild(title);
            otherTargets.forEach((targets, name) => {
                container.appendChild(this.createSliderGroup(name, targets).sliderGroup);
            });
        }
    }

    createSliderGroup(name, targets) {
        const sliderGroup = document.createElement("div");
        sliderGroup.className = "slider-group";

        const label = document.createElement("label");
        label.textContent = name;
        sliderGroup.appendChild(label);

        const sliderContainer = document.createElement("div");
        sliderContainer.className = "slider-container";

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.01;
        slider.setAttribute("aria-label", name);
        slider.value = targets.length ? targets[0].influences[targets[0].index] : 0;

        const valueDisplay = document.createElement("span");
        valueDisplay.className = "slider-value";
        valueDisplay.textContent = Number(slider.value).toFixed(2);
        slider.disabled = targets.length === 0;
        slider.oninput = () => this.setSliderValue({ slider, valueDisplay, sliderGroup, targets }, Number(slider.value));
        this.updateSliderGroupState(sliderGroup, Number(slider.value));

        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);
        sliderGroup.appendChild(sliderContainer);

        return { slider, valueDisplay, sliderGroup, targets };
    }

    setSliderValue(entry, value) {
        entry.slider.value = value;
        entry.valueDisplay.textContent = value.toFixed(2);
        this.updateSliderGroupState(entry.sliderGroup, value);
        entry.targets.forEach(target => {
            target.influences[target.index] = value;
        });
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
            
            if (this.sliders[i]) this.setSliderValue(this.sliders[i], value);
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
