import AudioModule from './AudioModule.js';

export default class LevelModule extends AudioModule {

    _initialise() {
        super._initialise();

        const context = this._audioContext;
        this._gainNode = new GainNode(context, {gain: 1});
    }

    get _initialState() {
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
