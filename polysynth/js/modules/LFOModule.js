import AudioModule from './AudioModule.js';
import NoteChangeEvent from '../events/NoteChangeEvent.js';

export default class LFOModule extends AudioModule {
    _initialise() {
        const context = this._audioContext;

        this._modWheelValue = 0;

        this._level = new GainNode(context, {gain: 0});

        this._modWheelNode = new ConstantSourceNode(context, {offset: 0});
        this._modWheelNode.start();
        this._modWheelNode.connect(this._level.gain);

        this._fixedNode = new ConstantSourceNode(context, {offset: 1});
        this._fixedNode.start();
        this._fixedNode.connect(this._level.gain);

        this._noiseNode = new GainNode(context, {gain: 1});
        this._oscillatorNode = new OscillatorNode(context);
        this._oscillatorNode.start()
        this._oscillatorNode.connect(this._level);
        this._sampleAndHold = new ConstantSourceNode(context);
        this._sampleAndHold.start();

        this._eventBus.addEventListener('modwheel', evt => this._onModWheelChange(evt));
        this._update();

        this._eventBus.addEventListener(NoteChangeEvent.type, evt => this._onNoteChange(evt));
    }

    get _initialPatch() {
        return {
            waveform: 'sine',   // sine, triangle, sawtooth, inverse-sawtooth, square, sample-hold, noise
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
            this._fixedNode.offset.cancelScheduledValues(this._now);
            this._fixedNode.offset.setTargetAtTime(0, this._now, 0);
            const level = fixedAmount * (waveform === 'inverse-sawtooth' ? -1 : 1);
            this._fixedNode.offset.linearRampToValueAtTime(0, this._now + delay / 2)
            this._fixedNode.offset.linearRampToValueAtTime(level, this._now + delay * 2);
        }
    }

    _onModWheelChange(evt) {
        this._modWheelValue = evt.detail.value;
        this._setModWheelOffset();
    }

    _setModWheelOffset() {
        let offset = this._patch.get('modWheelAmount') * this._modWheelValue/10;
        if (this._patch.get('waveform') === 'inverse-sawtooth') {
            offset = -offset;
        }
        console.log(offset);
        this._modWheelNode.offset.setTargetAtTime(offset, this._now, this._minimumTimeConstant);
    }

    _onPatchChange(evt) {
        super._onPatchChange(evt);
        this._update();
    }

    _update() {
        const frequency = this._patch.get('frequency');
        let type = this._patch.get('waveform');
        let previousType = this._patch.previousAttributes.waveform;
        let multiplier = 1;
        if (type === 'sample-hold') {
            if (this._sampleAndHoldTimer === undefined) {
                if (previousType === 'noise') {
                    this._noiseNode.disconnect(this._level);
                } else if (previousType !== 'sample-hold') {
                    this._oscillatorNode.disconnect(this._level);
                }
                this._sampleAndHold.connect(this._level);
            }
            if (this._patch.hasChanged('frequency') || this._patch.hasChanged('waveform')) {
                if (this._sampleAndHoldTimer !== undefined) {
                    clearInterval(this._sampleAndHoldTimer);
                }
                this._sampleAndHoldTimer = setInterval(() => {
                    this._sampleAndHold.offset.setValueAtTime(Math.random() * 2 - 1, this._now);
                }, 1000 / frequency);
            }
        } else {
            if (this._sampleAndHoldTimer !== undefined) {
                clearInterval(this._sampleAndHoldTimer);
                delete this._sampleAndHoldTimer;
            }
            if (type === 'noise') {
                if (previousType === 'sample-hold') {
                    this._sampleAndHold.disconnect(this._level);
                } else if (previousType !== 'noise') {
                    this._oscillatorNode.disconnect(this._level);
                }
                this._noiseNode.connect(this._level);
            } else {
                if (previousType === 'sample-hold') {
                    this._sampleAndHold.disconnect(this._level);
                } else if (previousType === 'noise') {
                    this._noiseNode.disconnect(this._level);
                }
                this._oscillatorNode.connect(this._level);

                if (type === 'inverse-sawtooth') {
                    type = 'sawtooth'
                    multiplier = -1;
                }
                this._oscillatorNode.type = type;
                this._oscillatorNode.frequency.setTargetAtTime(frequency, this._now, this._minimumTimeConstant);
            }
        }
        const level = this._patch.get('fixedAmount') * multiplier;
        this._fixedNode.offset.cancelScheduledValues(this._now).setTargetAtTime(level, this._now, this._minimumTimeConstant);
        this._setModWheelOffset();
    }

    get lfoOut() {
        return this._level;
    }

    get noiseIn() {
        return this._noiseNode;
    }
}
