import PolySynth from './PolySynth.js';

const launch = () => {
    document.body.innerHTML = `
<style>
    #synth {
        position: absolute; 
        top: 0;
        left: 0;
        width: 100%;
        text-align: center;
    }
</style>
<div id="synth">
</div>
    `;
    new PolySynth('synth');
};

document.getElementById('launch-button').onclick = evt => {
    launch();
}
