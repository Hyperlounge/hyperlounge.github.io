
export default class ControllersView {
    constructor(id, model) {
        this.id = id;
        this.element = document.getElementById(id)
        this.model = model;
        this.model.addEventListener('change', this.onModelChange)
        this.render();
        this.controls = {
            glide: this.element.querySelector('.glide'),
            legato: this.element.querySelector('.legato'),
            bendRange: this.element.querySelector('.bend-range'),
            lfoFrequency: this.element.querySelector('.lfo-frequency'),
            lfoAmplitude: this.element.querySelector('.lfo-amplitude'),
        }
        this.populateControls();
        this.addControlEventListeners();
    }

    render() {
        this.element.innerHTML = `
            <p>
                <label><span>Legato</span><input class="legato" type="checkbox"/></label>
            </p>
            <p>
                <label><span>Glide</span><input class="glide" type="range" min="0" max="100" /></label>
            </p>
            <p>
                <label><span>Pitch Bend</span><select class="bend-range">
                    <option value="1">± 1</option>
                    <option value="2">± 2</option>
                    <option value="4">± 4</option>
                    <option value="8">± 8</option>
                    <option value="12">± 12</option>
                </select></label>
            </p>
            <p style="text-align: center">
                Mod Wheel:
            </p>
            <p>
                <label><span>LFO Frequency</span><input class="lfo-frequency" type="range" min="0" max="100"/></label>
            </p>
            <p>
                <label><span>LFO Amount</span><input class="lfo-amplitude" type="range" min="0" max="100"/></label>
            </p>
        `;
    }

    onModelChange = () => {
        this.populateControls();
    }

    populateControls() {
        const { glide, legato, bendRange, lfoFrequency, lfoAmplitude } = this.model.attributes;
        this.controls.glide.value = glide;
        this.controls.legato.checked = legato;
        this.controls.bendRange.value = bendRange;
        this.controls.lfoFrequency.value = lfoFrequency;
        this.controls.lfoAmplitude.value = lfoAmplitude;
    }

    addControlEventListeners() {
        this.controls.glide.addEventListener('change', evt => {
            this.model.set({glide: evt.target.value});
        });
        this.controls.legato.addEventListener('change', evt => {
            this.model.set({legato: evt.target.checked});
        });
        this.controls.bendRange.addEventListener('change', evt => {
            this.model.set({bendRange: evt.target.value});
        });
        this.controls.lfoFrequency.addEventListener('change', evt => {
            this.model.set({lfoFrequency: evt.target.value});
        });
        this.controls.lfoAmplitude.addEventListener('change', evt => {
            this.model.set({lfoAmplitude: evt.target.value});
        });
    }
}
