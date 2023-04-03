export default class ModWheelEvent extends CustomEvent {
    constructor(value) {
        super(ModWheelEvent.type, {
            detail: {
                value,  // 0-127
            }
        });
    }

    static type = 'mod-wheel-change';
}
