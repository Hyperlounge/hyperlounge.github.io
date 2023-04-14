import AudioModule from './AudioModule.js';
import PolyConstantSource from './PolyConstantSource.js';
import NoteChangeEvent from '../events/NoteChangeEvent.js';

function midiNoteToHertz(midiNote) {
    return 440 * Math.pow(2, (midiNote - 69)/12);
}

const C4 = midiNoteToHertz(60);

function noteToStretchFactor(note) {
    return 0.3 + 0.7 * C4 / midiNoteToHertz(note);
}

export default class PolyEnvelopeModule extends AudioModule {

    _initialise() {
        super._initialise();

        const context = this._audioContext;
        this._sustain = false;
        this._sustainedNotes = [];

        this._envelope = new PolyConstantSource(context, {offset: 0});
        this._eventBus.addEventListener(NoteChangeEvent.type, evt => this._onNoteChange(evt));
        this._eventBus.addEventListener('sustainchange', evt => this._onSustainChange(evt));
     }

    get _initialPatch() {
        return {
            attackSeconds: 0,
            decaySeconds: 0,
            sustainLevel: 1,
            releaseSeconds: 0,
            velocityAmount: 1,
        };
    }

    _onSustainChange(evt) {
        const { envelopeStretch } = this._globalPatch.attributes;
        if (this._sustain && !evt.detail.isOn) {
            this._sustainedNotes.forEach(item => {
                const { voiceNumber, note } = item;
                const stretchFactor = envelopeStretch ? noteToStretchFactor(note) : 1;
                const { offset } = this._envelope.nodes[voiceNumber];
                const { releaseSeconds } = this._patch.attributes;
                const release = Math.max(this._minimumTimeConstant, releaseSeconds);
                offset.cancelScheduledValues(this._now)
                    .setTargetAtTime(0, this._now, release);
            });
            this._sustainedNotes = [];
        }
        this._sustain = evt.detail.isOn;
    }

    _onNoteChange(evt) {
        const { newNoteNumber, oldNoteNumber, voiceNumber, velocity } = evt.detail;
        const { offset } = this._envelope.nodes[voiceNumber];
        const { legato, envelopeStretch } = this._globalPatch.attributes;
        if (newNoteNumber !== undefined) {
            if (!(legato && oldNoteNumber !== undefined)) {
                const stretchFactor = envelopeStretch ? noteToStretchFactor(newNoteNumber) : 1;
                const { attackSeconds, decaySeconds, sustainLevel, velocityAmount } = this._patch.attributes;
                const maxGain = velocity/64 * velocityAmount + (1 - velocityAmount);
                const sustain = sustainLevel * maxGain;
                const attack = Math.max(this._minimumTimeConstant, attackSeconds);
                const decay = Math.max(this._minimumTimeConstant, decaySeconds * stretchFactor);
                if (offset.value === 0) offset.setValueAtTime(0, this._now);
                offset.cancelScheduledValues(this._now)
                    .linearRampToValueAtTime(maxGain, this._now + attack)
                    .setTargetAtTime(sustain, this._now + attack, decay);
                this._sustainedNotes = this._sustainedNotes.filter(item => item.voiceNumber !== voiceNumber);
            }
        } else if (this._sustain) {
            this._sustainedNotes = this._sustainedNotes.filter(item => item.voiceNumber !== voiceNumber);
            this._sustainedNotes.push({voiceNumber, note: oldNoteNumber})
        } else {
            const stretchFactor = envelopeStretch ? noteToStretchFactor(oldNoteNumber) : 1;
            const { releaseSeconds } = this._patch.attributes;
            const release = Math.max(this._minimumTimeConstant, releaseSeconds * stretchFactor);
            offset.cancelAndHoldAtTime(this._now)
                .setTargetAtTime(0, this._now, release);
        }
    }

    get envelopeOut() {
        return this._envelope;
    }
}
