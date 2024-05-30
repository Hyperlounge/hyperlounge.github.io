
import PropTypes from './helpers/PropTypes.js';
import addTwiddling from './helpers/addTwiddling.js';

export default class CycleSwitch extends HTMLElement {
    static propTypes = {
        id: PropTypes.string,
        class: PropTypes.string,
        style: PropTypes.string,
        capColor: PropTypes.string.default('yellow').observed,
        title: PropTypes.string.default('Title').observed,
        format: PropTypes.string.lookup(['vertical', 'horizontal']).default('vertical'),
    }

    static template = data => `
<style>
    .cycle-switch {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-items: center;
        position: relative;
    }
    .cycle-switch.horizontal {
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
        width: 60px;
        text-align: center;
        border: 4px solid black;
        border-radius: 4px;
        font-weight: bold;
        padding: 1px;
        background: ${data.capColor};
        margin-bottom: 0.55em;
    }
    .cycle-switch.horizontal .title {
        margin: 0;
    }
    .cycle-switch.horizontal .switch {
        margin: 0;
    }
    
</style>
<div class="cycle-switch ${data.format}">
    <div class="title">${data.title}</div>
    <div class="switch">${data.selectedLabel}</div>
</div>
    `

    constructor() {
        super();
    }

    connectedCallback() {
        this._root = this.attachShadow({mode: 'open'});
        this._props = PropTypes.attributesToProps(this);
        this._selectedIndex = 0;

        this._options = Array.from(this.querySelectorAll('option')).map((option, i) => {
            if (option.selected) {
                this._selectedIndex = i;
            }
            return {
                label: option.innerHTML,
                value: option.value,
            };
        });

        const data = {
            ...this._props,
            selectedLabel: this._options[this._selectedIndex].label,
        }

        this._root.innerHTML = CycleSwitch.template(data);
        this._updateView();
        this._addControlListeners();
    }

    attributeChangedCallback(name) {
        if (this._root) {
            this._props[name] = PropTypes.attributesToProps(this, name);
        }
    }

    _updateView() {
        const theSwitch = this._root.querySelector('.switch');
        theSwitch.innerHTML = this._options[this._selectedIndex].label;
    }

    _addControlListeners() {
        const theSwitch = this._root.querySelector('.switch');

        addTwiddling(theSwitch)
            .onStart(() => {
                if (this._selectedIndex === this._options.length - 1) {
                    this._selectedIndex = 0;
                } else {
                    this._selectedIndex++;
                }
                this._updateView();
                this._dispatchChangeEvent();
            });
    }

    _dispatchChangeEvent() {
        const evt = new CustomEvent('input');
        this.dispatchEvent(evt);
    }

    get value() {
        return this._options[this._selectedIndex].value;
    }

    set value(newValue) {
        this._options.forEach((option, i) => {
            if (option.value === newValue) {
                this._selectedIndex = i;
            }
        });
        this._updateView();
    }
}

customElements.define('cycle-switch', CycleSwitch);
