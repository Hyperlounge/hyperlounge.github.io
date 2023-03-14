
const types = {
    NUMBER: 'number',
    STRING: 'string',
    BOOL: 'bool',
    DIMENSION: 'dimension',
    STYLE: 'style',
};

function attributesToObject(attributes) {
    if (attributes instanceof NamedNodeMap) {
        const result = {};
        for (let i = 0; i < attributes.length; i++) {
            const attr = attributes.item(i);
            result[attr.name] = attr.value;
        }
        return result;
    } else {
        return attributes;
    }
}

class PropType {
    constructor(type) {
        this._type = type;
        this._required = false;
        this._observed = false;
        this._defaultValue = undefined;
        this._lookup = undefined;
    }

    get required() {
        this._required = true;
        return this;
    }

    get observed() {
        this._observed = true;
        return this;
    }

    default(value) {
        this._defaultValue = value;
        return this;
    }

    lookup(valueArrayOrObject) {
        this._lookup = Object.values(valueArrayOrObject);
        return this;
    }
}

class PropTypes {
    static get number() { return new PropType(types.NUMBER) };
    static get string() { return new PropType(types.STRING) };
    static get bool() { return new PropType(types.BOOL) };
    static get dimension() { return new PropType(types.DIMENSION) };
    static get style() { return new PropType(types.STYLE) };

    static getDefaults(propTypes) {
        const defaults = {};
        Object.keys(propTypes).map(key => {
            const propType = propTypes[key];
            if (propType._defaultValue !== undefined) {
                defaults[key] = propType._defaultValue;
            }
        });
        return defaults;
    }

    static getObserved(propTypes) {
        const observed = [];
        Object.keys(propTypes).map(key => {
            const propType = propTypes[key];
            if (propType._observed) {
                observed.push(key.toLowerCase());
            }
        });
        return observed;
    }

    static attributesToProps(layoutElement, singleAttrName) {
        const attributes = layoutElement.attributes;
        const propTypes = layoutElement.constructor.propTypes;
        const hash = {};
        const required = [];
        Object.keys(propTypes).map(key => {
            const propType = propTypes[key];
            hash[key.toLowerCase()] = {
                name: key,
                propType: propType,
            }
            if (propType._required) {
                required.push(key);
            }
        });
        const props = {};
        const attrObject = attributesToObject(attributes);
        const elementId = `Location: ${layoutElement.id ? `id=${layoutElement.id}` : layoutElement.outerHTML}`;
        Object.keys(attrObject).filter(key => !singleAttrName || key === singleAttrName).map(key => {
            const value = attrObject[key];
            let convertedValue;
            const info = hash[key];
            if (info === undefined) {
                throw new Error(`Unknown attribute "${key}". ${elementId}`);
            } else {
                const propType = hash[key].propType;
                switch (propType._type) {
                    case types.BOOL:
                        if (value !== 'true' && value !== 'false') {
                            throw new Error(`Attribute "${key}" must be either "true" or "false". ${elementId}`);
                        } else {
                            convertedValue = value === 'true';
                        }
                        break;
                    case types.DIMENSION:
                        if (! /^(-?\d+(\.\d+)?(px|%)?|content)$/.test(value)) {
                            throw new Error(`Attribute "${key}" must be a number with optional "px" or "%" suffix. ${elementId}`);
                        } else {
                            convertedValue = value.replace(/([-\d.]+)(px|)$/, '$1px');
                        }
                        break;
                    case types.STRING:
                        convertedValue = value;
                        if (propType._required && !convertedValue) {
                            throw new Error(`Attribute "${key}" must be one of ${propType._lookup.join('|')}. ${elementId}`);
                        }
                        break;
                    case types.NUMBER:
                        convertedValue = parseFloat(value);
                        if (isNaN(convertedValue)) {
                            throw new Error(`Attribute "${key}" must be a valid number. ${elementId}`);
                        }
                        break;
                    case types.STYLE:
                        convertedValue = value.replace(/^\s*(.*?);?\s*$/, '$1;');
                        if (!/^([a-zA-Z\-\s]+:[a-zA-Z0-9\-.\s#%\(\)\+,']*;)+$/.test(convertedValue)) {
                            throw new Error(`Attribute "${key}" must be a valid inline style declaration. ${elementId}`);
                        }
                }
                if (propType._lookup !== undefined) {
                    if (! propType._lookup.includes(convertedValue)) {
                        throw new Error(`Attribute "${key}" must be one of ${propType._lookup.join('|')}. ${elementId}`);
                    }
                }
                props[hash[key].name] = convertedValue;
            }
        });

        if (!singleAttrName) {
            required.forEach(name => {
                if (props[name] === undefined) {
                    throw new Error(`Attribute "${name.toLowerCase()}" is required. ${elementId}`);
                }
            });
        }

        return props;
    }
}

export default PropTypes;
