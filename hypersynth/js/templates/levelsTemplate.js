import '../components/RotaryKnob.js';
import '../components/ToggleSwitch.js';

const levelsTemplate = `
<div class="effect-group">
    <div class="vertical-group">
        <toggle-switch module-id="levels" parameter-name="power" style="font-weight: bold">LEVELS</toggle-switch>
    </div>
    <rotary-knob module-id="levels" parameter-name="bass" value="0" min-value="-1" scale-min="-5" scale-max="5" minimal>Bass</rotary-knob>
    <rotary-knob module-id="levels" parameter-name="treble" value="0" min-value="-1" scale-min="-5" scale-max="5" minimal>Treble</rotary-knob>
    <rotary-knob module-id="levels" parameter-name="master" value="0.5">Master Volume</rotary-knob>
</div>
`;
export default levelsTemplate;
