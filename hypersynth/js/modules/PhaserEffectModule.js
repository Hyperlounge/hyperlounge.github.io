import AudioModule from './AudioModule.js';

export default class PhaserEffectModule extends AudioModule {
    _initialise() {
        const context = this._audioContext;

        this._audioIn = new GainNode(context, {gain: 1});
        this._audioOut = new GainNode(context, {gain: 1});
        this._dryLevel = new GainNode(context, {gain: 0.5});
        this._wetLevel = new GainNode(context, {gain: -0.5});

        this._lfo = new OscillatorNode(context, {type: 'sine', frequency: 1});
        this._gain = new GainNode(context, {gain: 0.1});
        this._delay = new DelayNode(context, {delayTime: 0});
        this._constant = new ConstantSourceNode(context, {offset: 1});
        this._feedback = new GainNode(context, {gain: 0});

        this._lfo.connect(this._gain);
        this._constant.connect(this._gain);
        this._gain.connect(this._delay.delayTime);
        this._delay.connect(this._wetLevel);
        this._feedback.connect(this._delay);

        this._constant.start();
        this._lfo.start();

        this._update();
    }

    get _initialPatch() {
        return {
            power: false,
            mix: 0.5,       // 0 - 1
            rate: 0.1,      // 0.5 - 10
            depth: 1,       // 0 - 1
            resonance: 0.5,  // 0 - 1
            delay: 0,    // 0 - 1
        };
    }

    _onPatchChange(evt) {
        super._onPatchChange(evt);
        this._update();
    }

    _update() {
        const power = this._patch.get('power');
        const mix = this._patch.get('mix');
        const rate = this._patch.get('rate');
        const depth = this._patch.get('depth');
        const resonance = this._patch.get('resonance');
        const delay = this._patch.get('delay');

        if (this._patch.hasChanged('power')) {
            if (power) {

                this._audioIn.disconnect();

                this._audioIn.connect(this._delay);
                this._audioIn.connect(this._dryLevel);
                this._dryLevel.connect(this._audioOut);
                this._wetLevel.connect(this._audioOut);
                this._dryLevel.connect(this._feedback);
                this._wetLevel.connect(this._feedback);

            } else {

                this._audioIn.disconnect();
                this._audioIn.disconnect();
                this._dryLevel.disconnect();
                this._wetLevel.disconnect();

                this._audioIn.connect(this._audioOut);
            }
        }

        if (mix <= 0.5) {
            this._dryLevel.gain.setTargetAtTime(1, this._now, this._minimumTimeConstant);
            this._wetLevel.gain.setTargetAtTime(mix * -2, this._now, this._minimumTimeConstant);
        } else {
            this._wetLevel.gain.setTargetAtTime(-1, this._now, this._minimumTimeConstant);
            this._dryLevel.gain.setTargetAtTime((1-mix) * 2, this._now, this._minimumTimeConstant);
        }

        this._gain.gain.setTargetAtTime(depth*0.1, this._now, this._minimumTimeConstant);
        this._lfo.frequency.setTargetAtTime(rate, this._now, this._minimumTimeConstant);
        this._constant.offset.setTargetAtTime(1 + delay, this._now, this._minimumTimeConstant);
        this._feedback.gain.setTargetAtTime(resonance*1.5, this._now, this._minimumTimeConstant);
    }

    get audioOut() {
        return this._audioOut;
    }

    get audioIn() {
        return this._audioIn;
    }
}
