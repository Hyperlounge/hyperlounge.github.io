import AudioModule from './AudioModule.js';

export default class EnvelopeModule extends AudioModule {

    _initialise() {
        super._initialise();

        const context = this._audioContext;

        this._envelope = new ConstantSourceNode(context, {offset: 0});
        this._envelope.start();
        this._eventBus.addEventListener('noteon', evt => this._onNoteOn(evt));
        this._eventBus.addEventListener('noteoff', evt => this._onNoteOff(evt));
        this._currentMIDINote = undefined;
    }

    get _initialState() {
        return {
            attackSeconds: 0,
            decaySeconds: 0,
            sustainLevel: 1,
            releaseSeconds: 0,
            velocityAmount: 1,
        };
    }

    _onNoteOn(evt) {
        const { offset } = this._envelope;
        const { velocity, MIDINote } = evt.detail;
        const { attackSeconds, decaySeconds, sustainLevel, velocityAmount } = this._patch.attributes;
        const maxGain = velocity * velocityAmount + (1 - velocityAmount);
        const sustain = sustainLevel * maxGain;
        const attack = Math.max(this._minimumTimeConstant, attackSeconds);
        const decay = Math.max(this._minimumTimeConstant, decaySeconds);
        if (offset.value === 0) offset.setValueAtTime(0, this._now);
        offset.cancelAndHoldAtTime(this._now)
            .linearRampToValueAtTime(maxGain, this._now + attack)
            .setTargetAtTime(sustain, this._now + attack, decay);
        this._currentMIDINote = MIDINote;
    }

    _onNoteOff(evt) {
        const { MIDINote } = evt.detail;
        //if ( MIDINote === this._currentMIDINote ) {
            const { offset } = this._envelope;
            const { releaseSeconds } = this._patch.attributes;
            const release = Math.max(this._minimumTimeConstant, releaseSeconds);
            offset.cancelAndHoldAtTime(this._now)
                .setTargetAtTime(0, this._now, release);
        //}
    }

    get envelopeOut() {
        return this._envelope;
    }
}
