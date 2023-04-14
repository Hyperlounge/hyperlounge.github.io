import AudioModule from './AudioModule.js';
import NoteChangeEvent from '../events/NoteChangeEvent.js';

export default class LFOModule extends AudioModule {
    _initialise() {
        const context = this._audioContext;

        this._modWheelValue = 0;
        this._oscillatorNode = new OscillatorNode(context);
        this._level = new GainNode(context, {gain: -1});
        this._oscillatorNode.start()
        this._oscillatorNode.connect(this._level);
        this._sampleAndHold = new ConstantSourceNode(context);
        this._sampleAndHold.start();
        this._sampleAndHold.connect(this._level);
        this._eventBus.addEventListener('modwheel', evt => this._onModWheelChange(evt));
        this._update();

        this._eventBus.addEventListener(NoteChangeEvent.type, evt => this._onNoteChange(evt));
    }

    get _initialPatch() {
        return {
            waveform: 'sine',   // sine, triangle, sawtooth, inverse-sawtooth, square, sample-hold
            frequency: 10,        // hz
            fixedAmount: 0,       // 0 - 1
            modWheelAmount: 0, // 0 - 1
            delay: 0,   // 0 - 10
        };
    }

    _onNoteChange(evt) {
        const { newNoteNumber, oldNoteNumber } = evt.detail;
        const { delay, fixedAmount, modWheelAmount, waveform } = this._patch.attributes;
        if (delay !== 0 && newNoteNumber !== undefined) {
            this._level.gain.setTargetAtTime(0, this._now, 0);
            const level = (fixedAmount + (modWheelAmount * this._modWheelValue)) * (waveform === 'inverse-sawtooth' ? -1 : 1);
            this._level.gain.setTargetAtTime(level, this._now, delay);
        }
    }

    _onModWheelChange(evt) {
        this._modWheelValue = evt.detail.value;
        this._update();
    }

    _onPatchChange(evt) {
        super._onPatchChange(evt);
        this._update();
    }

    _update() {
        const frequency = this._patch.get('frequency');
        let type = this._patch.get('waveform');
        let multiplier = 1;
        if (type === 'sample-hold') {
            if (this._sampleAndHoldTimer === undefined) {
                this._oscillatorNode.disconnect(this._level);
                this._sampleAndHold.connect(this._level);
            }
            if (this._patch.hasChanged('frequency') || this._patch.hasChanged('waveform')) {
                if (this._sampleAndHoldTimer !== undefined) {
                    clearInterval(this._sampleAndHoldTimer);
                }
                this._sampleAndHoldTimer = setInterval(() => {
                    this._sampleAndHold.offset.setValueAtTime(Math.random()*2 - 1, this._now);
                }, 1000 / frequency);
            }
        } else {
            if (this._sampleAndHoldTimer !== undefined) {
                clearInterval(this._sampleAndHoldTimer);
                delete this._sampleAndHoldTimer;
                this._oscillatorNode.connect(this._level);
                this._sampleAndHold.disconnect(this._level);
            }
            if (type === 'inverse-sawtooth') {
                type = 'sawtooth'
                multiplier = -1;
            }
            this._oscillatorNode.type = type;
            this._oscillatorNode.frequency.setTargetAtTime(frequency, this._now, this._minimumTimeConstant);

        }
        const level = (this._patch.get('fixedAmount') + (this._patch.get('modWheelAmount') * this._modWheelValue)) * multiplier;
        this._level.gain.setTargetAtTime(level, this._now, this._minimumTimeConstant);
    }

    get lfoOut() {
        return this._level;
    }
}
