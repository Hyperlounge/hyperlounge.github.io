import PolyAudioNode from './PolyAudioNode.js';

export default class PolyOscillator extends PolyAudioNode {
    get _AudioNodeClass() { return OscillatorNode }

    set type(value) {
        this.setPolyProperty('type', value);
    }

    get type() {
        return this.getPolyProperty('type');
    }

    get frequency() {
        return this.getPolyParam('frequency');
    }

    get detune() {
        return this.getPolyParam('detune');
    }
}

