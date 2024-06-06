
import PropTypes from './helpers/PropTypes.js';
import addTwiddling from './helpers/addTwiddling.js';
import AbstractComponent from './AbstractComponent.js';

export default class ToggleSwitch extends AbstractComponent {
    static propTypes = {
        ...AbstractComponent.propTypes,
        checked: PropTypes.bool.default(false).observed,
        capColor: PropTypes.string.default('yellow').observed,
        format: PropTypes.string.lookup(['vertical', 'horizontal']).default('vertical'),
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
    .toggle-switch.horizontal {
        flex-direction: row;
        gap: 0.5em;
    }
    .title {
        text-align: center;
        margin-bottom: 0.2em;
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
        margin-bottom: 0.3em;
    }
    .toggle-switch.horizontal .title {
        margin: 0;
    }
    .toggle-switch.horizontal .switch {
        margin: 0;
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
<div class="toggle-switch ${data.format}">
    <div class="title">${data.title}</div>
    <div class="switch"></div>
</div>
    `

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        this._title = this.innerHTML;

        const data = {
            ...this._props,
            title: this._title,
        }

        this._root.innerHTML = ToggleSwitch.template(data);
        this._updateView();
        this._addControlListeners();
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
                this.value = !this.value;
                this.dispatchChangeEvent();
            });
    }

    get value() {
        return this._props.checked;
    }

    set value(newValue) {
        this._props.checked = !!newValue;
        this._updateView();
    }
}

customElements.define('toggle-switch', ToggleSwitch);
