import AudioModule from './AudioModule.js';
import PolyOscillator from './PolyOscillator.js';
import PolyGain from './PolyGain.js';

function midiNoteToHertz(miniNote) {
    return 440 * Math.pow(2, (miniNote - 69)/12);
}

const C4 = midiNoteToHertz(60);

export default class PolyOscillatorModule extends AudioModule {
    _initialise() {
        const context = this._audioContext;

        this._oscillatorNode = new PolyOscillator(context, {
            type: this._patch.get('waveform'),
            frequency: this._hertzFromPatch,
        });
        this._modulation = new GainNode(context, {gain: this._patch.get('modAmount')});
        this._oscillatorNode.detune.fanOutConnectFrom(this._modulation);

        this._crossModulation = new PolyGain(context, {gain: this._patch.get('crossModAmount')});
        this._crossModulation.polyConnectTo(this._oscillatorNode.detune);
    }

    get _initialPatch() {
        return {
            waveform: 'sine',
            range: 0,       // 0 = C4, 1 = C5 etc
            tune: 0,        // 1 = 1 semitone
            fineTune: 0,    // 1 = 1 cent
            modAmount: 100, // 1 = 100 cents
            crossModAmount: 0,
        };
    }

    _onPatchChange(evt) {
        super._onPatchChange(evt);
        this._update();
    }

    get _hertzFromPatch() {
        const { range, tune, fineTune } = this._patch.attributes;
        return midiNoteToHertz(60 + range * 12 + tune + fineTune/100);
    }

    _update() {
        this._oscillatorNode.type = this._patch.get('waveform');
        this._oscillatorNode.frequency.setTargetAtTime(this._hertzFromPatch, this._now, this._minimumTimeConstant);
        this._modulation.gain.setTargetAtTime(this._patch.get('modAmount'), this._now, this._minimumTimeConstant);
        this._crossModulation.gain.setTargetAtTime(this._patch.get('crossModAmount'), this._now, this._minimumTimeConstant);
    }

    get offsetCentsIn() {
        return this._oscillatorNode.detune;
    }

    get modulationIn() {
        return this._modulation;
    }

    get crossModulationIn() {
        return this._crossModulation;
    }

    get audioOut() {
        return this._oscillatorNode;
    }
}
