import '../components/RotaryKnob.js';
import '../components/ToggleSwitch.js';

const delayTemplate = `
<div class="effect-group">
    <div class="vertical-group">
        <toggle-switch module-id="delay" parameter-name="power" style="font-weight: bold">DELAY</toggle-switch>
    </div>
    <rotary-knob module-id="delay" parameter-name="mix" value="0.5">Mix</rotary-knob>
    <rotary-knob module-id="delay" parameter-name="time">Time</rotary-knob>
    <rotary-knob module-id="delay" parameter-name="feedback">Feedback</rotary-knob>
</div>
`;
export default delayTemplate;
