import AudioModule from './AudioModule.js';

export default class DelayEffectModule extends AudioModule {
    _initialise() {
        const context = this._audioContext;

        this._audioIn = new GainNode(context, {gain: 1});
        this._audioOut = new GainNode(context, {gain: 1});
        this._panner1 = new StereoPannerNode(context, {pan: 0});
        this._delay1 = context.createDelay(10);
        this._panner2 = new StereoPannerNode(context, {pan: 0});
        this._delay2 = context.createDelay(10);
        this._feedback1 = new GainNode(context, {gain: 0.5});
        this._feedback2 = new GainNode(context, {gain: 0.5});
        this._dryLevel = new GainNode(context, {gain: 0.5});
        this._wetLevel = new GainNode(context, {gain: 0.5});

        this._delay1.connect(this._feedback1);
        this._delay1.connect(this._panner1);
        this._panner1.connect(this._wetLevel);
        this._feedback1.connect(this._delay2);

        this._delay2.connect(this._feedback2);
        this._delay2.connect(this._panner2);
        this._panner2.connect(this._wetLevel);
        this._feedback2.connect(this._delay1);

        this._update();
    }

    get _initialPatch() {
        return {
            power: false,
            mix: 0.5,       // 0 - 1
            time: 0.1,      // 0 - 1
            feedback: 0.5,  // 0 - 1
            spread: 0,    // -1 - 1
        };
    }

    _onPatchChange(evt) {
        super._onPatchChange(evt);
        this._update();
    }

    _update() {
        const power = this._patch.get('power');
        const mix = this._patch.get('mix');
        const time = this._patch.get('time');
        const feedback = this._patch.get('feedback');
        const spread = this._patch.get('spread');

        if (this._patch.hasChanged('power')) {
            if (power) {

                this._audioIn.disconnect();

                this._audioIn.connect(this._delay1);
                this._audioIn.connect(this._dryLevel);
                this._dryLevel.connect(this._audioOut);
                this._wetLevel.connect(this._audioOut);

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
            this._wetLevel.gain.setTargetAtTime(mix * 2, this._now, this._minimumTimeConstant);
        } else {
            this._wetLevel.gain.setTargetAtTime(1, this._now, this._minimumTimeConstant);
            this._dryLevel.gain.setTargetAtTime((1-mix) * 2, this._now, this._minimumTimeConstant);
        }

        this._delay1.delayTime.setTargetAtTime(time*10, this._now, this._minimumTimeConstant);
        this._delay2.delayTime.setTargetAtTime(time*10, this._now, this._minimumTimeConstant);
        this._feedback1.gain.setTargetAtTime(feedback, this._now, this._minimumTimeConstant);
        this._feedback2.gain.setTargetAtTime(feedback, this._now, this._minimumTimeConstant);
        this._panner1.pan.setTargetAtTime(spread, this._now, this._minimumTimeConstant);
        this._panner2.pan.setTargetAtTime(spread*-1, this._now, this._minimumTimeConstant);
    }

    get audioOut() {
        return this._audioOut;
    }

    get audioIn() {
        return this._audioIn;
    }
}
