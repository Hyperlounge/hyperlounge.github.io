
export default class LFOView {
    constructor(id, model) {
        this.id = id;
        this.element = document.getElementById(id)
        this.model = model;
        this.model.addEventListener('change', this.onModelChange)
        this.render();
        this.controls = {
            waveform: this.element.querySelector('.waveform'),
            frequency: this.element.querySelector('.frequency'),
            oscillator1Mod: this.element.querySelector('.oscillator1-mod'),
            oscillator2Mod: this.element.querySelector('.oscillator2-mod'),
            amplitudeMod: this.element.querySelector('.amplitude-mod'),
            filterMod: this.element.querySelector('.filter-mod'),
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
                    <option value="sawtooth">sawtooth 1</option>
                    <option value="inverse-sawtooth">sawtooth 2</option>
                    <option>square</option>
                </select></label>
            </p>
            <p>
                <label><span>Frequency</span><input class="frequency" type="range" min="0" max="100"/></label>
            </p>
            <p>
                <label><span>Oscillator 1 Mod</span><input class="oscillator1-mod" type="range" min="0" max="100"/></label>
            </p>
            <p>
                <label><span>Oscillator 2 Mod</span><input class="oscillator2-mod" type="range" min="0" max="100"/></label>
            </p>
            <p>
                <label><span>Amplitude Mod</span><input class="amplitude-mod" type="range" min="0" max="100"/></label>
            </p>
            <p>
                <label><span>Filter Mod</span><input class="filter-mod" type="range" min="0" max="100"/></label>
            </p>
        `;
    }

    onModelChange = () => {
        this.populateControls();
    }

    populateControls() {
        const { waveform, frequency, oscillator1Mod, oscillator2Mod, amplitudeMod, filterMod } = this.model.attributes;
        this.controls.waveform.value = waveform;
        this.controls.frequency.value = frequency;
        this.controls.oscillator1Mod.value = oscillator1Mod;
        this.controls.oscillator2Mod.value = oscillator2Mod;
        this.controls.amplitudeMod.value = amplitudeMod;
        this.controls.filterMod.value = filterMod;
    }

    addControlEventListeners() {
        this.controls.waveform.addEventListener('change', evt => {
            this.model.set({waveform: evt.target.value});
        });
        this.controls.frequency.addEventListener('change', evt => {
            this.model.set({frequency: evt.target.value});
        });
        this.controls.oscillator1Mod.addEventListener('change', evt => {
            this.model.set({oscillator1Mod: evt.target.value});
        });
        this.controls.oscillator2Mod.addEventListener('change', evt => {
            this.model.set({oscillator2Mod: evt.target.value});
        });
        this.controls.amplitudeMod.addEventListener('change', evt => {
            this.model.set({amplitudeMod: evt.target.value});
        });
        this.controls.filterMod.addEventListener('change', evt => {
            this.model.set({filterMod: evt.target.value});
        });
    }
}
