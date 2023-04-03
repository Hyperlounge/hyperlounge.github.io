export default class MidiEvent extends CustomEvent {
    constructor(statusByte, dataByte1, dataByte2) {
        super(MidiEvent.type, {
            detail: {
                statusByte,
                dataByte1,
                dataByte2,
            }
        });
    }

    static type = 'midi-message';
}
