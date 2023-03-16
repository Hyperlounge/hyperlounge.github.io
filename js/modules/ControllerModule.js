import AudioModule from './AudioModule.js';

export default class ControllerModule extends AudioModule {
    _initialise() {
        super._initialise()
        const context = this._audioContext;

        this._pitchBendOut = new ConstantSourceNode(context, {offset: 0});
        this._middleCOffetOut = new ConstantSourceNode(context, {offset: 0});
        this._pitchBendOut.start();
        this._middleCOffetOut.start();
        this._downKeys = [];
        this._currentNote = undefined;

        this._isTouchDevice = (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));

        this._keyboard = document.querySelector('.keyboard');
        if (this._isTouchDevice) {
            this._notesTouched = [];
            this._keyboard.addEventListener('touchstart', evt => this._onKeyTouchStart(evt))
        } else {
            this._keyboard.addEventListener('mousedown', evt => this._onKeyMouseDown(evt))
        }

        navigator.requestMIDIAccess && this._connectToMIDI();

    }

    get _initialState() {
        return {
            glideTime: 0,   // in seconds
            legato: false,
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
        console.log(message[0], message[1], message[2]);
        const statusByte = message[0];
        if (statusByte >= 128 && statusByte <= 143) {
            this._onKeyUp(message[1], message[2]);
        } else if (statusByte >= 144 && statusByte <= 159) {
            this._onKeyDown(message[1], message[2]);
        } else if (statusByte >= 224 && statusByte <= 239) {
            this._onPitchBend(message[2]);
        } else if (statusByte >= 176 && statusByte <= 191 && message[1] === 1) {
            this._onModWheel(message[2])
        }
    }

    _onKeyMouseDown(evt) {
        evt.preventDefault();
        const key = evt.target;
        if (key.classList.contains('key')) {
            const note = Number(key.getAttribute('data-note'));
            this._onKeyDown(note, 70);
            document.body.addEventListener('mousemove', this._onKeyMouseMove);
            document.body.addEventListener('mouseup', this._onKeyMouseUp);
        }
    }

    _onKeyMouseMove = evt => {
        evt.preventDefault();
        const key = document.elementFromPoint(evt.pageX, evt.pageY);
        if (key.classList.contains('key')) {
            const note = Number(key.getAttribute('data-note'));
            if (note !== this._currentNote) {
                const prevNote = this._currentNote;
                this._onKeyDown(note, 70);
                this._onKeyUp(prevNote, 70);
            }
        } else {
            this._onKeyUp(this._currentNote, 70);
        }
    }

    _onKeyMouseUp = evt => {
        evt.preventDefault();
        if (this._currentNote) {
            this._onKeyUp(this._currentNote, 70);
            document.body.removeEventListener('mousemove', this._onKeyMouseMove);
            document.body.removeEventListener('mouseup', this._onKeyMouseUp);
        }
    }

    _onKeyTouchStart(evt) {
        evt.preventDefault();
        const key = evt.target;
        if (key.classList.contains('key')) {
            const note = Number(key.getAttribute('data-note'));
            this._onKeyDown(note, 70);
            this._notesTouched.includes(note) || this._notesTouched.push(note);
            key.addEventListener('touchmove', this._onKeyTouchMove);
            key.addEventListener('touchcancel', this._onKeyTouchCancel);
            key.addEventListener('touchend', this._onKeyTouchEnd);
        }
    }

    _compareNotesTouched(evt) {
        const notesTouched = [];
        Array.from(evt.touches).forEach(touch => {
            const key = document.elementFromPoint(touch.pageX, touch.pageY);
            if (key.classList.contains('key')) {
                const note = Number(key.getAttribute('data-note'));
                notesTouched.includes(note) || notesTouched.push(note);
            }
        });
        // any notes newly in the array trigger a keyDown
        notesTouched.filter(note => !this._notesTouched.includes(note)).forEach(note => {
            this._onKeyDown(note, 70);
        });
        // any notes now missing trigger a keyUp
        this._notesTouched.filter(note => !notesTouched.includes(note)).forEach(note => {
            this._onKeyUp(note, 70);
        });
        this._notesTouched = notesTouched;
    }

    _onKeyTouchMove = evt => {
        evt.preventDefault();
        this._compareNotesTouched(evt);
    }

    _onKeyTouchCancel = evt => {
        evt.preventDefault();
        this._onKeyTouchEnd(evt);
    }

    _onKeyTouchEnd = evt => {
        evt.preventDefault();
        this._compareNotesTouched(evt);
        const key = evt.target;
        key.removeEventListener('touchmove', this._onKeyTouchMove);
        key.removeEventListener('touchcancel', this._onKeyTouchCancel);
        key.removeEventListener('touchend', this._onKeyTouchEnd);
    }

    _onKeyDown(note, velocity, reusedNote = false) {
        const middleCOffset = (note - 60) * 100;
        const legato = this.getParam('legato');
        if (!legato || (this._downKeys.length === 0 && !reusedNote)) {
            const event = new CustomEvent('noteon', {
                detail: {
                    MIDINote: note,
                    middleCOffset: middleCOffset,
                    velocity: velocity / 127,
                },
            });
            this._eventBus.dispatchEvent(event);
        }
        this._middleCOffetOut.offset.cancelAndHoldAtTime(this._now).setTargetAtTime(middleCOffset, this._now, this._patch.get('glideTime'));
        this._downKeys.unshift(note);
        this._currentNote = note;
        const key = document.querySelector(`.key[data-note="${note}"]`);
        key && key.classList.toggle('down', true);
    }

    _onKeyUp(note, velocity) {
        this._downKeys = this._downKeys.filter(item => (item !== note));
        if (note === this._currentNote) {
            this._currentNote = undefined;
            if (this._downKeys.length) {
                const newNote = this._downKeys.shift();
                this._onKeyDown(newNote, velocity, true);
            }
            if (!this.getParam('legato') || this._downKeys.length === 0) {
                const event = new CustomEvent('noteoff', {
                    detail: {
                        MIDINote: note,
                    },
                });
                this._eventBus.dispatchEvent(event);
            }
        }
        const key = document.querySelector(`.key[data-note="${note}"]`);
        key && key.classList.toggle('down', false);
    }

    _onPitchBend(value) {
        // convert to a cents value +- 200
        this._pitchBendOut.offset.setTargetAtTime(100 * (value - 64)/32, this._now, this._minimumTimeConstant);
    }

    _onModWheel(value) {
        // convert to value 0 - 1;
        const event = new CustomEvent('modwheel', {
            detail: {
                value: value / 127,
            },
        });
        this._eventBus.dispatchEvent(event);
    }

    get C4Offset() {
        // cents offset from C4, glide applied
        return this._middleCOffetOut;
    }

    get pitchBend() {
        // +- 200 cents
        return this._pitchBendOut;
    }
}
