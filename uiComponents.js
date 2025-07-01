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