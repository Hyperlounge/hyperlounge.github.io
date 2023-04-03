import PolyAudioNode from './PolyAudioNode.js';

export default class PolyBiquadFilter extends PolyAudioNode {
    get _AudioNodeClass() { return BiquadFilterNode }

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

    get Q() {
        return this.getPolyParam('Q');
    }

    get gain() {
        return this.getPolyParam('gain');
    }

}
