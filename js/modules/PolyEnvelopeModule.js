import AudioModule from './AudioModule.js';
import PolyConstantSource from './PolyConstantSource.js';
import NoteChangeEvent from '../events/NoteChangeEvent.js';

export default class PolyEnvelopeModule extends AudioModule {

    _initialise() {
        super._initialise();

        const context = this._audioContext;

        this._envelope = new PolyConstantSource(context, {offset: 0});
        this._eventBus.addEventListener(NoteChangeEvent.type, evt => this._onNoteChange(evt));
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

    _onNoteChange(evt) {
        const { newNoteNumber, oldNoteNumber, voiceNumber, velocity } = evt.detail;
        const { offset } = this._envelope.nodes[voiceNumber];
        const { totalVoices, legato } = this._globalPatch.attributes;
        if (newNoteNumber !== undefined) {
            if (!(legato && oldNoteNumber !== undefined)) {
                const { attackSeconds, decaySeconds, sustainLevel, velocityAmount } = this._patch.attributes;
                const maxGain = velocity * velocityAmount + (1 - velocityAmount);
                const sustain = sustainLevel * maxGain;
                const attack = Math.max(this._minimumTimeConstant, attackSeconds);
                const decay = Math.max(this._minimumTimeConstant, decaySeconds);
                if (offset.value === 0) offset.setValueAtTime(0, this._now);
                offset.cancelAndHoldAtTime(this._now)
                    .linearRampToValueAtTime(maxGain, this._now + attack)
                    .setTargetAtTime(sustain, this._now + attack, decay);
            }
        } else {
            const { releaseSeconds } = this._patch.attributes;
            const release = Math.max(this._minimumTimeConstant, releaseSeconds);
            offset.cancelAndHoldAtTime(this._now)
                .setTargetAtTime(0, this._now, release);
        }
    }

    get envelopeOut() {
        return this._envelope;
    }
}
