
import PropTypes from './helpers/PropTypes.js';

export default class AbstractComponent extends HTMLElement {
    static propTypes = {
        id: PropTypes.string,
        class: PropTypes.string,
        style: PropTypes.string,
        moduleId: PropTypes.string,
        parameterName: PropTypes.string,
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this._root = this.attachShadow({mode: 'open'});
        this._props = PropTypes.attributesToProps(this);
        if (this._props.moduleId && this._props.parameterName) {
            const evt = new CustomEvent('register-control', {
                bubbles: true,
                detail: {
                    moduleId: this._props.moduleId,
                    parameterName: this._props.parameterName,
                },
            });
            this.dispatchEvent(evt);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this._root) {
            this._props[name] = PropTypes.attributesToProps(this, name);
        }
    }

    dispatchChangeEvent() {
        const evt = new CustomEvent('change');
        this.dispatchEvent(evt);
    }

    get value() {
        // override
        return null;
    }

    set value(newValue) {
        // override
    }

    static linearToLog(linearMax, logMax) {
        return linear => (Math.pow(2, 10*Number(linear)/linearMax) - 1) * logMax / 1023;
    }

    static logToLinear(logMax, linearMax) {
        return log => Math.log2(1023 * Number(log)/logMax + 1) * linearMax/10;
    }

    static linearToLogRange(linearMax, logMin, logMax) {
        const maxValue = Math.log2(logMax);
        const minValue = Math.log2(logMin);

        return linear => {
            const value = minValue + (Number(linear)/linearMax)*(maxValue-minValue);
            return Math.pow(2, value);
        }
    }

    static logRangeToLinear(logMin, logMax, linearMax) {
        const maxValue = Math.log2(logMax);
        const minValue = Math.log2(logMin);

        return log => {
            const value = Math.log2(Number(log));
            return linearMax * (value-minValue)/(maxValue-minValue);
        }
    }

}
