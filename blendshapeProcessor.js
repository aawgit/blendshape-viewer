export class BlendshapeProcessor {
    constructor(sliderManager) {
        this.sliderManager = sliderManager;
        this.pendingBlendshapeValues = null;
    }

    parseData(input) {
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

            if (!this.sliderManager.hasSliders()) {
                this.pendingBlendshapeValues = values;
            } else {
                this.sliderManager.applyBlendshapeValues(values);
            }
            
            this.displayStats(values);
        } catch (error) {
            alert('Error parsing data: ' + error.message);
        }
    }

    applyPendingValues() {
        if (this.pendingBlendshapeValues) {
            this.sliderManager.applyBlendshapeValues(this.pendingBlendshapeValues);
            this.pendingBlendshapeValues = null;
        }
    }

    displayStats(values) {
        const statsElement = document.getElementById('stats');
        if (statsElement) {
            statsElement.style.display = 'block';
        }

        const totalValuesElement = document.getElementById('totalValues');
        if (totalValuesElement) {
            totalValuesElement.textContent = values.length;
        }

        const activeValues = values.filter(v => Math.abs(v) > 0.01);
        const activeCountElement = document.getElementById('activeCount');
        if (activeCountElement) {
            activeCountElement.textContent = activeValues.length;
        }

        const maxValue = Math.max(...values.map(Math.abs));
        const maxValueElement = document.getElementById('maxValue');
        if (maxValueElement) {
            maxValueElement.textContent = maxValue.toFixed(3);
        }
    }
}