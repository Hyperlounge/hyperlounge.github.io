import AudioModule from './AudioModule.js';
import PolyGain from './PolyGain.js';

export default class PolyLevelModule extends AudioModule {

    _initialise() {
        super._initialise();

        const context = this._audioContext;
        this._gainNode = new PolyGain(context, {gain: 1});
    }

    get _initialPatch() {
        return {
            level: 1,
        };
    }

    _onPatchChange(evt) {
        super._onPatchChange(evt);
        this._gainNode.gain.setTargetAtTime(this._patch.get('level'), this._now, this._minimumTimeConstant);
    }

    get audioIn() {
        return this._gainNode;
    }

    get audioOut() {
        return this._gainNode;
    }
}
