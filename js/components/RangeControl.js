
import PropTypes from './helpers/PropTypes.js';

class RangeControl extends HTMLElement {
    static propTypes = {
        min: PropTypes.number.default(0),
        max: PropTypes.number.default(100),
        step: PropTypes.number.default(0),
        value: PropTypes.number.default(50).observed,
        units: PropTypes.string.default(''),
        logarithmic: PropTypes.bool.default(false),
        class: PropTypes.string,
    }
    constructor() {
        super();
    }
    connectedCallback() {
        this.attachShadow({mode: 'open'});
        this._props = PropTypes.attributesToProps(this);
        const {min, max, step, value, units, logarithmic} = this._props;
        this.shadowRoot.innerHTML = `
            <input type="range" min="${min}" max="${max}" step="${step}" value="${value}"><label>${value}${units}</label>
        `;
        this.input = this.shadowRoot.querySelector('input');
        this.input.addEventListener('change', evt => {
            this._props.value = this.input.value;
            this.updateValue();
            this.dispatchEvent(evt);
        });
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (this.shadowRoot) {
            this._props[name] = PropTypes.attributesToProps(this, name);
            this.input.value = this._props.value;
            this.updateValue();
        }
    }
    updateValue() {
        this.shadowRoot.querySelector('label').innerHTML = this._props.value + this._props.units;
    }
}

customElements.define('range-control', RangeControl);
