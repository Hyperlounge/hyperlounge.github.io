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
    static NOTE_OFF = 128;
    static NOTE_ON = 144;
    static PITCH_BEND = 224;
    static CONTROLLER = 176;
    static SUSTAIN_PEDAL = 64;
    static MOD_WHEEL = 1;
}
