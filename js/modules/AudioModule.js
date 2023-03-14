import Model from '../Model.js';

export default class AudioModule extends EventTarget {
    constructor(context, eventBus, options) {
        super();
        this._audioContext = context;
        this._eventBus = eventBus;
        this._options = options;
        this._patch = new Model(this._initialState);
        this._patch.addEventListener('change', evt => this._onPatchChange(evt));
        this._initialise();
    }

    _initialise() {

    }

    _onPatchChange(evt) {

    }

    get _initialState() {
        return {

        }
    }

    get _minimumTimeConstant() {
        return 0.005;
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

    get patch() {
        return this._patch.attributes;
    }

    set patch(attributes) {
        this._patch.set(attributes);
    }
}
