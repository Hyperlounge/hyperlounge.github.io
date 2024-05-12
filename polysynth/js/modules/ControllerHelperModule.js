import AudioModule from './AudioModule.js';
import MidiEvent from '../events/MidiEvent.js';

export default class ControllerHelperModule extends AudioModule {
    _initialise() {
        super._initialise()
        const context = this._audioContext;

        this._modWheelValue = 0;

        this._pitchBendOut = new ConstantSourceNode(context, {offset: 0});
        this._pitchBendOut.start();

        this._eventBus.addEventListener(MidiEvent.type, evt => this._onMIDIMessage(evt));

    }

    get _initialPatch() {
        return {
            pitchBendMax: 200,   // in cents
            modulationMax: 100,
        };
    }

    _onMIDIMessage(evt) {
        const { statusByte, dataByte1, dataByte2 } = evt.detail;

        if (statusByte === MidiEvent.PITCH_BEND) {
            this._onPitchBend(dataByte2);
        } else if (statusByte === MidiEvent.CONTROLLER && dataByte1 === MidiEvent.MOD_WHEEL) {
            this._onModWheel(dataByte2);
        } else if (statusByte === MidiEvent.CONTROLLER && dataByte1 === MidiEvent.SUSTAIN_PEDAL) {
            this._onSustainPedal(dataByte2);
        }
    }

    _onPitchBend(value) {
        // convert to a cents value +- pitchBendMax
        this._pitchBendOut.offset.setTargetAtTime(this._patch.get('pitchBendMax') * (value - 64)/64, this._now, this._minimumTimeConstant);
        this._triggerPitchBendEvent(value);
    }

    _onModWheel(value) {
        // convert to value 0 - 1;
        this._modWheelValue = value;
        this._triggerModWheelEvent(value);
    }

    _triggerModWheelEvent(value) {
        const event = new CustomEvent('modwheel', {
            detail: {
                midiValue: value,
                value: this._patch.get('modulationMax') * value / 127,
            },
        });
        this._eventBus.dispatchEvent(event);
    }

    _triggerPitchBendEvent(value) {
        const event = new CustomEvent('pitchbend', {
            detail: {
                midiValue: value,
            },
        });
        this._eventBus.dispatchEvent(event);
    }

    _onSustainPedal(value) {
        // convert to value 0 - 1;
        const event = new CustomEvent('sustainchange', {
            detail: {
                isOn: value > 0,
            },
        });
        this._eventBus.dispatchEvent(event);
    }

    _onPatchChange(evt) {
        super._onPatchChange(evt);
        this._update();
    }

    _update() {
        this._triggerModWheelEvent(this._modWheelValue);
    }

    get pitchBend() {
        // +- 200 cents
        return this._pitchBendOut;
    }
}
