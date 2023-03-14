
export default class FilterView {
    constructor(id, model) {
        this.id = id;
        this.element = document.getElementById(id)
        this.model = model;
        this.model.addEventListener('change', this.onModelChange)
        this.render();
        this.controls = {
            type: this.element.querySelector('.type'),
            frequency: this.element.querySelector('.frequency'),
            emphasis: this.element.querySelector('.emphasis'),
            contour: this.element.querySelector('.contour'),
            keyboard: this.element.querySelector('.keyboard'),
        }
        this.populateControls();
        this.addControlEventListeners();
    }

    render() {
        this.element.innerHTML = `
            <p>
                <label><span>Type</span><select class="type">
                    <option value="lowpass">low pass</option>
                    <option value="highpass">high pass</option>
                    <option value="bandpass">band pass</option>
                </select></label>
            </p>
            <p>
                <label><span>Frequency</span><input class="frequency" type="range" min="0" max="100"/></label>
            </p>
            <p>
                <label><span>Resonance</span><input class="emphasis" type="range" min="0" max="100" /></label>
            </p>
            <p>
                <label><span>Envelope</span><input class="contour" type="range" min="0" max="100" /></label>
            </p>
            <p>
                <label><span>Follow Keys</span><input class="keyboard" type="range" min="0" max="100" /></label>
            </p>
        `;
    }

    onModelChange = () => {
        this.populateControls();
    }

    populateControls() {
        const { type, frequency, emphasis, contour, keyboard } = this.model.attributes;
        this.controls.type.value = type;
        this.controls.frequency.value = frequency;
        this.controls.emphasis.value = emphasis;
        this.controls.contour.value = contour;
        this.controls.keyboard.value = keyboard;
    }

    addControlEventListeners() {
        this.controls.type.addEventListener('change', evt => {
            this.model.set({type: evt.target.value});
        });
        this.controls.frequency.addEventListener('change', evt => {
            this.model.set({frequency: evt.target.value});
        });
        this.controls.emphasis.addEventListener('change', evt => {
            this.model.set({emphasis: evt.target.value});
        });
        this.controls.contour.addEventListener('change', evt => {
            this.model.set({contour: evt.target.value});
        });
        this.controls.keyboard.addEventListener('change', evt => {
            this.model.set({keyboard: evt.target.value});
        });
    }
}
