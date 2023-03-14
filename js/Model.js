
export default class Model extends EventTarget {
    constructor(initialAttributes = {}) {
        super();
        this._previousAttributes = {};
        this._attributes = {...this.constructor.defaults, ...initialAttributes};
    }

    set(newAttributes, noTrigger = false) {
        this._previousAttributes = {...this._attributes};
        Object.keys(newAttributes).forEach(key => {
            if (this._attributes[key] instanceof Model) {
                this._attributes[key].set(newAttributes[key]);
            } else {
                this._attributes[key] = newAttributes[key];
            }
        });

        noTrigger || this.dispatchEvent(new Event('change'));
        noTrigger || Object.keys(this._attributes).forEach(key => {
            const previousValue = this._previousAttributes[key];
            const newValue = this._attributes[key];
            if (previousValue !== newValue) {
                const evt = new Event(`change:${key}`);
                evt.data = {
                    previousValue,
                    newValue,
                }
                this.dispatchEvent(evt);
            }
        });
    }

    get(attributeName) {
        return this._attributes[attributeName];
    }

    reset() {
        this._previousAttributes = {};
        this._attributes = {...this.constructor.defaults};
    }

    hasChanged(attributeName, handler) {
        const prevValue = this._previousAttributes[attributeName];
        const newValue = this._attributes[attributeName];
        (newValue !== prevValue) && handler(newValue, prevValue);
    }

    set attributes(value) {
        this._attributes = value;
    }

    get attributes() {
        const attr = {};
        Object.keys(this._attributes).forEach(key => {
            const value = this._attributes[key];
            if (value instanceof Array) {
                attr[key] = value.map(item => (item instanceof Model) ? item.attributes : item);
            } else {
                attr[key] = (value instanceof Model) ? value.attributes : value;
            }
        })
        return attr;
    }

    get previousAttributes() {
        return {...this._previousAttributes}
    }

    static defaults = {};
}
