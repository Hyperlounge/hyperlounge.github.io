import '../components/RotaryKnob.js';
import '../components/ToggleSwitch.js';
import '../components/RotarySwitch.js';

const reverbTemplate = `
<div class="effect-group">
    <div class="vertical-group">
        <toggle-switch module-id="reverb" parameter-name="power" style="font-weight: bold">REVERB</toggle-switch>
    </div>
    <rotary-knob module-id="reverb" parameter-name="mix" value="0.5">Mix</rotary-knob>
    <rotary-switch module-id="reverb" parameter-name="type" title="Room Size" labels="right">
        <option value="small" selected>SMALL</option>
        <option value="medium">MEDIUM</option>
        <option value="large">LARGE</option>
        <option value="huge">HUGE</option>
    </rotary-switch>
</div>
`;
export default reverbTemplate;
