
import PropTypes from './helpers/PropTypes.js';
import addTwiddling from './helpers/addTwiddling.js';
import AbstractComponent from './AbstractComponent.js';

export default class RotaryKnob extends AbstractComponent {
    static propTypes = {
        ...AbstractComponent.propTypes,
        scaleMin: PropTypes.number.default(0),
        scaleMax: PropTypes.number.default(10),
        scaleStep: PropTypes.number.default(1),
        scaleMinLabel: PropTypes.string.default(''),
        scaleMaxLabel: PropTypes.string.default(''),
        minimal: PropTypes.bool.default(false),
        value: PropTypes.number.default(0).observed,
        minValue: PropTypes.number.default(0),
        maxValue: PropTypes.number.default(1),
        logarithmic: PropTypes.bool.default(false),
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
        super.connectedCallback();
        this._title = this.innerHTML;
        this._minAngle = 1.2 * Math.PI;
        this._maxAngle = 2.8 * Math.PI;
        this._rotorAngle = this._minAngle;

        const {minValue, maxValue, logarithmic} = this._props;
        if (logarithmic) {
            if (minValue === 0) {
                this._toRatio = AbstractComponent.logToLinear(maxValue, 1);
                this._fromRatio = AbstractComponent.linearToLog(1, maxValue);
            } else {
                this._toRatio = AbstractComponent.logRangeToLinear(minValue, maxValue, 1);
                this._fromRatio = AbstractComponent.linearToLogRange(1, minValue, maxValue);
            }
        } else {
            this._toRatio = a => (a-minValue)/(maxValue-minValue);
            this._fromRatio = a => minValue + a*(maxValue-minValue);
        }

        const data = {
            ...this._props,
            title: this._title,
        }

        this._initialValue = data.value;
        this._root.innerHTML = RotaryKnob.template(data);
        this._drawScale();
        this._updateView();
        this._addControlListeners();
    }

    _updateView() {
        const rotor = this._root.querySelector('.rotor');
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
        let angle = this._minAngle - Math.PI;

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
                if (this._props.scaleMinLabel) {
                    label.innerHTML = this._props.scaleMinLabel;
                } else {
                    label.innerHTML = String(rounded).replace(/-/, '&minus;');
                }
            } else if (notch === scaleMax) {
                if (this._props.scaleMaxLabel) {
                    label.innerHTML = this._props.scaleMaxLabel;
                } else {
                    label.innerHTML = '+' + rounded;
                }
            }
            rotaryKnob.append(label);
            label.style.position = 'absolute';
            label.style.top = (rotorCenter.y + Math.cos(angle) * labelRadius) + 'px';
            label.style.left = (rotorCenter.x - Math.sin(angle) * labelRadius) + 'px';
            angle += angleStep;
        }
    }

    _addControlListeners() {
        const rotor = this._root.querySelector('.rotor');
        let startAngle;

        addTwiddling(rotor)
            .onStart(() => {
                startAngle = this._rotorAngle;
            })
            .onTwiddle((deltaX, deltaY) => {
                this._rotorAngle = startAngle + (deltaX - deltaY) / 25;
                this._rotorAngle = Math.max(Math.min(this._rotorAngle, this._maxAngle), this._minAngle);
                this._updateView();
                this.dispatchChangeEvent();
            })
            .onDoubleTap(() => {
                this.value = this._initialValue;
                this.dispatchChangeEvent();
            });
    }

    get value() {
        const ratio = (this._rotorAngle-this._minAngle)/(this._maxAngle-this._minAngle);
        return this._fromRatio(ratio);
    }

    set value(newValue) {
        const value = Number(newValue);
        const ratio = this._toRatio(value);
        this._rotorAngle = this._minAngle + ratio * (this._maxAngle-this._minAngle);
        this._updateView();
    }
}

customElements.define('rotary-knob', RotaryKnob);
