import ModularSynth from './modules/ModularSynth.js';
import Dialog from './components/Dialog.js';
import Library from './Library.js';
import LibraryView from './LibraryView.js';
import MidiEvent from './events/MidiEvent.js';

const initialPatch = '{"global":{"totalVoices":1,"legato":true,"envelopeStretch":false,"name":"Too High!","bank":"Basses"},"controllerHelper":{"pitchBendMax":200,"modulationMax":100},"voiceAllocator":{"numberOfVoices":0,"glideTime":0.019857606383389993},"osc1":{"waveform":"sawtooth","range":-1,"tune":0,"fineTune":2,"modAmount":100,"crossModAmount":0},"osc2":{"waveform":"triangle","range":-2,"tune":0,"fineTune":-1,"modAmount":100,"crossModAmount":0},"oscLevel1":{"level":0.066},"oscLevel2":{"level":0.048},"noiseLevel1":{"level":0},"amplifier":{},"loudnessEnvelope":{"attackSeconds":0,"decaySeconds":0,"sustainLevel":1,"releaseSeconds":0,"velocityAmount":0.5},"filter":{"type":"lowpass","frequency":69.35183155248555,"resonance":6.2,"modAmount":0,"keyboardFollowAmount":1,"envelopeAmount":4900},"filterEnvelope":{"attackSeconds":0.05830307435355809,"decaySeconds":0.5348507922869201,"sustainLevel":0.51,"releaseSeconds":0,"velocityAmount":0.56},"lfo":{"waveform":"triangle","frequency":5.495408738576245,"fixedAmount":0,"modWheelAmount":1,"delay":0},"noise":{"type":"white"},"softKeyboard":{}}';

function verticalSlider(id, label, min, max, list) {
    const isValuesList = !!(!!list && !!list.length && typeof list[0] === 'object');
    return `
    <span class="control vertical-slider">
        <label>${label}</label>
        <div class="control-body">
            <input id="${id}" type="range" min="${min}" max="${max}" ${isValuesList ? `list="${id}-values"` : ''} orient="vertical"/>   
            ${isValuesList ? `
            <datalist id="${id}-values">
                ${list.map(item => `<option value="${item.value}"></option>`).join('')}
            </datalist>
            ` : ''}
            ${!!list && !!list.length ? `
            <div class="labels">
                ${list.map(item => `<div class="label">${isValuesList ? item.label || '' : item}</div>`).join('')}
            </div>
            ` : ''}
        </div>
    </span>
    `
}

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
];

const labels0to10 = [10,9,8,7,6,5,4,3,2,1,0];
const labelsMinus5toPlus5 = [5,4,3,2,1,0,-1,-2,-3,-4,-5];
const labels0to10log = [10,5,2.5,1.2,600,300,150,70,30,10,0];

const noiseTypes = [
    {value: '2', label: 'WHITE', param: 'white'},
    {value: '1', label: 'PINK', param: 'pink'},
    {value: '0', label: 'BROWN', param: 'brown'},
]

const waveforms = [
    {value: '3', label: 'SIN', param: 'sine'},
    {value: '2', label: 'TRI', param: 'triangle'},
    {value: '1', label: 'SAW', param: 'sawtooth'},
    {value: '0', label: 'SQU', param: 'square'},
];

const lfoWaveforms = [
    {value: '6', label: 'SIN', param: 'sine'},
    {value: '5', label: 'TRI', param: 'triangle'},
    {value: '4', label: 'SAW', param: 'sawtooth'},
    {value: '3', label: 'WAS', param: 'inverse-sawtooth'},
    {value: '2', label: 'SQU', param: 'square'},
    {value: '1', label: 'S+H', param: 'sample-hold'},
    {value: '0', label: 'NSE', param: 'noise'},
];

const filterTypes = [
    {value: '2', label: 'HIGH', param: 'highpass'},
    {value: '1', label: 'BAND', param: 'bandpass'},
    {value: '0', label: 'LOW', param: 'lowpass'},
];

const oscTemplate = id => `
<div class="control-group">
    <div class="vertical-group">
    ${verticalSlider(`${id}-waveform`, 'Wave', 0, 3, waveforms)}
    ${verticalSlider(`${id}-range`, 'Range', -2, 2, [
        {value: 2, label: '2'},
        {value: 1, label: '4'},
        {value: 0, label: '8'},
        {value: -1, label: '16'},
        {value: -2, label: '32'},
    ])}
    </div>
    ${verticalSlider(`${id}-tune`, 'Tune', -7, 7, [
        {value: 7, label: '+7'},
        {value: 6},
        {value: 5},
        {value: 4},
        {value: 3},
        {value: 2},
        {value: 1},
        {value: 0, label: '0'},
        {value: -1},
        {value: -2},
        {value: -3},
        {value: -4},
        {value: -5},
        {value: -6},
        {value: -7, label: '-7'},
    ])}
    ${verticalSlider(`${id}-fine-tune`, 'Fine', -50, 50, ['+0.5', '0', '–0.5'])}
    ${verticalSlider(`${id}-modulation`, 'Mod', -50, 50, labelsMinus5toPlus5)}
    ${id === 'oscillator-2' ? verticalSlider(`${id}-cross-mod`, `O-1 Mod`, 0, 100, labels0to10) : verticalSlider(`${id}-noise-level`, `Noise`, 0, 100, labels0to10)}
    ${verticalSlider(`${id}-level`, 'Level', 0, 100, labels0to10)}
</div>
`;

const lfoTemplate = `
<div class="control-group">
    ${verticalSlider(`lfo-waveform`, 'Wave', 0, 6, lfoWaveforms)}
    ${verticalSlider(`lfo-frequency`, 'Freq.', 0, 100, ['100','50','25','12','6','3','1.5','0.8','0.4','0.2','0.1'])}
    ${verticalSlider(`lfo-fixed-level`, 'Level', 0, 100, labels0to10)}
    <div class="vertical-group">
        ${verticalSlider(`lfo-mod-wheel-level`, 'Mod Wheel', 0, 100, [10,8,6,4,2,0])}
        ${verticalSlider(`lfo-mod-delay`, 'Delay', 0, 100, [10,5,2.5,1.2,0.4,0])}
    </div>
</div>
`;

const filterTemplate = `
<div class="control-group">
    ${verticalSlider(`filter-type`, 'Pass', 0, 2, filterTypes)}
    ${verticalSlider(`filter-frequency`, 'Freq.', 0, 100, ['5k','2.5k','1.2k','600','300','150','75','36','18','9','4.5'])}
    ${verticalSlider(`filter-resonance`, 'Res.', 0, 100, labels0to10)}
    ${verticalSlider(`filter-envelope-amount`, 'Env.', 0, 100, labels0to10)}
    ${verticalSlider(`filter-modulation`, 'Mod.', 0, 100, labels0to10)}
    ${verticalSlider(`filter-keyboard`, 'Keys', 0, 100, labels0to10)}
</div>
`;

const ADSRTemplate = id => `
<div class="control-group">
    ${verticalSlider(`${id}-attack`, 'Attack', 0, 100, labels0to10log)}
    ${verticalSlider(`${id}-decay`, 'Decay', 0, 100, labels0to10log)}
    ${verticalSlider(`${id}-sustain`, 'Sustain', 0, 100, labels0to10)}
    ${verticalSlider(`${id}-release`, 'Release', 0, 100, labels0to10log)}
    ${verticalSlider(`${id}-velocity`, 'Velocity', 0, 100, labels0to10)}
</div>
`;

const controllersTemplate = `
<div class="control-group">
    ${verticalSlider(`voices`, 'Voices', 0, 8, [
        {value: 8, label: '8'},
        {value: 7, label: '7'},
        {value: 6, label: '6'},
        {value: 5, label: '5'},
        {value: 4, label: '4'},
        {value: 3, label: '3'},
        {value: 2, label: '2'},
        {value: 1, label: '1'},
        {value: 0, label: 'legato'},
    ])}
    ${verticalSlider(`glide-time`, 'Glide', 0, 100, labels0to10log)}
</div>
`;

function bindControl(controlId, module, parameterName, controlToParam = a => Number(a), paramToControl = a => String(a)) {
    const control = document.getElementById(controlId);
    if (!control) {
        throw new Error(`control #${controlId} does not exist.`)
    }
    const updateControl = evt => {
        if (control.type === 'checkbox') {
            control.checked = module.getParam(parameterName);
        } else {
            control.value = paramToControl(module.getParam(parameterName));
        }
    }
    updateControl();
    const updateModule = evt => {
        if (control.type === 'checkbox') {
            module.setParam(parameterName, control.checked);
        } else {
            module.setParam(parameterName, controlToParam(control.value));
        }
        if (location.search) {
            history.replaceState({}, '', location.origin + location.pathname);
        }
    }
    control.addEventListener(control.type === 'checkbox' ? 'change' : 'input', updateModule);
    module.addEventListener('patch-change', evt => {
        if (module.paramChanged(parameterName)) updateControl();
    });
}

function linearToLog(linearMax, logMax, logMin = 0) {
    return linear => (Math.pow(2, 10*Number(linear)/linearMax) - 1) * logMax / 1023;
}

function logToLinear(logMax, linearMax, logMin = 0) {
    return log => Math.log2(1023 * Number(log)/logMax + 1) * linearMax/10;
}

function linearToLogRange(linearMax, logMin, logMax) {
    const maxValue = Math.log2(logMax);
    const minValue = Math.log2(logMin);

    return linear => {
        const value = minValue + (Number(linear)/linearMax)*(maxValue-minValue);
        return Math.pow(2, value);
    }
}

function logRangeToLinear(logMin, logMax, linearMax) {
    const maxValue = Math.log2(logMax);
    const minValue = Math.log2(logMin);

    return log => {
        const value = Math.log2(Number(log));
        return linearMax * (value-minValue)/(maxValue-minValue);
    }
}

function optionToParam(list) {
    return a => list.find(item => item.value === a).param;
}

function paramToOption(list) {
    return a => list.find(item => item.param === a).value;
}

export default class PolySynth extends ModularSynth {
    constructor(elementId) {
        super();
        this._root = document.getElementById(elementId);

        this._render();

        this._root.addEventListener('drop', evt => this.dropHandler(evt));
        this._root.addEventListener('dragover', evt => this.dragOverHandler(evt));

        document.getElementById('save-patch').addEventListener('click', evt => this.savePatchToFile());
        document.getElementById('share-patch').addEventListener('click', evt => this.sharePatch());

        this._recordingData = [];
        this._recording = false;
        this._playing = false;
        document.getElementById('record').addEventListener('click', evt => this.toggleRecord());
        document.getElementById('play').addEventListener('click', evt => this.togglePlay());


        this._library = new Library();
        fetch('library/index.json').then(response => {
            response.text().then(text => {
                this._library.library = JSON.parse(text).library;
                this.loadPatch();
            });
        });
        document.getElementById('preset-name').addEventListener('click', evt => this.showLibrary(evt));

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



        window.addEventListener('unload', () => {
            this.savePatch();
        });

        document.getElementById('preset-name').innerHTML = this.globalPatch.get('name');
        bindControl('glide-time', this._voiceAllocator, 'glideTime', linearToLog(100, 10), logToLinear(10, 100));
        bindControl('voices', this._voiceAllocator, 'numberOfVoices');
        const bindOscillator = number => {
            const osc = this[`_osc${number}`];
            const level = this[`_oscLevel${number}`];
            bindControl(`oscillator-${number}-waveform`, osc, 'waveform', optionToParam(waveforms), paramToOption(waveforms));
            bindControl(`oscillator-${number}-range`, osc, 'range');
            bindControl(`oscillator-${number}-tune`, osc, 'tune');
            bindControl(`oscillator-${number}-fine-tune`, osc, 'fineTune');
            bindControl(`oscillator-${number}-modulation`, osc, 'modAmount', a => Number(a)*2, a => String(a/2));
            if (number === 1) {
                bindControl(`oscillator-1-noise-level`, this._noiseLevel1, 'level', a => Number(a)/1000, a => String(a*1000));
            } else {
                bindControl(`oscillator-2-cross-mod`, osc, 'crossModAmount', a => Number(a)*25, a => String(a/25));
            }
            bindControl(`oscillator-${number}-level`, level, 'level', a => Number(a)/1000, a => String(a*1000));
        }
        bindOscillator(1);
        bindOscillator(2);

        const bindADSR = (id, module) => {
            bindControl(`${id}-attack`, module, 'attackSeconds', linearToLog(100, 10), logToLinear(10, 100));
            bindControl(`${id}-decay`, module, 'decaySeconds', linearToLog(100, 10), logToLinear(10, 100));
            bindControl(`${id}-sustain`, module, 'sustainLevel', a => Number(a)/100, a => String(a*100));
            bindControl(`${id}-release`, module, 'releaseSeconds', linearToLog(100, 10), logToLinear(10, 100));
            bindControl(`${id}-velocity`, module, 'velocityAmount', a => Number(a)/100, a => String(a*100));
        }
        bindADSR('loudness-envelope', this._loudnessEnvelope);
        bindADSR('filter-envelope', this._filterEnvelope);

        bindControl('filter-type', this._filter, 'type', optionToParam(filterTypes), paramToOption(filterTypes));
        bindControl('filter-frequency', this._filter, 'frequency', linearToLogRange(100, 4.5, 5000), logRangeToLinear(4.5, 5000, 100));
        bindControl('filter-resonance', this._filter, 'resonance', a => Number(a)/5, a => String(a*5));
        bindControl('filter-envelope-amount', this._filter, 'envelopeAmount', a => Number(a)*100, a => String(a/100));
        bindControl('filter-modulation', this._filter, 'modAmount', a => Number(a)*100, a => String(a/100));
        bindControl('filter-keyboard', this._filter, 'keyboardFollowAmount', a => Number(a)/100, a => String(a*100));

        bindControl(`lfo-waveform`, this._lfo, 'waveform', optionToParam(lfoWaveforms), paramToOption(lfoWaveforms));
        bindControl('lfo-frequency', this._lfo, 'frequency', linearToLogRange(100, 0.1, 100), logRangeToLinear(0.1, 100, 100));
        bindControl('lfo-fixed-level', this._lfo, 'fixedAmount', a => Number(a)/100, a => String(a*100));
        bindControl('lfo-mod-wheel-level', this._lfo, 'modWheelAmount', a => Number(a)/100, a => String(a*100));
        bindControl(`lfo-mod-delay`, this._lfo, 'delay', linearToLog(100, 10), logToLinear(10, 100));

        bindControl('envelope-stretch', this, 'envelopeStretch');
        bindControl('noise-type', this._noise, 'type', optionToParam(noiseTypes), paramToOption(noiseTypes));

        this.globalPatch.addEventListener('change', evt => {
            document.getElementById('preset-name').innerHTML = this.globalPatch.get('name');
        })
    }

    showLibrary(evt) {
        const { target } = evt;
        if (! this._libraryRoot) {
            this._libraryRoot = document.createElement('div');
            this._libraryRoot.id = 'library-root';
            this._libraryRoot.className = 'library-root';
            this._libraryRoot.style.left = target.offsetLeft + 'px';
            this._libraryRoot.style.top = (target.offsetTop + target.offsetHeight) + 'px';
            document.body.appendChild(this._libraryRoot);
            const libraryView = new LibraryView(this._libraryRoot.id, this._library, '');
            libraryView.addEventListener('preset-selected', evt => {
                this._libraryRoot.style.display = 'none';
                this.loadPatchFromLibrary(evt.detail).then(patch => {
                    this.patch = patch;
                    this._presetId = evt.detail;
                    if (location.search) {
                        history.replaceState({}, '', location.origin + location.pathname);
                    }
                });
            });
        } else {
            this._libraryRoot.style.display = 'block';
        }
    }

    loadPatchFromLibrary(id) {
        return new Promise(resolve => {
            const filePath = this._library.getPresetPathById(id);
            const xhr = new XMLHttpRequest();
            xhr.open('get', filePath);
            xhr.onload = evt => {
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
                [...ev.dataTransfer.items].forEach((item, i) => {
                    // If dropped items aren't files, reject them
                    if (item.kind === "file") {
                        const file = item.getAsFile();
                        const fileName = file.name;
                        const [name, bank] = fileName.replace(/^.*patch-([^-]+)-([^./]+)\.txt$/, '$2/$1').split('/');
                        file.text().then(text => {
                            let patch;
                            try {
                                patch = JSON.parse(text);
                            } catch(e) {
                                alert(e);
                            }
                            if (patch) {
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
            this.loadPatchFromLibrary(preset.id).then(patch => {
                this.patch = patch;
                if (params.changes) {
                    this._patch.set(JSON.parse(params.changes));
                    if (params.ditty) {
                        this.setDecodedDitty(params.ditty);
                        this.togglePlay();
                    }
                }
            });
        } else {
            const patch = localStorage.getItem('PolySynth-current-patch') || initialPatch;

            try {
                patch && (this.patch = JSON.parse(patch));
                const preset = this._library.getPresetByNameAndBank(this.globalPatch.get('name'), this.globalPatch.get('bank'));
                preset && (this._presetId = preset.id);
            } catch (e) {
                alert(e);
            }
        }
    }

    setDecodedDitty(encoded) {
        this._recordingData = encoded.match(/.{10}/g).map(item => {
            const time = parseInt(item.slice(0,4), 16)/100;
            const statusByte = parseInt(item.slice(4,6), 16);
            const dataByte1 = parseInt(item.slice(6,8), 16);
            const dataByte2 = parseInt(item.slice(8,10), 16);
            return {
                time,
                detail: { statusByte, dataByte1, dataByte2 },
            }
        });
    }

    getEncodedDitty() {
        const toHex = (val, digits) => {
            let hex = Number(val).toString(16);
            while (hex.length < digits) hex = '0' + hex;
            return hex;
        }
        return this._recordingData.map(item => `${toHex(Math.round(item.time * 100), 4)}${toHex(item.detail.statusByte, 2)}${toHex(item.detail.dataByte1, 2)}${toHex(item.detail.dataByte2, 2)}`).join('');
    }

    getPatchChanges() {
        return new Promise(resolve => {
            this.loadPatchFromLibrary(this._presetId).then(patch => {
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
        const ditty = this.getEncodedDitty();
        this.getPatchChanges().then(changes => {
            const { name, bank } = this.globalPatch.attributes;
            const url = location.origin + location.pathname + '?preset=' + encodeURIComponent(name) + '&bank=' + encodeURIComponent(bank) + '&changes=' + encodeURIComponent(JSON.stringify(changes)) + (ditty ? '&ditty=' + ditty : '');
            new Dialog(`
                <a href='${url}' target="_blank">Click to open in new tab</a>
                `, {
                maxWidth: 300,
                title: 'Share Patch' + (ditty ? ' and Ditty' : ''),
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
            <label for="preset-name">Patch name: </label><input type="text" name="preset-name" value="${this.globalPatch.get('name')}"/>
            <label for="patch-bank">&nbsp;&nbsp;&nbsp;&nbsp;Bank: </label><select name="patch-bank">
                ${banks.map(bank => `<option ${this.globalPatch.get('bank') === bank ? 'selected' : ''}>${bank}</option>`).join('')}
            </select>
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
                element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.patch)));
                element.setAttribute('download', `patch-${bank}-${name}.txt`);

                element.style.display = 'none';
                document.body.appendChild(element);

                element.click();

                document.body.removeChild(element);
            }
        })


    }

    toggleRecord() {
        if (this._playing) {
            this.togglePlay();
        }
        this._recording = !this._recording;
        document.getElementById('record').classList.toggle('stop', this._recording);
        if (this._recording) {
            this._recordingStartTime = this.audioContext.currentTime;
            this._recordingData = [];
            this.eventBus.addEventListener(MidiEvent.type, this.addRecordingEvent);
        } else {
            this.eventBus.removeEventListener(MidiEvent.type, this.addRecordingEvent);
        }
    }

    addRecordingEvent = (event) => {
        const { statusByte, dataByte1 } = event.detail;
        if ((statusByte >= 128 && statusByte <= 143) || (statusByte >= 144 && statusByte <= 159) || statusByte === MidiEvent.CONTROLLER && dataByte1 === MidiEvent.SUSTAIN_PEDAL) {
            this._recordingData.push({
                time: this.audioContext.currentTime - this._recordingStartTime,
                detail: {...event.detail},
            });
        }
    }

    togglePlay() {
        if (this._recording) {
            this.toggleRecord();
        }
        this._playing = !this._playing && this._recordingData.length > 0;
        document.getElementById('play').classList.toggle('stop', this._playing);
        if (this._playing) {
            this._playStartTime = this.audioContext.currentTime;
            this._playEventIndex = 0;

            const playNextEvent = () => {
                const event = this._recordingData[this._playEventIndex++];
                this._playTimeoutId = setTimeout(() => {
                    delete this._playTimeoutId;
                    const { statusByte, dataByte1, dataByte2 } = event.detail;
                    this.eventBus.dispatchEvent(new MidiEvent(statusByte, dataByte1, dataByte2));
                    if (this._playEventIndex === this._recordingData.length) {
                        this.togglePlay();
                    } else {
                        playNextEvent();
                    }
                }, (this._playStartTime + event.time - this.audioContext.currentTime) * 1000);
            }
            playNextEvent();
        } else {
            if (this._playTimeoutId !== undefined) {
                clearTimeout(this._playTimeoutId);
                delete this._playTimeoutId;
            }
            delete this._playStartTime;
            delete this._playEventIndex;
        }
    }

    _render() {
        this._root && (this._root.innerHTML = `
            <div class="synth">
                <div class="header">
                    <span id="preset-name"></span> <button id="save-patch">Save patch</button> <button id="share-patch">Share patch</button>
                    <span class="recorder"><button id="record"></button><button id="play"></button></span>
                </div>
                <div class="controls">
                    <div class="panel">
                        <h2>Controllers</h2>
                        <div id="controllers">${controllersTemplate}</div>
                    </div>
                    <div class="panel">
                        <h2>LFO</h2>
                        <div id="lfo">${lfoTemplate}</div>
                    </div>
                    <div class="panel">
                        <h2>Oscillator 1</h2>
                        <div id="oscillator-1">${oscTemplate('oscillator-1')}</div>
                    </div>
                    <div class="panel">
                        <h2>Oscillator 2</h2>
                        <div id="oscillator-2">${oscTemplate('oscillator-2')}</div>
                    </div>
                    <div class="panel">
                        <h2>Amp Envelope</h2>
                        <div id="loudness-envelope">${ADSRTemplate('loudness-envelope')}</div>
                    </div>
                    <div class="panel">
                        <h2>Filter Envelope</h2>
                        <div id="filter-envelope">${ADSRTemplate('filter-envelope')}</div>
                    </div>
                    <div class="panel">
                        <h2>Filter</h2>
                        <div id="filter">${filterTemplate}</div>
                    </div>
                    <div class="panel">
                        <h2>Global</h2>
                        <div class="control-group">
                            <div class="vertical-group">
                                <label>Envelope Stretch <input type="checkbox" id="envelope-stretch"/></label>
                                ${verticalSlider('noise-type', 'Noise', 0, 2, noiseTypes)}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="panel keyboard">
                    <div>
                        <button class="keyboard-range" value="transpose-down">&minus;</button>
                        transpose
                        <button class="keyboard-range" value="transpose-up">+</button>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <button class="keyboard-range" value="fewer-octaves">&minus;</button>
                        octaves
                        <button class="keyboard-range" value="more-octaves">+</button>
                    </div>
                    <div class="keyboard-keys"></div>
                </div>
            </div>
        `);
    }
}
