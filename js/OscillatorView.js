import './components/RangeControl.js'

export default class OscillatorView {
    constructor(id, model) {
        this.id = id;
        this.element = document.getElementById(id)
        this.model = model;
        this.model.addEventListener('change', this.onModelChange)
        this.render();
        this.controls = {
            waveform: this.element.querySelector('.waveform'),
            range: this.element.querySelector('.range'),
            tune: this.element.querySelector('.tune'),
            fineTune: this.element.querySelector('.fine-tune'),
            level: this.element.querySelector('.level'),
        }
        this.populateControls();
        this.addControlEventListeners();
    }

    render() {
        this.element.innerHTML = `
            <p>
                <label><span>Waveform</span><select class="waveform">
                    <option>sine</option>
                    <option>triangle</option>
                    <option>sawtooth</option>
                    <option>square</option>
                </select></label>
            </p>
            <p>
                <label><span>Range</span><select class="range">
                    <option value="0.25">32'</option>
                    <option value="0.5">16'</option>
                    <option value="1">8'</option>
                    <option value="2">4'</option>
                    <option value="4">2'</option>
                </select></label>
            </p>
            <p>
                <label><span>Tune</span><input class="tune" type="range" min="-8" max="8"/></label>
            </p>
            <p>
                <label><span>Fine Tune</span><input class="fine-tune" type="range" min="-1" max="1" step="0.01" /></label>
            </p>
            <p>
                <label><span>Level</span><input class="level" type="range" min="0" max="100" /></label>
            </p>
        `;
    }

    onModelChange = () => {
        this.populateControls();
    }

    populateControls() {
        const { waveform, range, tune, fineTune, level } = this.model.attributes;
        this.controls.waveform.value = waveform;
        this.controls.range.value = String(range);
        this.controls.tune.value = tune;
        this.controls.fineTune.value = fineTune;
        this.controls.level.value = level;
    }

    addControlEventListeners() {
        this.controls.waveform.addEventListener('change', evt => {
            this.model.set({waveform: evt.target.value});
        });
        this.controls.range.addEventListener('change', evt => {
            this.model.set({range: parseFloat(evt.target.value)});
        });
        this.controls.tune.addEventListener('change', evt => {
            this.model.set({tune: evt.target.value});
        });
        this.controls.fineTune.addEventListener('change', evt => {
            this.model.set({fineTune: evt.target.value});
        });
        this.controls.level.addEventListener('change', evt => {
            this.model.set({level: evt.target.value});
        });
    }
}
