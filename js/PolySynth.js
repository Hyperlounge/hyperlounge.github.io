import ModularSynth from './modules/ModularSynth.js';

const initialPatch = '{"global":{"totalVoices":8,"legato":false},"softKeyboard":{},"voiceAllocator":{"numberOfVoices":8,"glideTime":0},"osc1":{"waveform":"sawtooth","range":0,"tune":0,"fineTune":5,"modAmount":100},"osc2":{"waveform":"sawtooth","range":0,"tune":0,"fineTune":-4,"modAmount":100},"oscLevel1":{"level":0.042},"oscLevel2":{"level":0.036},"amplifier":{},"loudnessEnvelope":{"attackSeconds":0,"decaySeconds":0,"sustainLevel":1,"releaseSeconds":0,"velocityAmount":0.0059},"filter":{"type":"lowpass","frequency":96.88450011898634,"resonance":1,"modAmount":1900,"keyboardFollowAmount":1,"envelopeAmount":295},"filterEnvelope":{"attackSeconds":0.03836341792159985,"decaySeconds":1.0794767556393339,"sustainLevel":0.05,"releaseSeconds":0,"velocityAmount":0.48},"lfo":{"waveform":"sine","frequency":2.9512092266663865,"fixedAmount":0,"modWheelAmount":0}}';

function verticalSlider(id, label, min, max, list) {
    const isValuesList = !!(!!list && !!list.length && typeof list[0] === 'object');
    return `
    <span class="control">
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

const labels0to10 = [10,9,8,7,6,5,4,3,2,1,0];
const labels0to10log = [10,5,2.5,1.2,600,300,150,70,30,10,0];

const waveforms = [
    {value: '3', label: 'SIN', param: 'sine'},
    {value: '2', label: 'TRI', param: 'triangle'},
    {value: '1', label: 'SAW', param: 'sawtooth'},
    {value: '0', label: 'SQU', param: 'square'},
];

const lfoWaveforms = [
    {value: '4', label: 'SIN', param: 'sine'},
    {value: '3', label: 'TRI', param: 'triangle'},
    {value: '2', label: 'SAW', param: 'sawtooth'},
    {value: '1', label: 'WAS', param: 'inverse-sawtooth'},
    {value: '0', label: 'SQU', param: 'square'},
];

const filterTypes = [
    {value: '2', label: 'HIGH', param: 'highpass'},
    {value: '1', label: 'BAND', param: 'bandpass'},
    {value: '0', label: 'LOW', param: 'lowpass'},
];

const oscTemplate = id => `
<div class="control-group">
    ${verticalSlider(`${id}-waveform`, 'Wave', 0, 3, waveforms)}
    ${verticalSlider(`${id}-range`, 'Range', -2, 2, [
        {value: 2, label: '2'},
        {value: 1, label: '4'},
        {value: 0, label: '8'},
        {value: -1, label: '16'},
        {value: -2, label: '32'},
    ])}
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
    ${verticalSlider(`${id}-level`, 'Level', 0, 100, labels0to10)}
</div>
`;

const lfoTemplate = `
<div class="control-group">
    ${verticalSlider(`lfo-waveform`, 'Wave', 0, 4, lfoWaveforms)}
    ${verticalSlider(`lfo-frequency`, 'Freq.', 0, 100, ['100','50','25','12','6','3','1.5','0.8','0.4','0.2','0.1'])}
    ${verticalSlider(`lfo-fixed-level`, 'Level', 0, 100, labels0to10)}
    ${verticalSlider(`lfo-mod-wheel-level`, 'Mod Wheel', 0, 100, labels0to10)}
</div>
`;

const filterTemplate = `
<div class="control-group">
    ${verticalSlider(`filter-type`, 'Pass', 0, 2, filterTypes)}
    ${verticalSlider(`filter-frequency`, 'Freq.', 0, 100, ['20k','10k','5k','2.5k','1.2k','600','300','150','75','36','18'])}
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
    }
    control.addEventListener(control.type === 'checkbox' ? 'change' : 'input', updateModule);
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

        document.getElementById('save-patch').addEventListener('click', evt => this.savePatchToFile());

        this._softKeyboard = this.createSoftKeyboardModule('softKeyboard');
        this._voiceAllocator = this.createVoiceAllocatorModule('voiceAllocator');
        this._osc1 = this.createPolyOscillatorModule('osc1');
        this._osc2 = this.createPolyOscillatorModule('osc2');
        this._oscLevel1 = this.createPolyLevelModule('oscLevel1');
        this._oscLevel2 = this.createPolyLevelModule('oscLevel2');
        this._amplifier = this.createPolyAmpModule('amplifier');
        this._loudnessEnvelope = this.createPolyEnvelopeModule('loudnessEnvelope');
        this._filter = this.createPolyFilterModule('filter');
        this._filterEnvelope = this.createPolyEnvelopeModule('filterEnvelope');
        this._lfo = this.createLFOModule('lfo');

        this._voiceAllocator.C4Offset.polyConnectTo(this._osc1.offsetCentsIn);
        this._voiceAllocator.C4Offset.polyConnectTo(this._osc2.offsetCentsIn);
        this._voiceAllocator.C4Offset.polyConnectTo(this._filter.keyboardFollowIn);
        this._osc1.audioOut.polyConnectTo(this._oscLevel1.audioIn);
        this._osc2.audioOut.polyConnectTo(this._oscLevel2.audioIn);
        this._oscLevel1.audioOut.polyConnectTo(this._amplifier.audioIn);
        this._oscLevel2.audioOut.polyConnectTo(this._amplifier.audioIn);
        this._amplifier.modulationIn.polyConnectFrom(this._loudnessEnvelope.envelopeOut);
        this._amplifier.audioOut.polyConnectTo(this._filter.audioIn);
        this._filter.envelopeIn.polyConnectFrom(this._filterEnvelope.envelopeOut);
        this._lfo.lfoOut.connect(this._osc1.modulationIn);
        this._lfo.lfoOut.connect(this._osc2.modulationIn);
        this._lfo.lfoOut.connect(this._filter.modulationIn);
        this._filter.audioOut.fanInConnectTo(this.audioContext.destination);


        this.loadPatch();
        window.addEventListener('unload', () => {
            this.savePatch();
        });

        bindControl('glide-time', this._voiceAllocator, 'glideTime', linearToLog(100, 10), logToLinear(10, 100));
        bindControl('voices', this._voiceAllocator, 'numberOfVoices');
        const bindOscillator = number => {
            const osc = this[`_osc${number}`];
            const level = this[`_oscLevel${number}`];
            bindControl(`oscillator-${number}-waveform`, osc, 'waveform', optionToParam(waveforms), paramToOption(waveforms));
            bindControl(`oscillator-${number}-range`, osc, 'range');
            bindControl(`oscillator-${number}-tune`, osc, 'tune');
            bindControl(`oscillator-${number}-fine-tune`, osc, 'fineTune');
            bindControl(`oscillator-${number}-level`, level, 'level', a => Number(a)/1000, a => String(a*1000));
        }
        bindOscillator(1);
        bindOscillator(2);

        const bindADSR = (id, module) => {
            bindControl(`${id}-attack`, module, 'attackSeconds', linearToLog(100, 10), logToLinear(10, 100));
            bindControl(`${id}-decay`, module, 'decaySeconds', linearToLog(100, 10), logToLinear(10, 100));
            bindControl(`${id}-sustain`, module, 'sustainLevel', a => Number(a)/100, a => String(a*100));
            bindControl(`${id}-release`, module, 'releaseSeconds', linearToLog(100, 10), logToLinear(10, 100));
            const factor = id === 'loudness-envelope' ? 10000 : 100;
            bindControl(`${id}-velocity`, module, 'velocityAmount', a => Number(a)/factor, a => String(a*factor));
        }
        bindADSR('loudness-envelope', this._loudnessEnvelope);
        bindADSR('filter-envelope', this._filterEnvelope);

        bindControl('filter-type', this._filter, 'type', optionToParam(filterTypes), paramToOption(filterTypes));
        bindControl('filter-frequency', this._filter, 'frequency', linearToLogRange(100, 18, 20000), logRangeToLinear(18, 20000, 100));
        bindControl('filter-resonance', this._filter, 'resonance', a => Number(a)/5, a => String(a*5));
        bindControl('filter-envelope-amount', this._filter, 'envelopeAmount', a => Number(a)*5, a => String(a/5));
        bindControl('filter-modulation', this._filter, 'modAmount', a => Number(a)*100, a => String(a/100));
        bindControl('filter-keyboard', this._filter, 'keyboardFollowAmount', a => Number(a)/100, a => String(a*100));

        bindControl(`lfo-waveform`, this._lfo, 'waveform', optionToParam(lfoWaveforms), paramToOption(lfoWaveforms));
        bindControl('lfo-frequency', this._lfo, 'frequency', linearToLogRange(100, 0.1, 100), logRangeToLinear(0.1, 100, 100));
        bindControl('lfo-fixed-level', this._lfo, 'fixedAmount', a => Number(a)/100, a => String(a*100));
        bindControl('lfo-mod-wheel-level', this._lfo, 'modWheelAmount', a => Number(a)/100, a => String(a*100));
    }

    savePatch() {
        localStorage.setItem('PolySynth-current-patch', JSON.stringify(this.patch))
    }

    loadPatch() {
        const patch = localStorage.getItem('PolySynth-current-patch') || initialPatch;
        patch && (this.patch = JSON.parse(patch));
    }

    savePatchToFile() {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.patch)));
        element.setAttribute('download', 'synth-patch.txt');

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    _render() {

        this._root && (this._root.innerHTML = `
            <div class="synth">
                <div class="header">
                    Synth <button id="save-patch">Save patch</button>
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
            </div>
        `);
    }
}
