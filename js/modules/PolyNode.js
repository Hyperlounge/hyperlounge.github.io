
/*
A PolyConnectionTarget is a PolyNode or a PolyParam. It will accept connections from PolyNodes

A PolyNode is a collection of AudioNode instances.
It can be connected to from another PolyNode.
It can have mono parameters, which connect to all of its AudioNodes via a ConstantSourceNode.
It can have poly parameters, which are instances of PolyParam and can be connected to from a PolyNode.

The first PolyNode in the map determines the number of nodes in all of the PolyConnectionTargets down the line.
If a PolyNode is connected to, AudioNodes are added or removed to match the source.
If a PolyParam is connected to, the effect in the host PolyNode is the same.
If the number of voices changes in the first PolyNode, nodes are added or removed from all PolyNodes down the chain.


 */
class PolyConnectionTarget {
    constructor() {
        this._connectionsFrom = [];
    }

    get totalNodes() {
        return this.nodes.length;
    }

    get nodes() {

    }

    getNodeAt(index) {

    }

    destroyNodeAt(index) {

    }

    connectFrom(source) {
        if (! this._connectionsFrom.find(item => item === source)) {
            this._connectionsFrom.push(source);
            if (source instanceof PolyConnectionTarget) {
                this.nodes.forEach((node, i) => {
                    source.getNodeAt(i).connect(node);
                });
            } else {
                this.nodes.forEach(node => {
                    source.connect(node);
                });
            }
        }
    }
}

class PolyParam extends PolyConnectionTarget {
    constructor(parentPolyNode, propertyName) {
        super();
        this._parentPolyNode = parentPolyNode;
        this._propertyName = propertyName;
    }

    get propertyName() {
        return this._propertyName;
    }

    get nodes() {
        return this._parentPolyNode.nodes.map(node => node[this.propertyName]);
    }

    getNodeAt(index) {
        const newNode = this._parentPolyNode.getNodeAt(index)[this.propertyName];
        this._connectionsFrom.forEach(source => {
            if (source instanceof PolyConnectionTarget) {
                source.getNodeAt(index).connect(newNode);
            } else {
                source.connect(newNode);
            }
        });
        return newNode;
    }

    destroyNodeAt(index) {
        this._connectionsFrom.forEach(source => {
            if (source instanceof PolyConnectionTarget) {
                source.destroyNodeAt(index);
            } else {
                source.disconnect(this.nodes[index]);
            }
        });
    }
}

export default class PolyNode extends PolyConnectionTarget {
    constructor(context, options) {
        super();
        this._context = context;
        this._options = options;
        this._nodes = [];
        this._monoParams = [];
        this._polyParams = [];
        this._properties = [];
        this._connections = [];
   }

    get nodes() {
        return this._nodes;
    }

    set AudioNodeClass(_class) {
        this._AudioNodeClass = _class;
        const initialInstance = new _class(this._context, this._options);
        if (initialInstance instanceof AudioScheduledSourceNode) {
            initialInstance.start();
        }
        this._nodes.push(initialInstance);
    }

    get AudioNodeClass() {
        // return the AudioNode to be used here
        return this._AudioNodeClass;
    }

    _createProperty(propertyName) {
        Object.defineProperty(this, propertyName, {
            set(value) {
                this['_' + propertyName] = value;
                this._nodes.forEach(node => node[propertyName] = value);
            },
            get() {
                return this['_' + propertyName];
            }
        });
        this['_' + propertyName] = this._nodes[0][propertyName];
        this._properties.push(propertyName);
    }

    _createMonoParam(propertyName, nodePropertyName) {
        nodePropertyName || (nodePropertyName = propertyName);
        const initialNode = this._nodes[0];
        const prop = initialNode[nodePropertyName];
        const value = prop.value;
        const constantSourceNode = new ConstantSourceNode(this._context, {offset: value});
        constantSourceNode.start();
        constantSourceNode.connect(initialNode[nodePropertyName]);
        this._monoParams.push({nodePropertyName, output: constantSourceNode});

        Object.defineProperty(this, propertyName, {
            get() {

                return constantSourceNode.offset;
            }
        });
    }

    _createPolyParam(propertyName) {
        const polyParam = new PolyParam(this, propertyName);
        this._polyParams.push(polyParam);

        Object.defineProperty(this, propertyName, {
            get() {
                return polyParam;
            }
        });
    }

    set totalNodes(newValue) {
        console.log('setting to ', newValue);
        // This should only be used on the first PolyNode in the map
        while (this._nodes.length < newValue) {
            this.getNodeAt(this._nodes.length);
        }
        while (this._nodes.length > newValue) {
            this.destroyNodeAt(this._nodes.length - 1);
        }
        console.log('new value ', this._nodes.length);
    }

    getNodeAt(index) {
        // as new nodes are created, create new nodes further down the map.
        if (index < this._nodes.length) {
            return this._nodes[index];
        } else {
            const options = {...this._options};
            this._properties.forEach(propertyName => {
                options[propertyName] = this[propertyName];
            });
            const newNode = new this.AudioNodeClass(this._context, options);
            console.trace('created ', newNode);
            this._nodes.push(newNode);
            this._monoParams.forEach(param => {
                param.output.connect(newNode[param.nodePropertyName]);
            });
            this._polyParams.forEach(polyParam => {
                polyParam.getNodeAt(index);
            });
            this._connections.forEach(target => {
                if (target instanceof PolyConnectionTarget) {
                    newNode.connect(target.getNodeAt(index));
                } else {
                    newNode.connect(target);
                }
            });
            this._connectionsFrom.forEach(source => {
                if (source instanceof PolyConnectionTarget) {
                    source.getNodeAt(index).connect(newNode);
                } else {
                    source.connect(newNode);
                }
            });
            if (newNode instanceof AudioScheduledSourceNode) {
                newNode.start();
            }
            return newNode;
        }
    }

    destroyNodeAt(index) {
        // before destroying, disconnect from down the line and destroy
        if (index < this._nodes.length) {
            const nodeToDestroy = this._nodes[index];
            if (nodeToDestroy instanceof AudioScheduledSourceNode) {
                nodeToDestroy.stop();
            }
            nodeToDestroy.disconnect();
            this._connections.forEach(target => {
                if (target instanceof PolyConnectionTarget) {
                    target.destroyNodeAt(index);
                }
            });
            this._connectionsFrom.forEach(source => {
                if (source instanceof PolyConnectionTarget) {
                    source.destroyNodeAt(index);
                }
            });
            this._monoParams.forEach(param => {
                param.output.disconnect(nodeToDestroy[param.nodePropertyName]);
            });
            this._polyParams.forEach(polyParam => {
                polyParam.destroyNodeAt(index);
            });
            console.log('destroyed ', nodeToDestroy);
            this._nodes = this._nodes.filter(item => item !== nodeToDestroy);
        }
    }

    connect(target) {
        // if destination is another PolyNode or PolyParam, connect to corresponding nodes
        // if destination is an AudioNode or AudioParam, connect all to the same
        if (! this._connections.find(item => item === target)) {
            this._connections.push(target);
            if (target instanceof PolyConnectionTarget) {
                this._nodes.forEach((node, i) => {
                    node.connect(target.getNodeAt(i));
                });
            } else {
                this._nodes.forEach(node => {
                    node.connect(target);
                });
            }
        }
    }
}
