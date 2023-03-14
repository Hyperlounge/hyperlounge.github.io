import MonoSynth from './MonoSynth.js';

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', startSynth);
})

function startSynth() {
    document.body.removeEventListener('click', startSynth);
    new MonoSynth('synth');
}
