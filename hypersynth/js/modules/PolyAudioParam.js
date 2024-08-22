
export default class PolyAudioParam {
    constructor(name, polyNode) {
        this.name = name;
        this.polyNode = polyNode;
    }

    set value(float) {
        this._value = float;
        this.polyNode.nodes.forEach(node => node[this.name].value = float);
    }

    get value() {
        return this._value === undefined ? this.polyNode.nodes[0][this.name].value : this._value;
    }

    setValueAtTime(value, startTime) {
        this.polyNode.nodes.forEach(node => node[this.name].setValueAtTime(value, startTime));
    }

    linearRampToValueAtTime(value, endTime) {
        this.polyNode.nodes.forEach(node => node[this.name].linearRampToValueAtTime(value, endTime));
    }

    exponentialRampToValueAtTime(value, endTime) {
        this.polyNode.nodes.forEach(node => node[this.name].exponentialRampToValueAtTime(value, endTime));
    }

    setTargetAtTime(target, startTime, timeConstant) {
        this.polyNode.nodes.forEach(node => node[this.name].setTargetAtTime(target, startTime, timeConstant));
    }

    setValueCurveAtTime(values, startTime, duration) {
        this.polyNode.nodes.forEach(node => node[this.name].setValueCurveAtTime(values, startTime, duration));
    }

    cancelScheduledValues(startTime) {
        this.polyNode.nodes.forEach(node => node[this.name].cancelScheduledValues(startTime));
    }

    cancelAndHoldAtTime(cancelTime) {
        this.polyNode.nodes.forEach(node => node[this.name].cancelAndHoldAtTime(cancelTime));
    }

    polyConnectFrom(target) {
        // target must be a PolyNode
        this.polyNode.addConnection({paramName: this.name, type: 'polyFrom', target});
    }

    fanOutConnectFrom(target) {
        // target must be an AudioNode
        this.polyNode.addConnection({paramName: this.name, type: 'fanOutFrom', target});
    }
}
