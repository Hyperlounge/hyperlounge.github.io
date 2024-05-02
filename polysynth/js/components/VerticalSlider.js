
import PropTypes from './helpers/PropTypes.js';
import addTwiddling from './helpers/addTwiddling.js';

export default class VerticalSlider extends HTMLElement {
    static propTypes = {
        id: PropTypes.string,
        class: PropTypes.string,
        style: PropTypes.string,
        scaleMin: PropTypes.number.default(0),
        scaleMax: PropTypes.number.default(10),
        scaleStep: PropTypes.number.default(1),
        minimal: PropTypes.bool.default(false),
        value: PropTypes.number.default(0).observed,
        minValue: PropTypes.number.default(0),
        maxValue: PropTypes.number.default(1),
        units: PropTypes.string.default(''),
        capColor: PropTypes.string.default('yellow').observed,
    }

    static template = data => `
<style>
    .vertical-slider {
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
    .slider {
        position: relative;
        width: 50px;
        height: 170px;
        text-align: center;
    }
    .track {
        display: inline-block;
        width: 6px;
        height: 100%;
        border-radius: 3px;
        background-color: black;
    }
    .knob {
        box-sizing: border-box;
        position: absolute;
        z-index: 10;
        width: 30px;
        height: 40px;
        border: 4px solid black;
        border-radius: 4px;
        left: 50%;
        background-color: ${data.capColor};
        transform: translate(-50%, -50%);
    }
    .indicator {
        position: absolute;
        display: inline-block;
        width: 100%;
        height: 2px;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
        background-color: black;
    }
    .tick {
        position: absolute;
        display: inline-block;
        width: 4px;
        height: 1px;
        left: 38px;
        background-color: black;
    }
    .label {
        position: absolute;
        left: 44px;
        font-size: 80%;
        transform: translate(0, -50%);
    }
</style>
<div class="vertical-slider">
    <div class="title">${data.title}</div>
    <div class="slider">
        <div class="track"></div>
        <div class="knob">
            <div class="indicator"></div>
        </div>
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

        this._initialValue = data.value;
        this._root.innerHTML = VerticalSlider.template(data);
        this._minY = 20;
        this._maxY = 150;
        this._drawScale();
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

    _drawScale() {
        const {scaleMin, scaleMax, scaleStep} = this._props;

        const yStep = (this._maxY - this._minY) * scaleStep / (scaleMax - scaleMin);
        let y = this._maxY;

        const slider = this._root.querySelector('.slider');

        for (let notch = scaleMin; notch <= scaleMax; notch += scaleStep) {
            const tick = document.createElement('div');
            tick.classList.add('tick');
            slider.append(tick);
            tick.style.top = y + 'px';

            const rounded = Math.round(notch * 100)/100;

            const label = document.createElement('div');
            label.classList.add('label');
            if (!this._props.minimal || rounded === 0) {
                label.innerHTML = rounded;
            } else if (notch === scaleMin) {
                label.innerHTML = String(rounded).replace(/-/, '&minus;');
            } else if (notch === scaleMax) {
                label.innerHTML = '+' + rounded;
            }
            slider.append(label);
            label.style.top = y + 'px';
            y -= yStep;
        }
    }

    _addControlListeners() {
        const {minValue, maxValue} = this._props;

        const knob = this._root.querySelector('.knob');
        let startValue;

        addTwiddling(knob)
            .onStart(() => {
                startValue = this._props.value;
            })
            .onTwiddle((deltaX, deltaY) => {
                let newValue = startValue - deltaY * (maxValue - minValue) / (this._maxY - this._minY);
                this.value = Math.max(Math.min(newValue, maxValue), minValue);
                this._dispatchChangeEvent();
            })
            .onDoubleTap(() => {
                this.value = this._initialValue;
                this._dispatchChangeEvent();
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

customElements.define('vertical-slider', VerticalSlider);
