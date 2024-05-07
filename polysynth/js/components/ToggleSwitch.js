
import PropTypes from './helpers/PropTypes.js';
import addTwiddling from './helpers/addTwiddling.js';

export default class ToggleSwitch extends HTMLElement {
    static propTypes = {
        id: PropTypes.string,
        class: PropTypes.string,
        style: PropTypes.string,
        checked: PropTypes.bool.default(false).observed,
        capColor: PropTypes.string.default('yellow').observed,
    }

    static template = data => `
<style>
    .toggle-switch {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-items: center;
        position: relative;
    }
    .title {
        text-align: center;
        margin-bottom: 0.5em;
    }
    .switch {
        position: relative;
        box-sizing: border-box;
        width: 40px;
        text-align: center;
        border: 4px solid black;
        border-radius: 4px;
        font-weight: bold;
        letter-spacing: 1px;
        padding: 1px;
        background: linear-gradient(to right, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), ${data.capColor};
    }
    .switch::before {
        content: 'OFF';
    }
    .switch.checked {
        background: ${data.capColor};
    }
    .switch.checked::before {
        content: 'ON';
    }
    
</style>
<div class="toggle-switch">
    <div class="title">${data.title}</div>
    <div class="switch"></div>
</div>
    `

    constructor() {
        super();
        this.type = 'checkbox';
    }

    connectedCallback() {
        this._root = this.attachShadow({mode: 'open'});
        this._props = PropTypes.attributesToProps(this);
        this._title = this.innerHTML;

        const data = {
            ...this._props,
            title: this._title,
        }

        this._root.innerHTML = ToggleSwitch.template(data);
        this._updateView();
        this._addControlListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this._root) {
            this._props[name] = PropTypes.attributesToProps(this, name);
        }
    }

    _updateView() {
        const {checked} = this._props;
        const theSwitch = this._root.querySelector('.switch');
        theSwitch.classList.toggle('checked', checked);
    }

    _addControlListeners() {
        const theSwitch = this._root.querySelector('.switch');

        addTwiddling(theSwitch)
            .onStart(() => {
                this.checked = !this.checked;
                this._dispatchChangeEvent();
            });
    }

    _dispatchChangeEvent() {
        const evt = new CustomEvent('change');
        this.dispatchEvent(evt);
    }

    get checked() {
        return this._props.checked;
    }

    set checked(newValue) {
        this._props.checked = !!newValue;
        this._updateView();
    }
}

customElements.define('toggle-switch', ToggleSwitch);
