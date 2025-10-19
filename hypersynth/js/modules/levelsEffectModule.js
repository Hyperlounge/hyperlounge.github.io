import AudioModule from './AudioModule.js';

export default class LevelsEffectModule extends AudioModule {
    _initialise() {
        const context = this._audioContext;

        this._audioIn = new GainNode(context, {gain: 1});
        this._audioOut = new GainNode(context, {gain: 1});
        this._bass = new BiquadFilterNode(context, {type: 'lowshelf', frequency: 100, gain: 0});
        this._treble = new BiquadFilterNode(context, {type: 'highshelf', frequency: 1000, gain: 0});
        
        this._update();
    }

    get _initialPatch() {
        return {
            power: false,
            bass: 0,       // -1 - 1
            treble: 0,      // -1 - 1
            master: 0.5,        // 0 - 1
        };
    }

    _onPatchChange(evt) {
        super._onPatchChange(evt);
        this._update();
    }

    _update() {
        const power = this._patch.get('power');
        const bass = this._patch.get('bass');
        const treble = this._patch.get('treble');
        const master = this._patch.get('master');

        if (this._patch.hasChanged('power')) {
            if (power) {

                this._audioIn.disconnect();

                this._audioIn.connect(this._bass);
                this._audioIn.connect(this._treble);
                this._bass.connect(this._audioOut);
                this._treble.connect(this._audioOut);

            } else {

                this._audioIn.disconnect();
                this._audioIn.disconnect();
                this._bass.disconnect();
                this._treble.disconnect();

                this._audioIn.connect(this._audioOut);
                this._audioOut.gain.setTargetAtTime(1, this._now, this._minimumTimeConstant);
            }
        }

        this._bass.gain.setTargetAtTime(bass*50, this._now, this._minimumTimeConstant);
        this._treble.gain.setTargetAtTime(treble*20, this._now, this._minimumTimeConstant);
        if (power) {
            this._audioOut.gain.setTargetAtTime(master*3, this._now, this._minimumTimeConstant);
        }
    }

    get audioOut() {
        return this._audioOut;
    }

    get audioIn() {
        return this._audioIn;
    }
}
