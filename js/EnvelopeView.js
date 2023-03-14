
export default class EnvelopeView {
    constructor(id, model) {
        this.id = id;
        this.element = document.getElementById(id)
        this.model = model;
        this.model.addEventListener('change', this.onModelChange)
        this.render();
        this.controls = {
            attack: this.element.querySelector('.attack'),
            decay: this.element.querySelector('.decay'),
            sustain: this.element.querySelector('.sustain'),
            release: this.element.querySelector('.release'),
            velocity: this.element.querySelector('.velocity'),
        }
        this.populateControls();
        this.addControlEventListeners();
    }

    render() {
        this.element.innerHTML = `
            <p>
                <label><span>Attack</span><input class="attack" type="range" min="0" max="100"/></label>
            </p>
            <p>
                <label><span>Decay</span><input class="decay" type="range" min="0" max="100"/></label>
            </p>
            <p>
                <label><span>Sustain</span><input class="sustain" type="range" min="0" max="100"/></label>
            </p>
            <p>
                <label><span>Release</span><input class="release" type="range" min="0" max="100"/></label>
            </p>
            <p>
            <br/>
                <label><span>Velocity</span><input class="velocity" type="range" min="0" max="100"/></label>
            </p>
        `;
    }

    onModelChange = () => {
        this.populateControls();
    }

    populateControls() {
        const { attack, decay, sustain, release, velocity } = this.model.attributes;
        this.controls.attack.value = attack;
        this.controls.decay.value = decay;
        this.controls.sustain.value = sustain;
        this.controls.release.value = release;
        this.controls.velocity.value = velocity;
    }

    addControlEventListeners() {
        this.controls.attack.addEventListener('change', evt => {
            this.model.set({attack: evt.target.value});
        });
        this.controls.decay.addEventListener('change', evt => {
            this.model.set({decay: evt.target.value});
        });
        this.controls.sustain.addEventListener('change', evt => {
            this.model.set({sustain: evt.target.value});
        });
        this.controls.release.addEventListener('change', evt => {
            this.model.set({release: evt.target.value});
        });
        this.controls.velocity.addEventListener('change', evt => {
            this.model.set({velocity: evt.target.value});
        });
    }
}
