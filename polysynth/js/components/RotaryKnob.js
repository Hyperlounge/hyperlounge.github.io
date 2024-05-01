
import PropTypes from './helpers/PropTypes.js';
import addTwiddling from './helpers/addTwiddling.js';

export default class RotaryKnob extends HTMLElement {
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
    .rotary-knob {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-items: center;
        position: relative;
    }
    .title {
        text-align: center;
    }
    .rotor {
        width: 40px;
        height: 40px;
        border: 4px solid black;
        border-radius: 100%;
        background-color: ${data.capColor};
        text-align: center;
        margin: 1.5em;
    }
    .indicator {
        display: inline-block;
        width: 2px;
        height: 50%;
        background-color: black;
    }
    .tick {
        display: inline-block;
        width: 1px;
        height: 4px;
        background-color: black;
    }
    .label {
        font-size: 80%;
        transform: translate(-50%, -50%);
    }
</style>
<div class="rotary-knob">
    <div class="title">${data.title}</div>
    
    <div class="rotor">
        <div class="indicator"></div>
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
        this._minAngle = 0.2 * Math.PI;
        this._maxAngle = 1.8 * Math.PI;

        const data = {
            ...this._props,
            title: this._title,
        }
        this._root.innerHTML = RotaryKnob.template(data);
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
        const rotor = this._root.querySelector('.rotor');
        this._rotorAngle = -Math.PI + this._minAngle + (value-minValue)/(maxValue-minValue) * (this._maxAngle-this._minAngle);
        rotor.style.transform = `rotate(${this._rotorAngle}rad)`;
    }

    _drawScale() {
        const {scaleMin, scaleMax, scaleStep} = this._props;

        const rotor = this._root.querySelector('.rotor');
        const rotorRadius = rotor.offsetWidth / 2;
        const rotorCenter = {
            x: rotor.offsetLeft + rotorRadius,
            y: rotor.offsetTop + rotorRadius,
        };
        const labelRadius = rotorRadius + 8;
        const angleStep = 1.6 * Math.PI * scaleStep / (scaleMax - scaleMin);
        let angle = this._minAngle;

        const rotaryKnob = this._root.querySelector('.rotary-knob');

        for (let notch = scaleMin; notch <= scaleMax; notch += scaleStep) {
            const tick = document.createElement('div');
            tick.classList.add('tick');
            rotaryKnob.append(tick);
            tick.style.position = 'absolute';
            tick.style.top = (rotorCenter.y + Math.cos(angle) * rotorRadius) + 'px';
            tick.style.left = (rotorCenter.x - Math.sin(angle) * rotorRadius) + 'px';
            tick.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;

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
            rotaryKnob.append(label);
            label.style.position = 'absolute';
            label.style.top = (rotorCenter.y + Math.cos(angle) * labelRadius) + 'px';
            label.style.left = (rotorCenter.x - Math.sin(angle) * labelRadius) + 'px';
            angle += angleStep;
        }
    }

    _addControlListeners() {
        const {minValue, maxValue} = this._props;

        const rotor = this._root.querySelector('.rotor');
        let startValue;

        addTwiddling(rotor)
            .onStart(() => {
                startValue = this._props.value;
            })
            .onTwiddle((deltaX, deltaY) => {
                let newValue = startValue + (deltaX - deltaY) * (maxValue - minValue) / 100;
                this._props.value = Math.max(Math.min(newValue, maxValue), minValue);
                this._updateView();
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

customElements.define('rotary-knob', RotaryKnob);
