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
    <rotary-knob module-id="delay" parameter-name="spread" minimal min-value="-1" max-value="1" value="0" scale-min="-5" scale-max="5" scale-min-label="L" scale-max-label="R">Spread</rotary-knob>
</div>
`;
export default delayTemplate;
