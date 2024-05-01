
const types = {
    NUMBER: 'number',
    STRING: 'string',
    JSON: 'json',
    BOOL: 'bool',
    DIMENSION: 'dimension',
    STYLE: 'style',
};

function attributesToObject(attributes) {
    if (attributes instanceof NamedNodeMap) {
        const result = {};
        for (let i = 0; i < attributes.length; i++) {
            const attr = attributes.item(i);
            result[attr.name.toLowerCase()] = {name: attr.name, value: attr.value};
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
        this._comment = '';
        this._defaultValue = undefined;
        this._attrName = '';

        if (type === types.STRING) {
            this._lookup = undefined;

            this.lookup = valueArrayOrObject => {
                this._lookup = Object.values(valueArrayOrObject);
                this._caseSensitive = false;
                Object.defineProperty(this, 'caseSensitive', {
                    get() {
                        this._caseSensitive = true;
                        return this;
                    }
                });
                return this;
            }
            this.regExp = regExp => {
                this._regExp = regExp;
                return this;
            }
        }

        if (type === types.NUMBER) {
            this._minValue = undefined;
            this._maxValue = undefined;

            this.min = value => {
                this._minValue = value;
                return this;
            }

            this.max = value => {
                this._maxValue = value;
                return this;
            }
        }
    }

    get required() {
        this._required = true;
        return this;
    }

    get observed() {
        this._observed = true;
        return this;
    }

    comment(value) {
        this._comment = value;
        return this;
    }

    default(value) {
        this._defaultValue = value;
        return this;
    }

    attrName(value) {
        this._attrName = value;
        return this;
    }

    _setAttrNameFromPropName(value, noHyphens) {
        if (! this._attrName) {
            this._attrName = (noHyphens ? value : value.replace(/([A-Z])/g, '-$1')).toLowerCase();
        }
    }
}

class PropTypes {
    static ALLOW_HYPHENS_IN_ATTRIBUTE_NAMES = '_allowHyphensInAttributeNames';
    static get number() { return new PropType(types.NUMBER) };
    static get string() { return new PropType(types.STRING) };
    static get bool() { return new PropType(types.BOOL) };
    static get dimension() { return new PropType(types.DIMENSION) };
    static get style() { return new PropType(types.STYLE) };
    static get json() { return new PropType(types.JSON) };

    static getDefaults(propTypes) {
        const defaults = {};
        Object.keys(propTypes).map(key => {
            if (key !== this.ALLOW_HYPHENS_IN_ATTRIBUTE_NAMES) {
                const propType = propTypes[key];
                if (propType._defaultValue !== undefined) {
                    defaults[key] = propType._defaultValue;
                }
            }
        });
        return defaults;
    }

    static getObserved(propTypes) {
        const observed = [];
        const noHyphens = propTypes._allowHyphensInAttributeNames === false;
        Object.keys(propTypes).map(key => {
            if (key !== this.ALLOW_HYPHENS_IN_ATTRIBUTE_NAMES) {
                const propType = propTypes[key];
                propType._setAttrNameFromPropName(key, noHyphens);
                if (propType._observed) {
                    observed.push(propType._attrName);
                }
            }
        });
        return observed;
    }

    static propTypesToDoc(propTypes) {
        let docLines = [];

        let commentsExist = false;
        const noHyphens = propTypes._allowHyphensInAttributeNames === false;

        Object.keys(propTypes).forEach(key => {
            if (key !== this.ALLOW_HYPHENS_IN_ATTRIBUTE_NAMES) {
                const propType = propTypes[key];
                propType._setAttrNameFromPropName(key, noHyphens);
                if (propType._comment !== '') {
                    commentsExist = true;
                }
                docLines.push(`| ${[
                    `<nobr>${propType._attrName}</nobr>`,
                    propType._type,
                    (propType => {
                        const parts = [];
                        if (propType._type === types.NUMBER) {
                            if (propType._minValue !== undefined) {
                                parts.push(`min: ${propType._minValue}`);
                            }
                            if (propType._maxValue !== undefined) {
                                parts.push(`max: ${propType._maxValue}`);
                            }
                        } else if (propType._type === types.STRING) {
                            if (propType._lookup) {
                                parts.push(`one of: ${propType._lookup.map(item => `"${item}"`).join(', ')}${propType._caseSensitive ? ' (case sensitive)' : ''}`);
                            }
                            if (propType._regExp) {
                                parts.push(`conforms to regExp: <nobr>\`${propType._regExp.toString()}\`</nobr>`);
                            }
                        } else if (propType._type === types.JSON) {
                            parts.push('a valid JSON string');
                        } else if (propType._type === types.STYLE) {
                            parts.push('valid inline css styles');
                        } else if (propType._type === types.DIMENSION) {
                            parts.push('a number with optional "px" or "%" suffix, or "content"')
                        }
                        return parts.join(', ');
                    })(propType),
                    (propType => {
                        if (propType._defaultValue === undefined) return '';
                        if (propType._type === types.JSON) return `'${JSON.stringify(propType._defaultValue)}'`;
                        if (propType._type === types.NUMBER || propType._type === types.BOOL) return propType._defaultValue;
                        return `"${propType._defaultValue}"`;
                    })(propType),
                    propType._required ? 'yes' : '',
                    propType._observed ? 'yes' : '',
                    propType._comment.replace(/\n/g, '<br/>'),
                ].join(' | ')} |`);
            }
        });
        if (!commentsExist) {
            docLines = docLines.map(item => item.replace(/\| +\|$/, '|'))
        }
        docLines.unshift('| --- | --- | --- | --- | --- | --- |' + (commentsExist ? ' --- |' : ''));
        docLines.unshift('| Attribute | Type | Valid Values | Default | Reqrd | Obsvd |' + (commentsExist ? ' Comment |' : ''));
        return docLines.join('\n').replace(/_/g, '\\_');
    }

    static attributesToProps(element, singleAttrName) {
        const attributes = element.attributes;
        const propTypes = element.constructor.propTypes;
        const hash = {};
        const required = [];
        const noHyphens = propTypes._allowHyphensInAttributeNames === false;
        Object.keys(propTypes).forEach(key => {
            if (key !== this.ALLOW_HYPHENS_IN_ATTRIBUTE_NAMES) {
                const propType = propTypes[key];
                propType._setAttrNameFromPropName(key, noHyphens);
                hash[propType._attrName] = {
                    name: key,
                    propType: propType,
                }
                if (propType._required) {
                    required.push(key);
                }
            }
        });
        const props = {};
        const attrObject = attributesToObject(attributes);
        const elementId = `Location: ${element.id ? `id=${element.id}` : element.outerHTML}`;
        Object.keys(attrObject).filter(key => !singleAttrName || key === singleAttrName).map(key => {
            const { name, value } = attrObject[key];
            let convertedValue;
            const info = hash[key];
            if (info === undefined) {
                throw new Error(`Unknown attribute "${name}". ${elementId}`);
            } else {
                const propType = hash[key].propType;
                switch (propType._type) {
                    case types.BOOL:
                        if (typeof value === 'boolean') {
                            convertedValue = value;
                        } else {
                            const lowerCaseValue = value.toLowerCase();
                            if (lowerCaseValue !== '' && lowerCaseValue !== 'true' && lowerCaseValue !== 'false') {
                                throw new Error(`Attribute "${name}" must be either "true" or "false". ${elementId}`);
                            } else {
                                convertedValue = lowerCaseValue !== 'false';
                            }
                        }
                        break;
                    case types.DIMENSION:
                        if (! /^(-?\d+(\.\d+)?(px|%)?|content)$/.test(value)) {
                            throw new Error(`Attribute "${name}" must be a number with optional "px" or "%" suffix, or "content". ${elementId}`);
                        } else {
                            convertedValue = value.replace(/([-\d.]+)(px|)$/, '$1px');
                        }
                        break;
                    case types.STRING:
                        convertedValue = value;
                        if (propType._required && !convertedValue) {
                            throw new Error(`Attribute "${name}" must be one of ${propType._lookup.join('|')}. ${elementId}`);
                        }
                        if (propType._lookup !== undefined) {
                            let testValue, testLookup;
                            if (propType._caseSensitive) {
                                testValue = convertedValue;
                                testLookup = propType._lookup;
                            } else {
                                testValue = convertedValue.toLowerCase();
                                testLookup = propType._lookup.map(item => item.toLowerCase());
                            }
                            if (! testLookup.includes(testValue)) {
                                throw new Error(`Attribute "${name}" must be one of ${propType._lookup.join('|')}. ${elementId}`);
                            }
                            convertedValue = testValue;
                        }
                        if (propType._regExp !== undefined) {
                            if (! propType._regExp.test(convertedValue)) {
                                throw new Error(`Attribute "${name}" must conform to reg. exp. "${propType._regExp.toString()}". ${elementId}`);
                            }
                        }
                        break;
                    case types.NUMBER:
                        convertedValue = parseFloat(value);
                        if (isNaN(convertedValue)) {
                            throw new Error(`Attribute "${name}" must be a valid number. ${elementId}`);
                        }
                        if (propType._minValue !== undefined && convertedValue < propType._minValue) {
                            throw new Error(`Attribute "${name}" must not be less than ${propType._minValue}. ${elementId}`);
                        }
                        if (propType._maxValue !== undefined && convertedValue > propType._maxValue) {
                            throw new Error(`Attribute "${name}" must not be greater than ${propType._maxValue}. ${elementId}`);
                        }
                        break;
                    case types.STYLE:
                        convertedValue = value.replace(/^\s*(.*?);?\s*$/, '$1;');
                        if (!/^([a-zA-Z\-\s]+:[a-zA-Z0-9\-.\s#%\(\)\+,']*;)+$/.test(convertedValue)) {
                            throw new Error(`Attribute "${name}" must be a valid inline style declaration. ${elementId}`);
                        }
                        break;
                    case types.JSON:
                        try {
                            convertedValue = JSON.parse(value);
                        } catch (error) {
                            throw new Error(`Attribute "${name}" must be a valid JSON string. ${elementId}`);
                        }
                        break;
                }
                props[hash[key].name] = convertedValue;
            }
        });

        if (!singleAttrName) {
            required.forEach(name => {
                if (props[name] === undefined) {
                    throw new Error(`Attribute "${name.replace(/([A-Z])/g, '-$1').toLowerCase()}" is required. ${elementId}`);
                }
            });
        }

        return {
            ...(singleAttrName ? {} : PropTypes.getDefaults(propTypes)),
            ...props,
        };
    }
}

export default PropTypes;
