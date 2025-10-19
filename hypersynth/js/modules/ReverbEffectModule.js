import AudioModule from './AudioModule.js';
import fetchAndCacheBuffers from '../misc/fetchAndCacheBuffers.js';

export default class ReverbEffectModule extends AudioModule {
    _initialise() {
        const context = this._audioContext;
        this._buffers = {};
        this._isFirstUpdate = true;

        fetchAndCacheBuffers(context, [
            'media/irs/small.ogg',
            'media/irs/room.ogg',
            'media/irs/hall.ogg',
        ]).then(cache => {
            cache.forEach(entry => {
                this._buffers[entry.path.replace(/^.*\/(\w+)\.ogg$/, '$1')] = entry.buffer;
            });
            this._update();
        });

        this._audioIn = new GainNode(context, {gain: 1});
        this._audioOut = new GainNode(context, {gain: 1});
        this._dryLevel = new GainNode(context, {gain: 0.5});
        this._wetLevel = new GainNode(context, {gain: 0.5});

        this._convolver = new ConvolverNode(context);
        this._convolver.normalize = true;
        this._convolver.connect(this._wetLevel);

    }

    get _initialPatch() {
        return {
            power: true,
            mix: 0.5,       // 0 - 1
            type: 'small',
            highPass: 0,    // 0 - 1
        };
    }

    _onPatchChange(evt) {
        super._onPatchChange(evt);
        this._update();
    }

    _update() {
        const power = this._patch.get('power');
        const mix = this._patch.get('mix');
        const type = this._patch.get('type');

        if (this._patch.hasChanged('power') || this._isFirstUpdate) {
            if (power) {

                this._audioIn.disconnect();

                this._audioIn.connect(this._convolver);
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

        if (this._patch.hasChanged('type')) {
            const buffer = this._buffers[type];
            if (buffer) {
                this._convolver.buffer = buffer;
            }
        }
        this._isFirstUpdate = false;
    }

    get audioOut() {
        return this._audioOut;
    }

    get audioIn() {
        return this._audioIn;
    }
}
