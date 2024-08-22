import AudioModule from './AudioModule.js';
import MidiEvent from '../events/MidiEvent.js';
import NoteChangeEvent from '../events/NoteChangeEvent.js';
import PolyConstantSource from './PolyConstantSource.js';


export default class VoiceAllocatorModule extends AudioModule {
    _initialise() {
        super._initialise();

        this._pitches = new PolyConstantSource(this._audioContext, {});
        this._initializeVoices();

        this._eventBus.addEventListener(MidiEvent.type, event => this._onMIDIMessage(event));
    }

    get _initialPatch() {
        return {
            numberOfVoices: 1,
            glideTime: 0,
        }
    }

    _onPatchChange(evt) {
        super._onPatchChange(evt);
        this._patch.hasChanged('numberOfVoices', () => this._initializeVoices());
    }

    _initializeVoices() {
        const { numberOfVoices } = this.patch;
        const totalVoices = Math.max(numberOfVoices, 1);
        this._globalPatch.set({
            totalVoices: totalVoices,
            legato: numberOfVoices === 0,
        });
        this._usedVoices = [];
        this._freeVoices = Array(totalVoices).fill().map((item, i) => ({voiceNumber: i, note: undefined}));
        this._pitches.totalVoices = totalVoices;
        this._downNotes = [];
    }

    _onMIDIMessage(event) {
        const { statusByte, dataByte1, dataByte2 } = event.detail;
        if (statusByte >= 128 && statusByte <= 143) {
            this._onKeyUp(dataByte1, dataByte2);
        } else if (statusByte >= 144 && statusByte <= 159) {
            this._onKeyDown(dataByte1, dataByte2);
        }
    }

    _onKeyDown(note, velocity) {
        this._downNotes.unshift(note);
        let voiceNumber, oldNote;
        if (this._freeVoices.length) {
            // see if there's a free voice that's played this not last
            const lastUsedVoiceForThisNote = this._freeVoices.find(item => item.note === note);
            if (lastUsedVoiceForThisNote) {
                voiceNumber = lastUsedVoiceForThisNote.voiceNumber;
                this._freeVoices = this._freeVoices.filter(item => item !== lastUsedVoiceForThisNote);
            } else {
                // if not, use the voice freed up longest ago
                voiceNumber = this._freeVoices.shift().voiceNumber;
            }
            this._usedVoices.push({voiceNumber, note});
        } else {
            // If there aren't any free voices, steal the voice allocated longest ago.
            const stolenVoice = this._usedVoices.shift();
            voiceNumber = stolenVoice.voiceNumber;
            // If the voice has been stolen, it's a change of note
            oldNote = stolenVoice.note;
            this._usedVoices.push({voiceNumber, note});
        }
        this._eventBus.dispatchEvent(new NoteChangeEvent(note, oldNote, voiceNumber, velocity));
        this._setPitch(voiceNumber, note);
    }

    _onKeyUp(note, velocity) {
        let newNote;
        this._downNotes = this._downNotes.filter(item => item !== note);
        // find the voice that was used for this note
        const usedVoice = this._usedVoices.find(item => item.note === note);
        if (usedVoice) {
            let voiceNumber = usedVoice.voiceNumber;
            // If we are in monophonic mode, give the voice back to any other down key
            if (this.globalPatch.totalVoices === 1 && this._downNotes.length) {
                newNote = this._downNotes[0];
                usedVoice.note = newNote;
            } else {
                this._usedVoices = this._usedVoices.filter(item => item.voiceNumber !== voiceNumber);
                this._freeVoices.push({voiceNumber, note});
            }
            this._eventBus.dispatchEvent(new NoteChangeEvent(newNote, note, voiceNumber, velocity));
            newNote && this._setPitch(voiceNumber, newNote);
        }
    }

    _setPitch(voiceNumber, note) {
        const middleCOffset = (note - 60) * 100;
        this._pitches.nodes[voiceNumber].offset.setTargetAtTime(middleCOffset, this._now, this._patch.get('glideTime'));
    }

    get C4Offset() {
        return this._pitches;
    }
}
