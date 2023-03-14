import Model from './Model.js';
import OscillatorView from './OscillatorView.js';
import EnvelopeView from './EnvelopeView.js';
import SynthView from './SynthView.js';

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', startSynth);
})

function startSynth() {
    document.body.removeEventListener('click', startSynth);
    new SynthView('synth');
}
