import AudioModule from './AudioModule.js';

function midiNoteToHertz(miniNote) {
    return 440 * Math.pow(2, (miniNote - 69)/12);
}

const C4 = midiNoteToHertz(60);

export default class FilterModule extends AudioModule {
    _initialise() {
        const context = this._audioContext;

        this._filterNode = new BiquadFilterNode(context, {
            type: this._patch.get('type'),
            frequency: this._patch.get('frequency'),
            Q: this._patch.get('resonance'),
            detune: 0,
        });
        this._modulation = new GainNode(context, {
            gain: this._patch.get('modAmount'),
        });
        this._modulation.connect(this._filterNode.detune);
        this._keyboardFollow = new GainNode(context, {
            gain: this._patch.get('keyboardFollowAmount'),
        });
        this._keyboardFollow.connect(this._filterNode.detune);
        this._envelope = new GainNode(context, {
            gain: this._patch.get('envelopeAmount'),
        });
        this._envelope.connect(this._filterNode.detune);
    }

    get _initialPatch() {
        return {
            type: 'lowpass',    // lowpass, highpass or notch
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
    }

    get offsetCentsIn() {
        return this._filterNode.detune;
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
        return this._filterNode;
    }
}
