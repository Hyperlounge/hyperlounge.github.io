import PolyAudioNode from './PolyAudioNode.js';

export default class PolyGain extends PolyAudioNode {
    get _AudioNodeClass() { return GainNode }

    get gain() {
        return this.getPolyParam('gain');
    }
}
