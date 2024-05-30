
import PropTypes from './helpers/PropTypes.js';
import addTwiddling from './helpers/addTwiddling.js';

const KEYBOARD_SVG = '<svg width="100%" height="100%" viewBox="0 0 182 114" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><rect x="0" y="0" width="181.417" height="113.386" style="fill:transparent;"/><path d="M31.181,0l-15.388,0l0,67.019c0,2.123 1.724,3.847 3.847,3.847l7.694,0c2.123,0 3.847,-1.724 3.847,-3.847l0,-67.019Z"/><path d="M61.874,0l-15.388,0l0,67.019c0,2.123 1.724,3.847 3.847,3.847l7.694,0c2.123,0 3.847,-1.724 3.847,-3.847l0,-67.019Z"/><path d="M107.431,0l-15.388,0l0,67.019c0,2.123 1.724,3.847 3.847,3.847l7.694,0c2.123,0 3.847,-1.724 3.847,-3.847l0,-67.019Z"/><path d="M137.278,0l-15.388,0l-0,67.019c-0,2.123 1.724,3.847 3.847,3.847l7.694,0c2.123,0 3.847,-1.724 3.847,-3.847l-0,-67.019Z"/><path d="M167.154,0l-15.388,0l0,67.019c0,2.123 1.724,3.847 3.847,3.847l7.694,0c2.123,0 3.847,-1.724 3.847,-3.847l0,-67.019Z"/></svg>'

const MIDDLE_C = 60;

const isEbony = note => {
    const noteInOctave = note % 12;
    return [1, 3, 6, 8, 10].includes(noteInOctave);
};

export default class KeyboardAdjuster extends HTMLElement {
    static propTypes = {
        id: PropTypes.string,
        class: PropTypes.string,
        style: PropTypes.string,
        minNote: PropTypes.number.default(21),
        maxNote: PropTypes.number.default(108),
        bottomNote: PropTypes.number.default(36).observed,
        topNote: PropTypes.number.default(96).observed,
        middleCColor: PropTypes.string.default('yellow'),
    }

    static template = data => {
        return `
<style>
    :host {
        position: relative;
    }
    .keyboard-adjuster {
        position: absolute;
        width: 100%;
        height: 100%;
    }
    
    .background {
        position: absolute;
        left: ${50 / data.whiteNotes.length}%;
        right: ${100 / data.whiteNotes.length}%;
        height: 100%;
        background-image: url('data:image/svg+xml,${encodeURI(KEYBOARD_SVG)}');
        background-repeat: repeat-x;
        background-size: ${700 / (data.whiteNotes.length - 1.5)}% 100%;
        background-position-x: right;
    }
    
    .middle-c {
        position: absolute;
        left: ${100 * (data.whiteNotes.indexOf(MIDDLE_C) / data.whiteNotes.length)}%;
        width: ${100 / data.whiteNotes.length}%;
        height: 100%;
        background-color: ${data.middleCColor};
    }
    
    .mask {
        position: absolute;
        height: 100%;;
        background-color: #333333;
        opacity: 0.33;
    }
    
    .mask.low-mask {
        left: 0;
    }
    
    .mask.high-mask {
        right: 0;
    }
    
</style>
<div class="keyboard-adjuster">
    <div class="middle-c"></div>
    <div class="background"></div>
    <div class="mask low-mask"></div>
    <div class="mask high-mask"></div>
</div>
    `;
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this._root = this.attachShadow({mode: 'open'});
        this._props = PropTypes.attributesToProps(this);
        this._title = this.innerHTML;
        this._whiteNotes = [];
        for (let note = this._props.minNote; note <= this._props.maxNote; note++) {
            if (! isEbony(note)) {
                this._whiteNotes.push(note);
            }
        }

        this._initialValue = this._data.value;
        this._root.innerHTML = KeyboardAdjuster.template(this._data);
        this._updateView();
        this._addControlListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this._root) {
            this._props[name] = PropTypes.attributesToProps(this, name);
            this._updateView();
        }
    }

    get _data() {
        return {
            ...this._props,
            title: this._title,
            whiteNotes: this._whiteNotes,
        }
    }

    _updateView() {
        const lowMask = this._root.querySelector('.low-mask');
        const highMask = this._root.querySelector('.high-mask');
        const { whiteNotes } = this._data;
        lowMask.style.width = `${100 * (whiteNotes.indexOf(this._props.bottomNote) / whiteNotes.length)}%`;
        highMask.style.left = `${100 * ((whiteNotes.indexOf(this._props.topNote) + 1) / whiteNotes.length)}%`;
    }

    _addControlListeners() {
        const adjuster = this._root.querySelector('.keyboard-adjuster');
        const { whiteNotes } = this._data;
        let startBottomNote, startTopNote, twiddleAction, trackWidth;
        addTwiddling(adjuster)
            .onStart((targetX, targetY) => {
                startBottomNote = whiteNotes.indexOf(this._props.bottomNote);
                startTopNote = whiteNotes.indexOf(this._props.topNote);
                trackWidth = adjuster.offsetWidth;
                const lowerBoundary = Math.max(trackWidth/10, trackWidth * startBottomNote/whiteNotes.length);
                const upperBoundary = Math.min(trackWidth * 9/10, trackWidth * startTopNote/whiteNotes.length);
                if (targetX <= lowerBoundary) {
                    twiddleAction = 'bottom';
                } else if (targetX >= upperBoundary) {
                    twiddleAction = 'top';
                } else {
                    twiddleAction = 'transpose';
                }
            })
            .onTwiddle(deltaX => {
                let deltaNote = Math.round(whiteNotes.length * deltaX / trackWidth);
                const prevBottomNote = this.bottomNote;
                const prevTopNote = this.topNote;
                switch (twiddleAction) {
                    case 'bottom':
                        deltaNote = Math.max(deltaNote, -startBottomNote);
                        deltaNote = Math.min(deltaNote, startTopNote - startBottomNote - 14);
                        this.bottomNote = whiteNotes[startBottomNote + deltaNote];
                        break;
                    case 'top':
                        deltaNote = Math.min(deltaNote, whiteNotes.length - 1 - startTopNote);
                        deltaNote = Math.max(deltaNote, -(startTopNote - startBottomNote - 14));
                        this.topNote = whiteNotes[startTopNote + deltaNote];
                        break;
                    case 'transpose':
                        deltaNote = Math.max(deltaNote, -startBottomNote);
                        deltaNote = Math.min(deltaNote, whiteNotes.length - 1 - startTopNote);
                        this.bottomNote = whiteNotes[startBottomNote + deltaNote];
                        this.topNote = whiteNotes[startTopNote + deltaNote];
                        break;
                }
                if (this.bottomNote !== prevBottomNote || this.topNote !== prevTopNote) {
                    this._dispatchChangeEvent();
                }
            });
    }

    _dispatchChangeEvent() {
        const evt = new CustomEvent('input');
        this.dispatchEvent(evt);
    }

    get bottomNote() {
        return this._props.bottomNote;
    }

    set bottomNote(newValue) {
        this._props.bottomNote = Number(newValue);
        this._updateView();
    }

    get topNote() {
        return this._props.topNote;
    }

    set topNote(newValue) {
        this._props.topNote = Number(newValue);
        this._updateView();
    }
}

customElements.define('keyboard-adjuster', KeyboardAdjuster);
