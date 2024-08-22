import AudioModule from './AudioModule.js';
import MidiEvent from '../events/MidiEvent.js';

export default class MidiModule extends AudioModule {
    _initialise() {
        super._initialise();

        navigator.requestMIDIAccess && this._connectToMIDI();
    }

    _connectToMIDI() {
        const onMIDISuccess = (midiAccess) => {
            //console.log("MIDI ready!", midiAccess);
            for (const entry of midiAccess.inputs) {
                const input = entry[1];
                console.log(
                    `Input port [type:'${input.type}']` +
                    ` id:'${input.id}'` +
                    ` manufacturer:'${input.manufacturer}'` +
                    ` name:'${input.name}'` +
                    ` version:'${input.version}'`
                );
            }
            midiAccess.inputs.forEach((entry) => {
                entry.onmidimessage = evt => this._onMIDIMessage(evt);
            });
        }

        function onMIDIFailure(msg) {
            console.error(`Failed to get MIDI access - ${msg}`);
        }

        navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    }

    _onMIDIMessage(evt) {
        const message = evt.data;
        //console.log(message[0], message[1], message[2]);
        let statusByte = message[0];
        if (statusByte >= 128 && statusByte <= 143) {
            statusByte = MidiEvent.NOTE_OFF;
        } else if (statusByte >= 144 && statusByte <= 159) {
            statusByte = MidiEvent.NOTE_ON;
        } else if (statusByte >= 224 && statusByte <= 239) {
            statusByte = MidiEvent.PITCH_BEND;
        } else if (statusByte >= 176 && statusByte <= 191) {
            statusByte = MidiEvent.CONTROLLER;
        }
        this._eventBus.dispatchEvent(new MidiEvent(statusByte, message[1], message[2]));
    }
}
