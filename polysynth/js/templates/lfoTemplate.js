import '../components/RotaryKnob.js';
import '../components/RotarySwitch.js';
import '../components/VerticalSlider.js';
const SVG = '../media/svg'

const lfoTemplate = `
<div class="control-group">
    <div class="vertical-group">
        <rotary-switch module-id="lfo" parameter-name="waveform" title="Waveform">
            <option value="sine"><img alt="sine" src="${SVG}/sine-wave.svg"/></option>
            <option value="triangle" selected><img alt="triangle" src="${SVG}/triangle.svg"/></option>
            <option value="sawtooth"><img alt="sawtooth" src="${SVG}/saw-tooth.svg"/></option>
            <option value="inverse-sawtooth"><img alt="reverse sawtooth" src="${SVG}/reverse-saw.svg"/></option>
            <option value="square"><img alt="square" src="${SVG}/square-wave.svg"/></option>
            <option value="sample-hold"><img alt="sample and hold" src="${SVG}/sample-and-hold.svg"/></option>
            <option value="noise"><img alt="noise" src="${SVG}/noise.svg"/></option>
        </rotary-switch>
        <rotary-knob module-id="lfo" parameter-name="frequency" value="6" logarithmic min-value="0.1" max-value="100">Rate</rotary-knob>
    </div>
    <div class="vertical-group">
        <rotary-knob module-id="lfo" parameter-name="modWheelAmount" value="0.1" max-value="1">Mod Wheel</rotary-knob>
        <rotary-knob module-id="lfo" parameter-name="delay" value="1" logarithmic max-value="10">Delay</rotary-knob>
    </div>
    <vertical-slider module-id="lfo" parameter-name="fixedAmount" value="0.1" max-value="1">Level</vertical-slider>
</div>
`;

export default lfoTemplate;
