export default class NoteChangeEvent extends CustomEvent {
    constructor(newNoteNumber, oldNoteNumber, voiceNumber, velocity) {
        super(NoteChangeEvent.type, {
            detail: {
                newNoteNumber,
                oldNoteNumber,
                voiceNumber,
                velocity,
            }
        });
    }

    static type = 'note-change';
}
