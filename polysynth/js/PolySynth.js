import ModularSynth from './modules/ModularSynth.js';
import Dialog from './components/Dialog.js';
import Library from './Library.js';
import LibraryView from './LibraryView.js';
import MidiEvent from './events/MidiEvent.js';
import './components/RotaryKnob.js';
import './components/RotarySwitch.js';
import './components/ToggleSwitch.js';
import './components/VerticalSlider.js';
import './components/ModWheel.js';
import './components/KeyboardAdjuster.js';
import SoftKeyboardModule from './modules/SoftKeyboardModule.js';

const initialPatch = '{"global":{"totalVoices":1,"legato":true,"envelopeStretch":false,"name":"Too High!","bank":"Basses"},"controllerHelper":{"pitchBendMax":200,"modulationMax":100},"voiceAllocator":{"numberOfVoices":0,"glideTime":0.019857606383389993},"osc1":{"waveform":"sawtooth","range":-1,"tune":0,"fineTune":2,"modAmount":100,"crossModAmount":0},"osc2":{"waveform":"triangle","range":-2,"tune":0,"fineTune":-1,"modAmount":100,"crossModAmount":0},"oscLevel1":{"level":0.066},"oscLevel2":{"level":0.048},"noiseLevel1":{"level":0},"amplifier":{},"loudnessEnvelope":{"attackSeconds":0,"decaySeconds":0,"sustainLevel":1,"releaseSeconds":0,"velocityAmount":0.5},"filter":{"type":"lowpass","frequency":69.35183155248555,"resonance":6.2,"modAmount":0,"keyboardFollowAmount":1,"envelopeAmount":4900},"filterEnvelope":{"attackSeconds":0.05830307435355809,"decaySeconds":0.5348507922869201,"sustainLevel":0.51,"releaseSeconds":0,"velocityAmount":0.56},"lfo":{"waveform":"triangle","frequency":5.495408738576245,"fixedAmount":0,"modWheelAmount":1,"delay":0},"noise":{"type":"white"},"softKeyboard":{}}';

const SVG = 'media/svg'

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

const noiseTypes = [
    {label: 'WHITE', value: 'white', default: true},
    {label: 'PINK', value: 'pink'},
    {label: 'BROWN', value: 'brown'},
]

const waveforms = [
    {label: `<img alt="sine" src="${SVG}/sine-wave.svg"/>`, value: 'sine'},
    {label: `<img alt="triangle" src="${SVG}/triangle.svg"/>`, value: 'triangle', default: true},
    {label: `<img alt="sawtooth" src="${SVG}/saw-tooth.svg"/>`, value: 'sawtooth'},
    {label: `<img alt="square" src="${SVG}/square-wave.svg"/>`, value: 'square'},
];

const lfoWaveforms = [
    {label: `<img alt="sine" src="${SVG}/sine-wave.svg"/>`, value: 'sine'},
    {label: `<img alt="triangle" src="${SVG}/triangle.svg"/>`, value: 'triangle', default: true},
    {label: `<img alt="sawtooth" src="${SVG}/saw-tooth.svg"/>`, value: 'sawtooth'},
    {label: `<img alt="reverse sawtooth" src="${SVG}/reverse-saw.svg"/>`, value: 'inverse-sawtooth'},
    {label: `<img alt="square" src="${SVG}/square-wave.svg"/>`, value: 'square'},
    {label: `<img alt="sample and hold" src="${SVG}/sample-and-hold.svg"/>`, value: 'sample-hold'},
    {label: `<img alt="noise" src="${SVG}/noise.svg"/>`, value: 'noise'},
];

const filterTypes = [
    {label: 'HI', value: 'highpass'},
    {label: 'BA', value: 'bandpass'},
    {label: 'LO', value: 'lowpass', default: true},
];

function renderOptions(optionsList) {
    return optionsList.map(item => `<option value="${item.value}"${!!item.default ? ' selected' : ''}>${item.label}</option>`).join('');
}

const oscTemplate = id => `
<div class="control-group">
    <div class="vertical-group">
    <rotary-switch id="${id}-waveform" title="Waveform" labels="right">
        ${renderOptions(waveforms)}
    </rotary-switch>
    <rotary-switch id="${id}-range" title="Range" labels="right">
        <option value="2">2</option>
        <option value="1">4</option>
        <option value="0" selected>8</option>
        <option value="-1">16</option>
        <option value="-2">32</option>
    </rotary-switch>
    </div>
    <div class="vertical-group">
    <rotary-switch id="${id}-tune" title="Semitones">
        <option value="-7">&minus;7</option>
        <option value="-6"></option>
        <option value="-5"></option>
        <option value="-4"></option>
        <option value="-3"></option>
        <option value="-2"></option>
        <option value="-1"></option>
        <option value="0" selected>0</option>
        <option value="1"></option>
        <option value="2"></option>
        <option value="3"></option>
        <option value="4"></option>
        <option value="5"></option>
        <option value="6"></option>
        <option value="7">+7</option>
    </rotary-switch>
    <rotary-knob id="${id}-fine-tune" min-value="-50" max-value="50" scale-min="-0.5" scale-max="0.5" scale-step="0.1" minimal>Fine Tune</rotary-knob>
    </div>
    <div class="vertical-group">
    <rotary-knob id="${id}-modulation" min-value="-50" max-value="50" scale-min="-5" scale-max="5" scale-step="1" minimal>Modulation</rotary-knob>
    ${id === 'oscillator-2' ? `<rotary-knob id="${id}-cross-mod" min-value="0" max-value="100" scale-min="0" scale-max="10" scale-step="1">Cross-Mod</rotary-knob>` : `<rotary-knob id="${id}-noise-level" min-value="0" max-value="100" scale-min="0" scale-max="10" scale-step="1">Noise</rotary-knob>`}
    </div>
    <vertical-slider id="${id}-level" value="50" min-value="0" max-value="100" scale-min="0" scale-max="10" scale-step="1">Level</vertical-slider>
</div>
`;

const lfoTemplate = `
<div class="control-group">
    <div class="vertical-group">
        <rotary-switch id="lfo-waveform" title="Waveform">
            ${renderOptions(lfoWaveforms)}
        </rotary-switch>
        <rotary-knob id="lfo-frequency" value="60" max-value="100">Rate</rotary-knob>
    </div>
    <div class="vertical-group">
        <rotary-knob id="lfo-mod-wheel-level" value="10" max-value="100">Mod Wheel</rotary-knob>
        <rotary-knob id="lfo-mod-delay" value="70" max-value="100">Delay</rotary-knob>
    </div>
    <vertical-slider id="lfo-fixed-level" value="10" max-value="100">Level</vertical-slider>
</div>
`;

const filterTemplate = `
<div class="control-group">
    <div class="vertical-group">
    <rotary-switch id="filter-type" title="Pass" labels="right">
        ${renderOptions(filterTypes)}    
    </rotary-switch>
    <rotary-knob id="filter-frequency" value="50" max-value="100">Cut-off</rotary-knob>
    </div>
    <div class="vertical-group">
    <rotary-knob id="filter-resonance" max-value="100">Resonance</rotary-knob>
    <rotary-knob id="filter-envelope-amount" value="50" max-value="100">Envelope</rotary-knob>
    </div>
    <div class="vertical-group">
    <rotary-knob id="filter-modulation" max-value="100">Modulation</rotary-knob>
    <rotary-knob id="filter-keyboard" value="100" max-value="100">Follow Keys</rotary-knob>
    </div>
</div>
`;

const globalTemplate = `
<div class="control-group">
    <div class="vertical-group">
        <rotary-switch id="voices" title="Voices">
            <option value="0">LEG.</option>
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
        </rotary-switch>
        <rotary-knob id="glide-time" max-value="100">Glide</rotary-knob>
    </div>
    <div class="vertical-group">
        <rotary-switch id="noise-type" title="Noise" labels="right">
            ${renderOptions(noiseTypes)}
        </rotary-switch>
        <toggle-switch id="envelope-stretch">Env. Stretch</toggle-switch>
        <toggle-switch id="reference-tone">C4 Tone</toggle-switch>
    </div>
</div>
`

const ADSRTemplate = id => `
<div class="control-group">
    <vertical-slider id="${id}-attack" max-value="100">Attack</vertical-slider>
    <vertical-slider id="${id}-decay" max-value="100">Decay</vertical-slider>
    <vertical-slider id="${id}-sustain" value="100" max-value="100">Sustain</vertical-slider>
    <vertical-slider id="${id}-release" max-value="100">Release</vertical-slider>
    <vertical-slider id="${id}-velocity" value="50" max-value="100">Velocity</vertical-slider>
</div>
`;

const controllersTemplate = `
<div class="control-group">
    <mod-wheel id="pitch-bend" min-value="-64" max-value="64" snap-back>Bend</mod-wheel>
    <mod-wheel id="mod-wheel" max-value="127">Mod</mod-wheel>
</div>
`;

function bindControl(controlId, module, parameterName, controlToParam = a => Number(a), paramToControl = a => String(a)) {
    const control = document.getElementById(controlId);
    if (!control) {
        throw new Error(`control #${controlId} does not exist.`)
    }
    const updateControl = () => {
        if (control.type === 'checkbox') {
            control.checked = module.getParam(parameterName);
        } else {
            control.value = paramToControl(module.getParam(parameterName));
        }
    }
    updateControl();
    const updateModule = () => {
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
    module.addEventListener('patch-change', () => {
        if (module.paramChanged(parameterName)) updateControl();
    });
}

function linearToLog(linearMax, logMax) {
    return linear => (Math.pow(2, 10*Number(linear)/linearMax) - 1) * logMax / 1023;
}

function logToLinear(logMax, linearMax) {
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

export default class PolySynth extends ModularSynth {
    constructor(elementId) {
        super();
        this._root = document.getElementById(elementId);

        this._render();

        this._root.addEventListener('drop', evt => this.dropHandler(evt));
        this._root.addEventListener('dragover', evt => this.dragOverHandler(evt));

        document.getElementById('save-patch').addEventListener('click', () => this.savePatchToFile());
        document.getElementById('share-patch').addEventListener('click', () => this.sharePatch());

        this._recordingData = [];
        this._recording = false;
        this._playing = false;
        //document.getElementById('record').addEventListener('click', evt => this.toggleRecord());
        //document.getElementById('play').addEventListener('click', evt => this.togglePlay());


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

        document.getElementById('pitch-bend').addEventListener('input', evt => {
            this._controllerHelper._onPitchBend(evt.target.value + 64);
        });
        document.getElementById('mod-wheel').addEventListener('input', evt => {
            this._controllerHelper._onModWheel(evt.target.value);
        });

        bindControl('glide-time', this._voiceAllocator, 'glideTime', linearToLog(100, 10), logToLinear(10, 100));
        bindControl('voices', this._voiceAllocator, 'numberOfVoices');
        const bindOscillator = number => {
            const osc = this[`_osc${number}`];
            const level = this[`_oscLevel${number}`];
            bindControl(`oscillator-${number}-waveform`, osc, 'waveform', a => a);
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

        bindControl('filter-type', this._filter, 'type', a => a);
        bindControl('filter-frequency', this._filter, 'frequency', linearToLogRange(100, 4.5, 5000), logRangeToLinear(4.5, 5000, 100));
        bindControl('filter-resonance', this._filter, 'resonance', a => Number(a)/5, a => String(a*5));
        bindControl('filter-envelope-amount', this._filter, 'envelopeAmount', a => Number(a)*100, a => String(a/100));
        bindControl('filter-modulation', this._filter, 'modAmount', a => Number(a)*100, a => String(a/100));
        bindControl('filter-keyboard', this._filter, 'keyboardFollowAmount', a => Number(a)/100, a => String(a*100));

        bindControl(`lfo-waveform`, this._lfo, 'waveform', a => a);
        bindControl('lfo-frequency', this._lfo, 'frequency', linearToLogRange(100, 0.1, 100), logRangeToLinear(0.1, 100, 100));
        bindControl('lfo-fixed-level', this._lfo, 'fixedAmount', a => Number(a)/100, a => String(a*100));
        bindControl('lfo-mod-wheel-level', this._lfo, 'modWheelAmount', a => Number(a)/100, a => String(a*100));
        bindControl(`lfo-mod-delay`, this._lfo, 'delay', linearToLog(100, 10), logToLinear(10, 100));

        bindControl('envelope-stretch', this, 'envelopeStretch');
        bindControl('noise-type', this._noise, 'type', a => a);

        this.globalPatch.addEventListener('change', () => {
            document.getElementById('preset-name').innerHTML = this.globalPatch.get('name');
        });

        this.eventBus.addEventListener('modwheel', evt => {
            document.getElementById('mod-wheel').value = evt.detail.midiValue;
        });

        this.eventBus.addEventListener('pitchbend', evt => {
            document.getElementById('pitch-bend').value = evt.detail.midiValue - 64;
        });

        document.getElementById('reference-tone').addEventListener('change', this.onReferenceToneChange);

        document.getElementById('power').addEventListener('change', evt => {
            if (this._powerFirstTouch) {
                clearTimeout(this._powerFirstTouch);
                window.location.reload();
            } else {
                this._powerFirstTouch = setTimeout(() => {
                    delete this._powerFirstTouch;
                }, 500);
            }
            if (evt.target.checked) {
                this.audioContext.resume();
            } else {
                this.audioContext.suspend();
            }
        });
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
        const ditty = this.getEncodedDitty();
        this.getPatchChanges().then(changes => {
            const { name, bank } = this.globalPatch.attributes;
            const url = location.origin + location.pathname + '?preset=' + encodeURIComponent(name) + '&bank=' + encodeURIComponent(bank) + '&changes=' + encodeURIComponent(JSON.stringify(changes)) + (ditty ? '&ditty=' + ditty : '');
            new Dialog(`
                <p class="centered"><a href='${url}' target="_blank">Click to open in new tab</a></p>
                `, {
                maxWidth: 500,
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
        if (evt.target.checked) {
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
                    <!--span class="recorder"><button id="record"></button><button id="play"></button></span-->
                    <toggle-switch id="power" format="horizontal" cap-color="orangered">Power: </toggle-switch>
                </div>
                <div class="controls">
                    <div class="expression-controls">
                        <div class="panel">
                            <h2>&nbsp;</h2>
                            <div id="controllers">${controllersTemplate}</div>
                        </div>
                    </div>
                    <div class="settings">
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
                            <div id="global">${globalTemplate}</div>
                        </div>
                    </div>
                </div>
                <div class="panel keyboard">
                </div>
            </div>
        `);
    }
}
