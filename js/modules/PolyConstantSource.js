import PolyAudioNode from './PolyAudioNode.js';

export default class PolyConstantSource extends PolyAudioNode {
    get _AudioNodeClass() {return ConstantSourceNode}

    get offset() {
        return this.getPolyParam('offset');
    }
}
