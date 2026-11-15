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

export class AudioUploadManager {
    constructor(audioProcessor) {
        this.audioProcessor = audioProcessor;
        this.setupUI();
    }

    setupUI() {
        this.createUploadSection();
        this.createControlsSection();
    }

    createUploadSection() {
        const container = document.getElementById('audioUploadContainer') || document.body;
        
        const uploadSection = document.createElement('div');
        uploadSection.className = 'audio-upload-section';
        uploadSection.innerHTML = `
            <div class="upload-area">
                <input type="file" id="audioFileInput" accept=".wav,.mp3,.m4a" style="display: none;">
                <button id="uploadButton" class="upload-btn">Upload Audio File (.wav)</button>
                <div id="uploadStatus" class="upload-status"></div>
            </div>
        `;
        
        container.appendChild(uploadSection);
        
        // Setup event listeners
        const fileInput = document.getElementById('audioFileInput');
        const uploadButton = document.getElementById('uploadButton');
        
        uploadButton.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });
    }

    createControlsSection() {
        const container = document.getElementById('audioControlsContainer') || document.body;
        
        const controlsSection = document.createElement('div');
        controlsSection.className = 'audio-controls-section';
        controlsSection.style.display = 'none';
        controlsSection.innerHTML = `
            <div class="audio-controls">
                <button id="playButton" class="control-btn">Play</button>
                <button id="pauseButton" class="control-btn">Pause</button>
                <button id="stopButton" class="control-btn">Stop</button>
                <div class="progress-container">
                    <div id="progressBar" class="progress-bar">
                        <div id="progressFill" class="progress-fill"></div>
                    </div>
                    <span id="timeDisplay" class="time-display">0:00 / 0:00</span>
                </div>
                <div id="animationInfo" class="animation-info"></div>
            </div>
        `;
        
        container.appendChild(controlsSection);
        
        // Setup control event listeners
        this.setupControlListeners();
    }

    setupControlListeners() {
        document.getElementById('playButton').addEventListener('click', () => {
            this.audioProcessor.play();
            this.startProgressUpdate();
        });
        
        document.getElementById('pauseButton').addEventListener('click', () => {
            this.audioProcessor.pause();
            this.stopProgressUpdate();
        });
        
        document.getElementById('stopButton').addEventListener('click', () => {
            this.audioProcessor.stop();
            this.stopProgressUpdate();
            this.updateProgress(0);
        });
    }

    async handleFileUpload(file) {
        if (!file) return;
        
        const statusEl = document.getElementById('uploadStatus');
        statusEl.textContent = 'Processing audio file...';
        statusEl.className = 'upload-status processing';
        
        try {
            const result = await this.audioProcessor.uploadAndProcess(file);
            
            if (result.success) {
                statusEl.textContent = `Audio processed successfully! Duration: ${result.duration.toFixed(2)}s, Frames: ${result.frameCount}, FPS: ${result.frameRate.toFixed(2)}`;
                statusEl.className = 'upload-status success';
                
                // Show controls
                document.querySelector('.audio-controls-section').style.display = 'block';
                
                // Update animation info
                const infoEl = document.getElementById('animationInfo');
                infoEl.innerHTML = `
                    <div>Duration: ${result.duration.toFixed(2)}s</div>
                    <div>Frames: ${result.frameCount}</div>
                    <div>Frame Rate: ${result.frameRate.toFixed(2)} FPS</div>
                `;
                
            } else {
                statusEl.textContent = `Error: ${result.error}`;
                statusEl.className = 'upload-status error';
            }
        } catch (error) {
            statusEl.textContent = `Error processing file: ${error.message}`;
            statusEl.className = 'upload-status error';
        }
    }

    startProgressUpdate() {
        this.progressInterval = setInterval(() => {
            const progress = this.audioProcessor.getProgress();
            const currentTime = this.audioProcessor.getCurrentTime();
            const duration = this.audioProcessor.getDuration();
            
            this.updateProgress(progress);
            this.updateTimeDisplay(currentTime, duration);
        }, 100);
    }

    stopProgressUpdate() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    updateProgress(progress) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${progress * 100}%`;
        }
    }

    updateTimeDisplay(currentTime, duration) {
        const timeDisplay = document.getElementById('timeDisplay');
        if (timeDisplay) {
            const formatTime = (time) => {
                const minutes = Math.floor(time / 60);
                const seconds = Math.floor(time % 60);
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            };
            
            timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
        }
    }
}