
import PropTypes from './helpers/PropTypes.js';
import addTwiddling from './helpers/addTwiddling.js';
import AbstractComponent from './AbstractComponent.js';

export default class CycleSwitch extends AbstractComponent {
    static propTypes = {
        ...AbstractComponent.propTypes,
        capColor: PropTypes.string.default('yellow').observed,
        title: PropTypes.string.default('Title').observed,
        format: PropTypes.string.lookup(['vertical', 'horizontal']).default('vertical'),
        numeric: PropTypes.bool.default(false),
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
        super.connectedCallback();
        this._selectedIndex = 0;

        this._options = Array.from(this.querySelectorAll('option')).map((option, i) => {
            if (option.selected) {
                this._selectedIndex = i;
            }
            return {
                label: option.innerHTML,
                value: this._props.numeric ? Number(option.value) : option.value,
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
                this.dispatchChangeEvent();
            });
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
