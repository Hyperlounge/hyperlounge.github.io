import Model from './Model.js';
import OscillatorView from './OscillatorView.js';
import EnvelopeView from './EnvelopeView.js';
import FilterView from './FilterView.js';
import LFOView from './LFOView.js';
import ControllersView from './ControllersView.js';

const defaultOscillatorState = {
    waveform: 'sine',
    range: 1,
    tune: 0,
    fineTune: 0,
    level: 50,
};
const defaultEnvelopeState = {
    attack: 0,
    decay: 0,
    sustain: 100,
    release: 0,
    velocity: 100,
};
const defaultFilterState = {
    type: 'lowpass',
    frequency: 100,
    emphasis: 0,
    contour: 100,
    keyboard: 100,
};
const defaultControllersState = {
    glide: 0,
    legato: true,
    bendRange: 2,
    lfoFrequency: 0,
    lfoAmplitude: 0,
};
const defaultLFOState = {
    waveform: 'triangle',
    frequency: 50,
    oscillator1Mod: 0,
    oscillator2Mod: 0,
    amplitudeMod: 0,
    filterMod: 0,
}

function getLogValue(value, maxValue, maxResult) {
    return maxResult * Math.pow(value, 2) / Math.pow(maxValue, 2);
}

export default class SynthView {
    constructor(id) {
        this.id = id;
        this.element = document.getElementById(id);

        this.state = new Model({
            currentNote: null,
            baseFrequency: 440,
            pitchBend: 0,
            modWheel: 0,
        });

        this.patch = new Model({
            oscillator1: new Model(defaultOscillatorState),
            oscillator2: new Model(defaultOscillatorState),
            loudnessEnvelope: new Model(defaultEnvelopeState),
            filter: new Model(defaultFilterState),
            filterEnvelope: new Model(defaultEnvelopeState),
            controllers: new Model(defaultControllersState),
            lfo: new Model(defaultLFOState),
        });
        const storedPatch = localStorage.getItem('synth-patch');
        if (storedPatch) {
            this.patch.set(JSON.parse(storedPatch));
        }
        window.addEventListener('beforeunload', () => {
            localStorage.setItem('synth-patch', JSON.stringify(this.patch.attributes));
        });

        this.render();
        new ControllersView('controllers', this.patch.get('controllers'));
        new OscillatorView('oscillator-1', this.patch.get('oscillator1'));
        new OscillatorView('oscillator-2', this.patch.get('oscillator2'));
        new EnvelopeView('loudness-envelope', this.patch.get('loudnessEnvelope'));
        new FilterView('filter', this.patch.get('filter'));
        new EnvelopeView('filter-envelope', this.patch.get('filterEnvelope'));
        new LFOView('lfo', this.patch.get('lfo'));

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
                entry.onmidimessage = evt => this.onMIDIMessage(evt);
            });
        }

        function onMIDIFailure(msg) {
            console.error(`Failed to get MIDI access - ${msg}`);
        }

        navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.filterNode = this.audioContext.createBiquadFilter();
        this.gainNode.connect(this.filterNode);
        this.filterNode.connect(this.audioContext.destination);
        this.gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0);
        this.filterNode.frequency.setTargetAtTime(10, this.audioContext.currentTime, 0);
        this.filterNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0);


        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        this.oscillators = [osc1, osc2];

        this.oscillators.forEach((osc, index) => {
            this.updateOscillator(index);
            this.patch.get('oscillator' + (index + 1)).addEventListener('change', evt => {
                this.updateOscillator(index);
            })
            osc.connect(this.gainNode);
            osc.start();
        });

        this.updateFilter();
        this.patch.get('filter').addEventListener('change', evt => {
            this.updateFilter();
        });
    }

    render () {
        this.element.innerHTML = `
<div class="synth">
    <div class="header">
        <p>Synth</p>
    </div>
    <div class="controls">
        <div class="panel">
            <h2>Controllers</h2>
            <div id="controllers"></div>
        </div>
        <div class="panel">
            <h2>Oscillator 1</h2>
            <div id="oscillator-1"></div>
        </div>
        <div class="panel">
            <h2>Oscillator 2</h2>
            <div id="oscillator-2"></div>
        </div>
        <div class="panel">
            <h2>Amp Envelope</h2>
            <div id="loudness-envelope"></div>
        </div>
        <div class="panel">
            <h2>Filter</h2>
            <div id="filter"></div>
        </div>
        <div class="panel">
            <h2>Filter Envelope</h2>
            <div id="filter-envelope"></div>
        </div>
        <div class="panel">
            <h2>LFO</h2>
            <div id="lfo"></div>
        </div>
    </div>
</div>
        `
    }

    onMIDIMessage(event) {
        const message = event.data;
        switch (message[0]) {
            case 159:
                this.onKeyDown(message[1], message[2]);
                break;
            case 143:
                this.onKeyUp(message[1], message[2]);
                break;
            case 239:
                this.onPitchBend(message[2]);
        }
        let str = ``;
        for (const character of event.data) {
            str += `${character.toString(10)} `;
        }
        console.log(event.data[0], str);
    }

    onKeyDown(note, velocity) {
        this.state.set({
            baseFrequency: 440 * Math.pow(2, (note - 69)/12),
            currentNote: note,
        });
        this.updateAllOscillators();
        this.startLoudnessEnvelope(velocity);
        this.startFilterEnvelope(velocity);
    }

    onKeyUp(note, velocity) {
        if (note === this.state.get('currentNote')) {
            this.finishLoudnessEnvelope();
            this.finishFilterEnvelope()
        }
    }

    startLoudnessEnvelope(velocity) {
        const now = this.audioContext.currentTime;
        const { attack, decay, sustain } = this.patch.get('loudnessEnvelope').attributes;
        const maxGain = velocity/127;
        const attackLog = getLogValue(attack, 100, 10);
        const decayLog = getLogValue(decay, 100, 10);
        if (this.gainNode.gain.value === 0) this.gainNode.gain.value = 0;
        this.gainNode.gain.cancelAndHoldAtTime(now)
            .linearRampToValueAtTime(maxGain, now + attackLog)
            .linearRampToValueAtTime(maxGain * sustain/100, now + attackLog + decayLog);
    }

    finishLoudnessEnvelope() {
        const now = this.audioContext.currentTime;
        const { release } = this.patch.get('loudnessEnvelope').attributes;
        const releaseLog = getLogValue(release, 100, 10);
        this.gainNode.gain.cancelAndHoldAtTime(now).linearRampToValueAtTime(0, now + releaseLog);
    }

    startFilterEnvelope(velocity) {
        const now = this.audioContext.currentTime;
        const { attack, decay, sustain } = this.patch.get('filterEnvelope').attributes;
        const { frequency } = this.patch.get('filter').attributes;
        const frequencyLog = 10 + getLogValue(frequency, 100, 10000);
        const attackLog = getLogValue(attack, 100, 10);
        const decayLog = getLogValue(decay, 100, 10);
        if (this.filterNode.frequency.value === 0) this.filterNode.frequency.value = 0;
        this.filterNode.frequency.cancelAndHoldAtTime(now)
            .exponentialRampToValueAtTime(frequencyLog, now + attackLog)
            .exponentialRampToValueAtTime(frequencyLog * sustain/100, now + attackLog + decayLog);
    }

    finishFilterEnvelope() {
        const now = this.audioContext.currentTime;
        const { release } = this.patch.get('filterEnvelope').attributes;
        const releaseLog = getLogValue(release, 100, 10);
        this.filterNode.frequency.cancelAndHoldAtTime(now).exponentialRampToValueAtTime(10, now + releaseLog);
    }

    onPitchBend(value) {
        this.state.set({pitchBend: (value - 64)/32});
        this.updateAllOscillators();
    }

    updateOscillator(index) {
        const osc = this.oscillators[index];
        const model = this.patch.get('oscillator' + (index + 1));
        const { baseFrequency, pitchBend } = this.state.attributes;
        const { waveform, range, tune, fineTune, level } = model.attributes;
        const multiplier = range * Math.pow(2, tune/12) * Math.pow(2, fineTune/12);
        osc.type = waveform;
        osc.frequency.setTargetAtTime(baseFrequency * Math.pow(2, pitchBend/12) * multiplier, this.audioContext.currentTime, 0.01)
    }

    updateAllOscillators() {
        this.updateOscillator(0);
        this.updateOscillator(1);
    }

    updateFilter() {
        const now = this.audioContext.currentTime;
        const filter = this.filterNode;
        const model = this.patch.get('filter');
        const { type, frequency, emphasis, contour, keyboard } = model.attributes;
        filter.type = type;
        filter.Q.setTargetAtTime(getLogValue(emphasis, 100, 20), now, 0.01);

    }
}
