import MonoSynth from './MonoSynth.js';
import PolySynth from './PolySynth.js';

document.addEventListener('DOMContentLoaded', () => {
    document.body.innerHTML = `
<style>
    button.selector {
        padding: 30px;
        font-size: 72px;
        margin: 20px;
    }
    #synth {
        position: absolute; 
        top: 50%;
        left: 50%;
        width: 100%; 
        transform: translate(-50%, -50%);
        text-align: center;
    }
</style>
<div id="synth">
    <button class="selector" id="mono">Mono Synth</button> <button class="selector" id="poly">Poly Synth</button>
</div>
    `
    document.body.addEventListener('click', startSynth);
})

function startSynth(evt) {
    if (evt.target instanceof HTMLButtonElement) {
        document.body.removeEventListener('click', startSynth);
        if (evt.target.id === 'mono') {
            new MonoSynth('synth');
        } else {
            new PolySynth('synth');
        }

    }
}
