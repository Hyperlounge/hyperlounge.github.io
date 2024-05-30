import Model from '../misc/Model.js';

export default class AudioModule extends EventTarget {
    constructor(context, eventBus, globalPatch, options) {
        super();
        this._audioContext = context;
        this._eventBus = eventBus;
        this._globalPatch = globalPatch;
        this._globalPatch.addEventListener('change', evt => this._onGlobalPatchChange(evt));
        this._options = options;
        this._patch = new Model(this._initialPatch);
        this._patch.addEventListener('change', evt => {
            this._onPatchChange(evt);
            this.dispatchEvent(new CustomEvent('patch-change'));
        });
        if (this._initialState) {
            this._state = new Model(this._initialState);
            this._state.addEventListener('change', evt => this.dispatchEvent(new CustomEvent('state-change')));
        }

        this._initialise();
    }

    _initialise() {

    }

    _onPatchChange(evt) {

    }

    _onGlobalPatchChange(evt) {

    }

    get _initialState() {
        return undefined;
    }

    get _initialPatch() {
        return {

        }
    }

    get _minimumTimeConstant() {
        return 0.0025;
    }

    get _now() {
        return this._audioContext.currentTime;
    }

    setParam(paramName, value) {
        this._patch.set({
            [paramName]: value,
        });
    }

    getParam(paramName) {
        return this._patch.get(paramName);
    }

    paramChanged(name, handler) {
        return this._patch.hasChanged(name, handler);
    }

    get patch() {
        return this._patch.attributes;
    }

    set patch(attributes) {
        this._patch.set(attributes);
    }

    get globalPatch() {
        return this._globalPatch.attributes;
    }
}
