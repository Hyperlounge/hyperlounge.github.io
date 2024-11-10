import ModularSynth from './modules/ModularSynth.js';
import template from './templates/template.js';
import Dialog from './misc/Dialog.js';
import Library from './Library.js';
import LibraryView from './LibraryView.js';

const initialPatch = {"global":{"totalVoices":1,"legato":true,"envelopeStretch":false,"name":"Too High!","bank":"Basses"},"controllerHelper":{"pitchBendMax":200,"modulationMax":100},"voiceAllocator":{"numberOfVoices":0,"glideTime":0.019857606383389993},"osc1":{"waveform":"sawtooth","range":-1,"tune":0,"fineTune":2,"modAmount":100,"crossModAmount":0},"osc2":{"waveform":"triangle","range":-2,"tune":0,"fineTune":-1,"modAmount":100,"crossModAmount":0},"oscLevel1":{"level":0.066},"oscLevel2":{"level":0.048},"noiseLevel1":{"level":0},"amplifier":{},"loudnessEnvelope":{"attackSeconds":0,"decaySeconds":0,"sustainLevel":1,"releaseSeconds":0,"velocityAmount":0.5},"filter":{"type":"lowpass","rolloff":12,"frequency":69.35183155248555,"resonance":6.2,"modAmount":0,"keyboardFollowAmount":1,"envelopeAmount":4900},"filterEnvelope":{"attackSeconds":0.05830307435355809,"decaySeconds":0.5348507922869201,"sustainLevel":0.51,"releaseSeconds":0,"velocityAmount":0.56},"lfo":{"waveform":"triangle","frequency":5.495408738576245,"fixedAmount":0,"modWheelAmount":1,"delay":0},"noise":{"type":"white"},"softKeyboard":{}};

const banks = [
    'Leads',
    'Keys',
    'Basses',
    'Pads',
    'Strings',
    'Brass',
    'Plucks',
    'FX',
    'Percussion',
    'Misc',
    'Prototypes'
];

export default class PolySynth extends ModularSynth {
    constructor(elementId) {
        super();
        this._root = document.getElementById(elementId);

        this._render();

        this._library = new Library();
        fetch('library/index.json').then(response => {
            response.text().then(text => {
                this._library.library = JSON.parse(text).library;
                this.loadPatch();
            });
        });

        this.createModules();
        this.connectModules();

        document.getElementById('preset-name').innerHTML = this.globalPatch.get('name');

        this.addEventListeners();
    }

    createModules() {
        this.createMidiModule();
        this.createSoftKeyboardModule();
        this._controllerHelper = this.createControllerHelperModule('controllerHelper');
        this._voiceAllocator = this.createVoiceAllocatorModule('voiceAllocator');
        this._osc1 = this.createPolyOscillatorModule('osc1');
        this._osc2 = this.createPolyOscillatorModule('osc2');
        this._oscLevel1 = this.createPolyLevelModule('oscLevel1');
        this._oscLevel2 = this.createPolyLevelModule('oscLevel2');
        this._noiseLevel1 = this.createPolyLevelModule('noiseLevel1');
        this._amplifier = this.createPolyAmpModule('amplifier');
        this._loudnessEnvelope = this.createPolyEnvelopeModule('loudnessEnvelope');
        this._filter = this.createPolyFilterModule('filter');
        this._filterEnvelope = this.createPolyEnvelopeModule('filterEnvelope');
        this._lfo = this.createLFOModule('lfo');
        this._noise = this.createNoiseModule('noise');
    }

    connectModules() {
        this._voiceAllocator.C4Offset.polyConnectTo(this._osc1.offsetCentsIn);
        this._voiceAllocator.C4Offset.polyConnectTo(this._osc2.offsetCentsIn);
        this._voiceAllocator.C4Offset.polyConnectTo(this._filter.keyboardFollowIn);
        this._osc1.audioOut.polyConnectTo(this._oscLevel1.audioIn);
        this._osc2.audioOut.polyConnectTo(this._oscLevel2.audioIn);
        this._osc1.offsetCentsIn.fanOutConnectFrom(this._controllerHelper.pitchBend);
        this._osc2.offsetCentsIn.fanOutConnectFrom(this._controllerHelper.pitchBend);
        this._osc1.audioOut.polyConnectTo(this._osc2.crossModulationIn);
        this._oscLevel1.audioOut.polyConnectTo(this._amplifier.audioIn);
        this._oscLevel2.audioOut.polyConnectTo(this._amplifier.audioIn);
        this._amplifier.modulationIn.polyConnectFrom(this._loudnessEnvelope.envelopeOut);
        this._amplifier.audioOut.polyConnectTo(this._filter.audioIn);
        this._filter.envelopeIn.polyConnectFrom(this._filterEnvelope.envelopeOut);
        this._lfo.lfoOut.connect(this._osc1.modulationIn);
        this._lfo.lfoOut.connect(this._osc2.modulationIn);
        this._lfo.lfoOut.connect(this._filter.modulationIn);
        this._filter.audioOut.fanInConnectTo(this.audioContext.destination);
        this._amplifier.audioIn.polyConnectFrom(this._noiseLevel1.audioOut);
        this._noiseLevel1.audioIn.fanOutConnectFrom(this._noise.noiseOut);
        this._noise.noiseOut.connect(this._lfo.noiseIn);
    }

    addEventListeners() {
        document.getElementById('preset-name').addEventListener('click', evt => this.showLibrary(evt));
        document.getElementById('save-patch').addEventListener('click', () => this.savePatchToFile());
        document.getElementById('share-patch').addEventListener('click', () => this.sharePatch());
        document.getElementById('pitch-bend').addEventListener('input', evt => {
            this._controllerHelper._onPitchBend(evt.target.value + 64);
        });
        document.getElementById('mod-wheel').addEventListener('input', evt => {
            this._controllerHelper._onModWheel(evt.target.value);
        });
        document.getElementById('reference-tone').addEventListener('change', this.onReferenceToneChange);
        document.getElementById('power').addEventListener('change', this.onPowerSwitchChange);
        this._root.addEventListener('drop', evt => this.dropHandler(evt));
        this._root.addEventListener('dragover', evt => this.dragOverHandler(evt));
        this.globalPatch.addEventListener('change', () => {
            document.getElementById('preset-name').innerHTML = this.globalPatch.get('name');
        });
        window.addEventListener('unload', () => {
            this.savePatch();
        });
        this.eventBus.addEventListener('modwheel', evt => {
            document.getElementById('mod-wheel').value = evt.detail.midiValue;
        });
        this.eventBus.addEventListener('pitchbend', evt => {
            document.getElementById('pitch-bend').value = evt.detail.midiValue - 64;
        });
    }

    onPowerSwitchChange = evt => {
        if (this._powerFirstTouch) {
            clearTimeout(this._powerFirstTouch);
            window.location.reload();
        } else {
            this._powerFirstTouch = setTimeout(() => {
                delete this._powerFirstTouch;
            }, 500);
        }
        if (evt.target.value) {
            this.audioContext.resume();
        } else {
            this.audioContext.suspend();
        }
    }

    showLibrary(evt) {
        const { target } = evt;
        if (! this._libraryRoot) {
            this._libraryRoot = document.createElement('div');
            this._libraryRoot.id = 'library-root';
            this._libraryRoot.className = 'library-root show';
            this._libraryRoot.style.left = target.offsetLeft + 'px';
            const top = (target.offsetTop + target.offsetHeight);
            this._libraryRoot.style.top = top + 'px';
            this._libraryRoot.style.maxHeight = (window.innerHeight - top) + 'px';
            document.body.appendChild(this._libraryRoot);
            const libraryView = new LibraryView(this._libraryRoot.id, this._library, '');
            libraryView.addEventListener('preset-selected', evt => {
                this._libraryRoot.classList.toggle('show', false);
                this.loadPresetFromLibrary(evt.detail).then(patch => {
                    this.patch = initialPatch;
                    this.patch = patch;
                    this._presetId = evt.detail;
                    if (location.search) {
                        history.replaceState({}, '', location.origin + location.pathname);
                    }
                });
            });
        } else {
            this._libraryRoot.classList.toggle('show');
        }
    }

    loadPresetFromLibrary(id) {
        return new Promise(resolve => {
            const filePath = this._library.getPresetPathById(id);
            const xhr = new XMLHttpRequest();
            xhr.open('get', filePath);
            xhr.onload = () => {
                resolve(JSON.parse(xhr.responseText));
            }
            xhr.send();
        });
    }

    dragOverHandler(ev) {
        ev.preventDefault();
    }

    dropHandler(ev) {
        ev.preventDefault();
        if (ev.dataTransfer.items) {
            if (ev.dataTransfer.items.length > 1) {
                alert('Please drag only one patch file onto the synth.');
            } else {
                // Use DataTransferItemList interface to access the file(s)
                [...ev.dataTransfer.items].forEach(item => {
                    // If dropped items aren't files, reject them
                    if (item.kind === "file") {
                        const file = item.getAsFile();
                        const fileName = file.name;
                        const [name, bank] = fileName.replace(/^([^-]+)- ([^./]+)\.hspatch.json$/, '$2/$1').split('/');
                        file.text().then(text => {
                            let patch;
                            try {
                                patch = JSON.parse(text);
                            } catch(e) {
                                alert(e);
                            }
                            if (patch) {
                                this.patch = initialPatch;
                                this.patch = patch;
                                this.globalPatch.set({name, bank});
                                if (location.search) {
                                    history.replaceState({}, '', location.origin + location.pathname);
                                }
                            }
                        });
                    }
                });
            }
        }
    }

    get _initialGlobalPatch() {
        return {
            ...super._initialGlobalPatch,
            envelopeStretch: false,
            name: 'Default preset',
            bank: 'Misc',
        }
    }

    savePatch() {
        localStorage.setItem('PolySynth-current-patch', JSON.stringify(this.patch))
    }

    loadPatch() {
        const params = {};
        if (location.search) {
            location.search.slice(1).split('&').map(item => {
                const [ key, value ] = item.split('=');
                params[key] = decodeURIComponent(value);
            })
        }
        if (params.preset) {
            const preset = this._library.getPresetByNameAndBank(params.preset, params.bank);
            this._presetId = preset.id;
            this.loadPresetFromLibrary(preset.id).then(patch => {
                this.patch = initialPatch;
                this.patch = patch;
                if (params.changes) {
                    this._patch.set(JSON.parse(params.changes));
                }
            });
        } else {
            let patch = localStorage.getItem('PolySynth-current-patch');
            if (patch) {
                patch = JSON.parse(patch);
            } else {
                patch = initialPatch;
            }

            try {
                if (patch) {
                    this.patch = initialPatch;
                    this.patch = patch;
                }
                const preset = this._library.getPresetByNameAndBank(this.globalPatch.get('name'), this.globalPatch.get('bank'));
                preset && (this._presetId = preset.id);
            } catch (e) {
                alert(e);
            }
        }
    }

    getPatchChanges() {
        return new Promise(resolve => {
            this.loadPresetFromLibrary(this._presetId).then(patch => {
                const preset = patch;
                const currentPatch = this.patch;
                const changes = {};
                Object.keys(preset).forEach(section => {
                    const presetSection = preset[section];
                    const currentSection = currentPatch[section];
                    Object.keys(presetSection).forEach(key => {
                        const presetValue = presetSection[key];
                        const currentValue = currentSection[key];
                        if (currentValue !== presetValue) {
                            if (!changes[section]) changes[section] = {};
                            changes[section][key] = currentValue;
                        }
                    });
                });
                resolve(changes);
            });
        });
    }

    sharePatch() {
        this.getPatchChanges().then(changes => {
            const { name, bank } = this.globalPatch.attributes;
            const url = location.origin + location.pathname + '?preset=' + encodeURIComponent(name) + '&bank=' + encodeURIComponent(bank) + '&changes=' + encodeURIComponent(JSON.stringify(changes));
            new Dialog(`
                <p class="centered"><a href='${url}' target="_blank">Click to open in new tab</a></p>
                `, {
                maxWidth: 500,
                title: 'Share Patch',
                optionLabels: ['Copy link to clipboard', 'Cancel']
            }).then(data => {
                const { option } = data;
                if (option === 0) {
                    navigator.clipboard.writeText(url);
                }
            });
        });
    }

    savePatchToFile() {
        new Dialog(`
        <form>
            <p><label for="preset-name">Patch name:</label><input type="text" name="preset-name" value="${this.globalPatch.get('name')}"/></p>
            <p><label for="patch-bank">Bank:</label><select name="patch-bank">
                ${banks.map(bank => `<option ${this.globalPatch.get('bank') === bank ? 'selected' : ''}>${bank}</option>`).join('')}
            </select></p>
        </form>
        `, {
            maxWidth: 400,
            title: 'Save Patch',
            optionLabels: ['Save', 'Cancel']
        }).then(data => {
            const { option, contentElement } = data;
            if (option === 0) {
                const name = contentElement.querySelector('[name="preset-name"]').value || 'patch';
                const bank = contentElement.querySelector('[name="patch-bank"]').value || 'Misc';
                this.globalPatch.set({name, bank});
                const element = document.createElement('a');
                element.setAttribute('href', 'data:application/json,' + encodeURIComponent(JSON.stringify(this.patch)));
                element.setAttribute('download', `${bank}- ${name}.hspatch.json`);

                element.style.display = 'none';
                document.body.appendChild(element);

                element.click();

                document.body.removeChild(element);
            }
        })


    }

    onReferenceToneChange = evt => {
        const ctx = this.audioContext;
        if (evt.target.value) {
            this._refToneNode = ctx.createOscillator();
            this._refToneNode.type = 'sine';
            this._refToneNode.frequency.setValueAtTime(261.63, ctx.currentTime);
            this._refToneLevel = ctx.createGain();
            this._refToneLevel.gain.setValueAtTime(0.02, ctx.currentTime);
            this._refToneNode.connect(this._refToneLevel);
            this._refToneLevel.connect(ctx.destination);
            this._refToneNode.start();
        } else if (this._refToneNode) {
            this._refToneNode.stop();
            this._refToneNode.disconnect();
            this._refToneLevel.disconnect();
            delete this._refToneNode;
            delete this._refToneLevel;
        }

    }

    _render() {
        this._root && (this._root.innerHTML = template());
    }
}
