import AudioModule from './AudioModule.js';
import PolyGain from './PolyGain.js';

export default class PolyAmpModule extends AudioModule {

    _initialise() {
        super._initialise();

        const context = this._audioContext;
        this._gainNode = new PolyGain(context, {gain: 0});
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
