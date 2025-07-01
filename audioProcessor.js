export class AudioProcessor {
    constructor(sliderManager) {
        this.sliderManager = sliderManager;
        this.audioElement = null;
        this.blendshapeFrames = [];
        this.isPlaying = false;
        this.currentFrame = 0;
        this.frameRate = 30; // Default 30 FPS
        this.animationId = null;
        this.startTime = 0;
    }

    async uploadAndProcess(audioFile) {
        try {
            // Create audio element for playback
            this.audioElement = new Audio();
            this.audioElement.src = URL.createObjectURL(audioFile);
            
            // Get audio duration to calculate frame rate
            await this.loadAudioMetadata();
            
            // Make API call to get blendshape data
            const blendshapeData = await this.callBlendshapeAPI(audioFile);
            
            // Calculate frame rate based on audio duration and data length
            this.calculateFrameRate(blendshapeData.length);
            
            // Store the blendshape frames
            this.blendshapeFrames = blendshapeData;
            
            return {
                success: true,
                duration: this.audioElement.duration,
                frameCount: blendshapeData.length,
                frameRate: this.frameRate
            };
            
        } catch (error) {
            console.error('Error processing audio:', error);
            return { success: false, error: error.message };
        }
    }

    loadAudioMetadata() {
        return new Promise((resolve, reject) => {
            this.audioElement.addEventListener('loadedmetadata', () => {
                resolve();
            });
            this.audioElement.addEventListener('error', (e) => {
                reject(new Error('Failed to load audio file'));
            });
        });
    }

    async callBlendshapeAPI(audioFile) {
        // Dummy API call - replace with actual endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                // Generate dummy blendshape data
                // In real implementation, send audioFile to your API
                const frameCount = Math.floor(this.audioElement.duration * 30); // 30 FPS assumption
                const dummyData = [];
                
                for (let i = 0; i < frameCount; i++) {
                    // Generate 52 blendshape values with some animation
                    const frame = new Array(52).fill(0);
                    
                    // Add some animated mouth movement
                    const time = i / frameCount;
                    frame[24] = Math.abs(Math.sin(time * Math.PI * 8)) * 0.5; // jaw open
                    frame[43] = Math.abs(Math.sin(time * Math.PI * 6)) * 0.3; // mouth smile left
                    frame[44] = Math.abs(Math.sin(time * Math.PI * 6)) * 0.3; // mouth smile right
                    
                    // Add some eye blinks
                    if (i % 90 === 0) { // Blink every 3 seconds at 30fps
                        frame[8] = 0.8; // left eye blink
                        frame[9] = 0.8; // right eye blink
                    }
                    
                    dummyData.push(frame);
                }
                
                resolve(dummyData);
            }, 1000); // Simulate API delay
        });
    }

    calculateFrameRate(frameCount) {
        if (this.audioElement && this.audioElement.duration > 0) {
            this.frameRate = frameCount / this.audioElement.duration;
        }
    }

    play() {
        if (!this.blendshapeFrames.length || !this.audioElement) {
            console.error('No blendshape data or audio loaded');
            return;
        }

        this.isPlaying = true;
        this.startTime = performance.now();
        // this.currentFrame = 0;
        
        // Start audio playback
        // this.audioElement.currentTime = 0;
        this.audioElement.play();
        
        // Start animation loop
        this.animate();
    }

    pause() {
        this.isPlaying = false;
        if (this.audioElement) {
            this.audioElement.pause();
        }
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    stop() {
        this.pause();
        this.currentFrame = 0;
        if (this.audioElement) {
            this.audioElement.currentTime = 0;
        }
        // Reset to neutral position
        const neutralFrame = new Array(52).fill(0);
        this.sliderManager.applyBlendshapeValues(neutralFrame);
    }

    animate() {
        if (!this.isPlaying) return;

        const currentTime = performance.now();
        const elapsed = (currentTime - this.startTime) / 1000; // Convert to seconds
        
        // Calculate which frame we should be on
        const targetFrame = Math.floor(elapsed * this.frameRate);
        
        // Apply blendshape values if we have a new frame
        if (targetFrame < this.blendshapeFrames.length && targetFrame !== this.currentFrame) {
            this.currentFrame = targetFrame;
            this.sliderManager.applyBlendshapeValues(this.blendshapeFrames[this.currentFrame]);
        }
        
        // Check if animation is complete
        if (targetFrame >= this.blendshapeFrames.length) {
            this.stop();
            return;
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    getProgress() {
        if (!this.audioElement || !this.blendshapeFrames.length) return 0;
        return this.currentFrame / this.blendshapeFrames.length;
    }

    getDuration() {
        return this.audioElement ? this.audioElement.duration : 0;
    }

    getCurrentTime() {
        return this.audioElement ? this.audioElement.currentTime : 0;
    }
}