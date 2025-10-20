import '../components/RotaryKnob.js';
import '../components/ToggleSwitch.js';

const phaserTemplate = `
<div class="effect-group">
    <div class="vertical-group">
        <toggle-switch module-id="phaser" parameter-name="power" style="font-weight: bold">PHASER</toggle-switch>
    </div>
    <rotary-knob module-id="phaser" parameter-name="mix" value="0.5">Mix</rotary-knob>
    <rotary-knob module-id="phaser" parameter-name="rate" min-value="0.02" max-value="10" logarithmic>Rate</rotary-knob>
    <rotary-knob module-id="phaser" parameter-name="depth">Depth</rotary-knob>
    <rotary-knob module-id="phaser" parameter-name="resonance">Resonance</rotary-knob>
    <rotary-knob module-id="phaser" parameter-name="delay">Delay</rotary-knob>
</div>
`;
export default phaserTemplate;
