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
import MidiModule from './MidiModule.js';
import ControllerHelperModule from './ControllerHelperModule.js';
import NoiseModule from './NoiseModule.js';

export default class ModularSynth extends EventTarget {
    constructor() {
        super();
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.eventBus = new EventTarget();
        this._patch = new Model({
            global: new Model(this._initialGlobalPatch),
        });
        this._patch.addEventListener('change', evt => this.dispatchEvent(new CustomEvent('patch-change')));
        this.globalPatch.addEventListener('change', evt => this.dispatchEvent(new CustomEvent('patch-change')));
        if (this._initialState) {
            this._state = new Model(this._initialState);
            this._state.addEventListener('change', evt => this.dispatchEvent(new CustomEvent('state-change')));
        }
        this._modulesPendingBindings = {global: this};
        this._controlsPendingBindings = [];

        document.addEventListener('register-control', this.registerControl);
    }

    registerControl = evt => {
        const control = evt.target;
        const moduleId = evt.detail.moduleId;
        const module = this._modulesPendingBindings[moduleId];
        const parameterName = evt.detail.parameterName;

        if (module) {
            setTimeout(() => this.bindControlToModule(control, module, parameterName), 0);
        } else {
            this._controlsPendingBindings.push({
                control,
                moduleId,
                parameterName,
            });
        }
    }

    bindControlToModule(control, module, parameterName) {
        const updateControl = () => {
            control.value = module.getParam(parameterName);
        }
        updateControl();

        const updateModule = () => {
            module.setParam(parameterName, control.value);
            if (location.search) {
                history.replaceState({}, '', location.origin + location.pathname);
            }
        }
        control.addEventListener('change', updateModule);
        module.addEventListener('patch-change', () => {
            if (module.paramChanged(parameterName)) updateControl();
        });
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
            if (patchId) {
                this._patch.set({[patchId]: module._patch});
                if (this._controlsPendingBindings.length > 0) {
                    this._controlsPendingBindings.forEach(item => {
                        if (item.moduleId === patchId) {
                            this.bindControlToModule(item.control, module, item.parameterName);
                        }
                    });
                    this._controlsPendingBindings = this._controlsPendingBindings.filter(item => item.moduleId !== patchId);
                }
            }
            return module;
        }
    }

    createMidiModule = this._moduleCreator(MidiModule);
    createControllerHelperModule = this._moduleCreator(ControllerHelperModule);
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
    createNoiseModule = this._moduleCreator(NoiseModule);

    get patch() {
        return this._patch.attributes;
    }

    set patch(data) {
        delete data.metadata;
        this._patch.set(data);
    }

    setParam(name, value) {
        this.globalPatch.set({[name]: value});
    }

    getParam(name) {
        return this.globalPatch.get(name);
    }

    paramChanged(name, handler) {
        return this.globalPatch.hasChanged(name, handler);
    }

    get globalPatch() {
        return this._patch.get('global');
    }
}
