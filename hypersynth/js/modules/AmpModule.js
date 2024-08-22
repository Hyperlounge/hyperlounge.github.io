import AudioModule from './AudioModule.js';

export default class AmpModule extends AudioModule {

    _initialise() {
        super._initialise();

        const context = this._audioContext;
        this._gainNode = new GainNode(context, {gain: 0});
    }

    get modulationIn() {
        return this._gainNode.gain;
    }

    get audioIn() {
        return this._gainNode;
    }

    get audioOut() {
        return this._gainNode;
    }
}
