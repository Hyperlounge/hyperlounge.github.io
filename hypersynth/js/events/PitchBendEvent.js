export default class PitchBendEvent extends CustomEvent {
    constructor(value) {
        super(PitchBendEvent.type, {
            detail: {
                value,  // 0-127
            }
        });
    }

    static type = 'pitch-bend-change';
}
