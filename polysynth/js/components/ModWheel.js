
import PropTypes from './helpers/PropTypes.js';
import addTwiddling from './helpers/addTwiddling.js';

export default class ModWheel extends HTMLElement {
    static propTypes = {
        id: PropTypes.string,
        class: PropTypes.string,
        style: PropTypes.string,
        value: PropTypes.number.default(0).observed,
        minValue: PropTypes.number.default(0),
        maxValue: PropTypes.number.default(1),
        snapBack: PropTypes.bool.default(false),
    }

    static template = data => `
<style>
    .mod-wheel {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-items: center;
        position: relative;
        padding: 0 10px;
    }
    .title {
        text-align: center;
        margin-bottom: 0.5em;
    }
    .slider {
        position: relative;
        width: 40px;
        height: 170px;
        text-align: center;
    }
    .track {
        display: inline-block;
        width: 40px;
        height: 100%;
        border-radius: 20px;
        background-color: black;
    }
    .knob {
        box-sizing: border-box;
        position: absolute;
        width: 30px;
        height: 30px;
        border-radius: 15px;
        left: 50%;
        background-color: gray;
        transform: translate(-50%, -50%);
    }
</style>
<div class="mod-wheel">
    <div class="title">${data.title}</div>
    <div class="slider">
        <div class="track"></div>
        <div class="knob"></div>
    </div>
</div>
    `

    constructor() {
        super();
    }

    connectedCallback() {
        this._root = this.attachShadow({mode: 'open'});
        this._props = PropTypes.attributesToProps(this);
        this._title = this.innerHTML;

        const data = {
            ...this._props,
            title: this._title,
        }
        this._root.innerHTML = ModWheel.template(data);
        this._minY = 20;
        this._maxY = 150;
        this._updateView();
        this._addControlListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this._root) {
            this._props[name] = PropTypes.attributesToProps(this, name);
        }
    }

    _updateView() {
        const {value, minValue, maxValue} = this._props;
        const knob = this._root.querySelector('.knob');
        this._knobY = this._maxY - (value-minValue)/(maxValue-minValue) * (this._maxY-this._minY);
        knob.style.top = `${this._knobY}px`;
    }

    _addControlListeners() {
        const {minValue, maxValue} = this._props;

        const slider = this._root.querySelector('.slider');
        let startValue;

        addTwiddling(slider)
            .onStart(() => {
                startValue = this._props.value;
            })
            .onTwiddle((deltaX, deltaY) => {
                let newValue = startValue + (deltaX - deltaY) * (maxValue - minValue) / (this._maxY - this._minY);
                this._props.value = Math.max(Math.min(newValue, maxValue), minValue);
                this._updateView();
                this._dispatchChangeEvent();
            })
            .onEnd(() => {
                if (this._props.snapBack) {
                    this._props.value = 0;
                    this._updateView();
                    this._dispatchChangeEvent();
                }
            });
    }

    _dispatchChangeEvent() {
        const evt = new CustomEvent('input');
        this.dispatchEvent(evt);
    }

    get value() {
        return this._props.value;
    }

    set value(newValue) {
        this._props.value = Number(newValue);
        this._updateView();
    }
}

customElements.define('mod-wheel', ModWheel);
