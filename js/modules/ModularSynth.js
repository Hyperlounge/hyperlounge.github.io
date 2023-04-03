import ControllerModule from './ControllerModule.js';
import OscillatorModule from './OscillatorModule.js';
import AmpModule from './AmpModule.js';
import LevelModule from './LevelModule.js';
import FilterModule from './FilterModule.js';
import EnvelopeModule from './EnvelopeModule.js';
import Model from '../misc/Model.js';
import LFOModule from './LFOModule.js';
import VoiceAllocatorModule from './VoiceAllocatorModule.js';
import SoftKeyboardModule from './SoftKeyboardModule.js';
import PolyOscillatorModule from './PolyOscillatorModule.js';
import PolyAmpModule from './PolyAmpModule.js';
import PolyEnvelopeModule from './PolyEnvelopeModule.js';
import PolyLevelModule from './PolyLevelModule.js';
import PolyFilterModule from './PolyFilterModule.js';

export default class ModularSynth {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.eventBus = new EventTarget();
        this._patch = new Model({
            global: new Model(this._initialGlobalPatch),
        });
        if (this._initialState) {
            this._state = new Model(this._initialState);
        }
    }

    get _initialState() {
        return undefined;
    }

    get _initialGlobalPatch() {
        return {
            totalVoices: 1,
            legato: false,
        }
    }

    _moduleCreator(Type) {
        return (patchId, options) => {
            const module = new Type(this.audioContext, this.eventBus, this.globalPatch, this.options);
            patchId && this._patch.set({[patchId]: module._patch});
            return module;
        }
    }

    createSoftKeyboardModule = this._moduleCreator(SoftKeyboardModule);
    createVoiceAllocatorModule = this._moduleCreator(VoiceAllocatorModule);
    createControllerModule = this._moduleCreator(ControllerModule);
    createOscillatorModule = this._moduleCreator(OscillatorModule);
    createAmpModule = this._moduleCreator(AmpModule);
    createEnvelopeModule = this._moduleCreator(EnvelopeModule);
    createLevelModule = this._moduleCreator(LevelModule);
    createFilterModule = this._moduleCreator(FilterModule);
    createPolyOscillatorModule = this._moduleCreator(PolyOscillatorModule);
    createPolyAmpModule = this._moduleCreator(PolyAmpModule);
    createPolyEnvelopeModule = this._moduleCreator(PolyEnvelopeModule);
    createPolyLevelModule = this._moduleCreator(PolyLevelModule);
    createPolyFilterModule = this._moduleCreator(PolyFilterModule);
    createLFOModule = this._moduleCreator(LFOModule);

    get patch() {
        return this._patch.attributes;
    }

    set patch(data) {
        this._patch.set(data);
    }

    get globalPatch() {
        return this._patch.get('global');
    }
}
