import PolyAudioParam from './PolyAudioParam.js';

export default class PolyAudioNode {
    constructor(context, options) {
        this.context = context;
        this.options = options;
        this.polyProperties = {};
        this.polyParams = {};
        this.connections = [];
        this.nodes = [this.createNode()];
    }

    setPolyProperty(name, value) {
        this.polyProperties[name] = value;
        this.nodes.forEach(node => node[name] = value);
    }

    getPolyProperty(name) {
        return this.polyProperties[name];
    }

    getPolyParam(name) {
        this.polyParams[name] || (this.polyParams[name] = new PolyAudioParam(name, this));
        return this.polyParams[name];
    }

    createNode() {
        const paramValues = {};
        Object.keys(this.polyParams).forEach(key => {
            paramValues[key] = this.polyParams[key].value;
        })
        const node = new this._AudioNodeClass(this.context, {...this.options, ...this.polyProperties, ...paramValues});
        if (node instanceof AudioScheduledSourceNode) {
            node.start();
        }
        return node;
    }

    destroyNode(node) {
        if (node instanceof AudioScheduledSourceNode) {
            node.stop();
        }
        node.disconnect();
    }

    set totalVoices(value) {
        // use on first in chain only - it will ripple down connections
        while (value > this.nodes.length) {
            this.nodes.push(this.createNode());
        }
        while (value < this.nodes.length) {
            this.destroyNode(this.nodes.pop());
        }
        this.connections.forEach(connection => {
            const { type, target, paramName } = connection;
            switch(type) {
                case 'polyTo':
                    if (target instanceof PolyAudioNode) {
                        target.totalVoices = value;
                    } else {
                        target.polyNode.totalVoices = value;
                    }
                    break;
                case 'polyFrom':
                    target.totalVoices = value;
                    break;
            }
        });
        this.refreshConnections();
    }

    addConnection(connection) {
        this.connections.push(connection);
        this.refreshConnections();
    }

    refreshConnections() {
        this.connections.forEach(connection => {
            const { type, target, paramName } = connection;
            this.nodes.forEach((node, index) => {
                switch(type) {
                    case 'polyTo':
                        node.connect(target instanceof PolyAudioNode ? target.nodes[index] : target.polyNode.nodes[index][target.name]);
                        break;
                    case 'polyFrom':
                        target.nodes[index].connect(paramName ? node[paramName] : node);
                        break;
                    case 'fanInTo':
                        node.connect(target);
                        break;
                    case 'fanOutFrom':
                        target.connect(paramName ? node[paramName] : node);
                        break;
                }
            });
        });
    }

    polyConnectTo(target) {
        // target must be a PolyAudioNode or a PolyAudioParam
        this.addConnection({type: 'polyTo', target});
    }

    polyConnectFrom(target) {
        // target must be a PolyAudioNode
        this.addConnection({type: 'polyFrom', target});
    }

    fanInConnectTo(target) {
        // target must be an AudioNode or AudioParam
        this.addConnection({type: 'fanInTo', target});
    }

    fanOutConnectFrom(target) {
        // target must be an AudioNode
        this.addConnection({type: 'fanOutFrom', target});
    }

    get _AudioNodeClass() { return AudioNode };
}
