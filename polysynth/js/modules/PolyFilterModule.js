import AudioModule from './AudioModule.js';
import PolyBiquadFilter from './PolyBiquadFilter.js';
import PolyGain from './PolyGain.js';

function midiNoteToHertz(miniNote) {
    return 440 * Math.pow(2, (miniNote - 69)/12);
}

const C4 = midiNoteToHertz(60);

export default class PolyFilterModule extends AudioModule {
    _initialise() {
        const context = this._audioContext;

        this._filterNode = new PolyBiquadFilter(context, {
            type: this._patch.get('type'),
            frequency: this._patch.get('frequency'),
            Q: this._patch.get('resonance'),
            detune: 0,
        });
        this._filterNode2 = new PolyBiquadFilter(context, {
            type: this._patch.get('type'),
            frequency: this._patch.get('frequency'),
            Q: this._patch.get('resonance'),
            detune: 0,
        });
        this._modulation = new GainNode(context, {
            gain: this._patch.get('modAmount'),
        });
        this._filterNode.detune.fanOutConnectFrom(this._modulation);
        this._filterNode2.detune.fanOutConnectFrom(this._modulation);
        this._keyboardFollow = new PolyGain(context, {
            gain: this._patch.get('keyboardFollowAmount'),
        });
        this._keyboardFollow.polyConnectTo(this._filterNode.detune);
        this._envelope = new PolyGain(context, {
            gain: this._patch.get('envelopeAmount'),
        });
        this._filterNode.detune.polyConnectFrom(this._envelope);
        this._filterNode2.detune.polyConnectFrom(this._envelope);
        this._filterNode.polyConnectTo(this._filterNode2);
    }

    get _initialPatch() {
        return {
            type: 'lowpass',    // lowpass, highpass or bandpass
            rolloff: 12,        // 12 or 24 dB / octave
            frequency: C4,      // hertz
            resonance: 1,       //
            modAmount: 0,     // 0 = 100 cents
            keyboardFollowAmount: 1,     // 100 = follow completely
            envelopeAmount: 0,     // 0 = 100 cents
        };
    }

    _onPatchChange(evt) {
        super._onPatchChange(evt);
        this._update();
    }

    _update() {
        this._filterNode.type = this._patch.get('type');
        this._filterNode.frequency.setTargetAtTime(this._patch.get('frequency'), this._now, this._minimumTimeConstant);
        this._filterNode.Q.setTargetAtTime(this._patch.get('resonance'), this._now, this._minimumTimeConstant);
        this._modulation.gain.setTargetAtTime(this._patch.get('modAmount'), this._now, this._minimumTimeConstant);
        this._keyboardFollow.gain.setTargetAtTime(this._patch.get('keyboardFollowAmount'), this._now, this._minimumTimeConstant);
        this._envelope.gain.setTargetAtTime(this._patch.get('envelopeAmount'), this._now, this._minimumTimeConstant);

        if (this._patch.get('rolloff') === 12) {
            this._filterNode2.type = 'lowpass';
            this._filterNode2.frequency.setTargetAtTime(24000, this._now, this._minimumTimeConstant);
            this._filterNode2.Q.setTargetAtTime(0, this._now, this._minimumTimeConstant);
        } else {
            this._filterNode2.type = this._patch.get('type');
            this._filterNode2.frequency.setTargetAtTime(this._patch.get('frequency'), this._now, this._minimumTimeConstant);
            this._filterNode2.Q.setTargetAtTime(this._patch.get('resonance'), this._now, this._minimumTimeConstant);
        }
    }

    get modulationIn() {
        return this._modulation;
    }

    get keyboardFollowIn() {
        return this._keyboardFollow;
    }

    get envelopeIn() {
        return this._envelope;
    }

    get audioIn() {
        return this._filterNode;
    }

    get audioOut() {
        return this._filterNode2;
    }
}
