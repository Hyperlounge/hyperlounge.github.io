
import PropTypes from './helpers/PropTypes.js';
import addTwiddling from './helpers/addTwiddling.js';

const LABELS_LEFT = 'left';
const LABELS_RIGHT = 'right';
const LABELS_AROUND = 'around';


export default class RotarySwitch extends HTMLElement {
    static propTypes = {
        id: PropTypes.string,
        class: PropTypes.string,
        style: PropTypes.string,
        capColor: PropTypes.string.default('yellow').observed,
        title: PropTypes.string.default('Title').observed,
        labels: PropTypes.string.lookup([LABELS_LEFT, LABELS_RIGHT, LABELS_AROUND]).default(LABELS_AROUND),
    }

    static template = data => `
<style>
    .rotary-switch {
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
    }
</style>
<div class="rotary-switch">
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
        this._minAngle = (this._props.labels === LABELS_RIGHT ? 1.2 : 0.2) * Math.PI;
        this._maxAngle = (this._props.labels === LABELS_LEFT ? 0.8 : 1.8) * Math.PI;
        this._selectedIndex = 0;

        this._options = Array.from(this.querySelectorAll('option')).map((option, i) => {
            if (option.selected) {
                this._selectedIndex = i;
            }
            return {
                label: option.innerHTML,
                value: option.value,
                style: option.style,
            };
        });

        const data = {
            ...this._props,
        }
        this._root.innerHTML = RotarySwitch.template(data);
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
        const rotor = this._root.querySelector('.rotor');
        rotor.style.transform = `rotate(${this._options[this._selectedIndex].angle + Math.PI}rad)`;
    }

    _drawScale() {
        const rotor = this._root.querySelector('.rotor');
        const rotorRadius = rotor.offsetWidth / 2;
        const rotorCenter = {
            x: rotor.offsetLeft + rotorRadius,
            y: rotor.offsetTop + rotorRadius,
        };
        const labelRadius = rotorRadius + 8;
        const angleStep = (this._maxAngle - this._minAngle) / (this._options.length - 1);
        let angle = this._minAngle;
        const rotarySwitch = this._root.querySelector('.rotary-switch');

        this._options.forEach(option => {
            option.angle = angle;

            const tick = document.createElement('div');
            tick.classList.add('tick');
            rotarySwitch.append(tick);
            tick.style.position = 'absolute';
            tick.style.top = (rotorCenter.y + Math.cos(angle) * rotorRadius) + 'px';
            tick.style.left = (rotorCenter.x - Math.sin(angle) * rotorRadius) + 'px';
            tick.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;

            const label = document.createElement('div');
            label.classList.add('label');
            label.innerHTML = option.label;
            rotarySwitch.append(label);
            label.style.position = 'absolute';
            label.style.top = (rotorCenter.y + Math.cos(angle) * labelRadius) + 'px';
            label.style.left = (rotorCenter.x - Math.sin(angle) * labelRadius) + 'px';
            const translateX = option.style.textAlign ? {
                right: '-100%',
                left: '0',
                center: '-50%',
            }[option.style.textAlign] : {
                [LABELS_LEFT]: '-100%',
                [LABELS_RIGHT]: '0',
                [LABELS_AROUND]: '-50%',
            }[this._props.labels];
            label.style.transform = `translate(${translateX}, -50%)`;
            angle += angleStep;
        });
    }

    _addControlListeners() {
        const {minValue, maxValue} = this._props;

        const rotor = this._root.querySelector('.rotor');
        let startIndex;

        addTwiddling(rotor)
            .onStart(() => {
                startIndex = this._selectedIndex;
            })
            .onTwiddle((deltaX, deltaY) => {
                let newIndex = startIndex - Math.round((deltaY * (this._props.labels === LABELS_RIGHT ? -1 : 1) - deltaX) / 10);
                newIndex = Math.max(0, Math.min(this._options.length - 1, newIndex));
                if (newIndex !== this._selectedIndex) {
                    this._selectedIndex = newIndex;
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
        return this._options[this._selectedIndex].value;
    }

    set value(newValue) {
        const option = this._options.find(item => item.value === newValue);
        this._selectedIndex = this._options.indexOf(option);
        this._updateView();
    }
}

customElements.define('rotary-switch', RotarySwitch);
