import AudioModule from './AudioModule.js';

export default class ControllerModule extends AudioModule {
    _initialise() {
        super._initialise()
        const context = this._audioContext;

        this._pitchBendOut = new ConstantSourceNode(context, {offset: 0});
        this._modWheelOut = new ConstantSourceNode(context, {offset: 0});
        this._middleCOffetOut = new ConstantSourceNode(context, {offset: 0});
        this._pitchBendOut.start();
        this._modWheelOut.start();
        this._middleCOffetOut.start();
        this._downKeys = [];
        this._currentNote = undefined;

        this._isTouchDevice = (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));

        const keys = document.querySelectorAll('.key');
        const downEvent = this._isTouchDevice ? 'touchstart' : 'mousedown'
        keys.forEach(key => {
            key.addEventListener(downEvent, evt => this._onKeyMouseDown(evt));
        });

        navigator.requestMIDIAccess && this._connectToMIDI();

    }

    get _initialState() {
        return {
            glideTime: 0,   // in seconds
        };
    }

    _connectToMIDI() {
        const onMIDISuccess = (midiAccess) => {
            console.log("MIDI ready!", midiAccess);
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
        switch (message[0]) {
            case 159:
                this._onKeyDown(message[1], message[2]);
                break;
            case 143:
                this._onKeyUp(message[1], message[2]);
                break;
            case 239:
                this._onPitchBend(message[2]);
        }
        let str = ``;
        for (const character of evt.data) {
            str += `${character.toString(10)} `;
        }
    }

    _onKeyMouseDown(evt) {
        const key = evt.target;
        const upEvent = this._isTouchDevice ? 'touchend' : 'mouseup';
        if (key.classList.contains('key')) {
            const note = Number(key.getAttribute('data-note'));
            this._onKeyDown(note, 60);
            key.classList.toggle('down', true);
            key.addEventListener(upEvent, this._onKeyMouseUp);
            key.addEventListener('mouseout', this._onKeyMouseUp);
        }
        evt.preventDefault();
    }

    _onKeyMouseUp = evt => {
        const key = evt.target;
        if (key) {
            key.classList.toggle('down', false);
            const note = Number(key.getAttribute('data-note'));
            this._onKeyUp(note, 60);
            key.removeEventListener('mouseup', this._onKeyMouseUp);
            key.removeEventListener('mouseout', this._onKeyMouseUp);
            delete this._currentKey;
        }
        evt.preventDefault();
    }

    _onKeyDown(note, velocity) {
        const middleCOffset = (note - 60) * 100;
        const event = new CustomEvent('noteon', {
            detail: {
                MIDINote: note,
                middleCOffset: middleCOffset,
                velocity: velocity / 127,
            },
        });
        this._eventBus.dispatchEvent(event);
        this._middleCOffetOut.offset.cancelAndHoldAtTime(this._now).setTargetAtTime(middleCOffset, this._now, this._patch.get('glideTime'));
        this._downKeys.unshift(note);
        this._currentNote = note;
    }

    _onKeyUp(note, velocity) {
        this._downKeys = this._downKeys.filter(item => (item !== note));
        if (note === this._currentNote) {
            this._currentNote = undefined;
            if (this._downKeys.length) {
                const newNote = this._downKeys.shift();
                this._onKeyDown(newNote, velocity);
            }
            const event = new CustomEvent('noteoff', {
                detail: {
                    MIDINote: note,
                },
            });
            this._eventBus.dispatchEvent(event);
        }
    }

    _onPitchBend(value) {
        // convert to a cents value +- 200
        this._pitchBendOut.offset.setTargetAtTime(100 * (value - 64)/32, this._now, this._minimumTimeConstant);
    }

    _onModWheel(value) {
        // convert to value 0 - 1;
        this._modWheelOut.offset.setTargetAtTime(value/127, this._now, this._minimumTimeConstant);
    }

    get C4Offset() {
        // cents offset from C4, glide applied
        return this._middleCOffetOut;
    }

    get pitchBend() {
        // +- 200 cents
        return this._pitchBendOut;
    }

    get modWheel() {
        // 0 - 1
        return this._modWheelOut;
    }
}
