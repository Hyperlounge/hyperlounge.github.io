import '../components/RotaryKnob.js';
import '../components/RotarySwitch.js';
import '../components/VerticalSlider.js';

const SVG = './media/svg';

const oscTemplate = number => `
<div class="control-group">
    <div class="vertical-group">
    <rotary-switch module-id="osc${number}" parameter-name="waveform" title="Waveform" labels="right">
        <option value="sine"><img alt="sine" src="${SVG}/sine-wave.svg"/></option>
        <option value="triangle" selected><img alt="triangle" src="${SVG}/triangle.svg"/></option>
        <option value="sawtooth"><img alt="sawtooth" src="${SVG}/saw-tooth.svg"/></option>
        <option value="square"><img alt="square" src="${SVG}/square-wave.svg"/></option>   
    </rotary-switch>
    <rotary-switch module-id="osc${number}" parameter-name="range" numeric title="Range" labels="right">
        <option value="2">2</option>
        <option value="1">4</option>
        <option value="0" selected>8</option>
        <option value="-1">16</option>
        <option value="-2">32</option>
    </rotary-switch>
    </div>
    <div class="vertical-group">
    <rotary-switch module-id="osc${number}" parameter-name="tune" numeric title="Semitones">
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
    <rotary-knob module-id="osc${number}" parameter-name="fineTune" min-value="-50" max-value="50" scale-min="-0.5" scale-max="0.5" scale-step="0.1" minimal>Fine Tune</rotary-knob>
    </div>
    <div class="vertical-group">
    <rotary-knob module-id="osc${number}" parameter-name="modAmount" min-value="-100" max-value="100" scale-min="-5" scale-max="5" scale-step="1" minimal>Modulation</rotary-knob>
    ${number === 2 ? `<rotary-knob module-id="osc${number}" parameter-name="crossModAmount" min-value="0" max-value="2500" scale-min="0" scale-max="10" scale-step="1">Cross-Mod</rotary-knob>` : `<rotary-knob module-id="noiseLevel1" parameter-name="level" min-value="0" max-value="0.1" scale-min="0" scale-max="10" scale-step="1">Noise</rotary-knob>`}
    </div>
    <vertical-slider module-id="oscLevel${number}" parameter-name="level" value="0.05" max-value="0.1" scale-min="0" scale-max="10" scale-step="1">Level</vertical-slider>
</div>
`;

export default oscTemplate;
