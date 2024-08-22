import '../components/RotaryKnob.js';
import '../components/RotarySwitch.js';
import '../components/ToggleSwitch.js';

const globalTemplate = `
<div class="control-group">
    <div class="vertical-group">
        <rotary-switch module-id="voiceAllocator" parameter-name="numberOfVoices" numeric title="Voices">
            <option value="0">LEG.</option>
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="8">8</option>
            <option value="16">16</option>
        </rotary-switch>
        <rotary-knob module-id="voiceAllocator" parameter-name="glideTime" logarithmic max-value="10">Glide</rotary-knob>
    </div>
    <div class="vertical-group">
        <rotary-switch module-id="noise" parameter-name="type" title="Noise" labels="right">
            <option value="white" selected>WHITE</option>
            <option value="pink">PINK</option>
            <option value="brown">BROWN</option>
        </rotary-switch>
        <toggle-switch module-id="global" parameter-name="envelopeStretch">Env. Stretch</toggle-switch>
        <toggle-switch id="reference-tone">C4 Tone</toggle-switch>
    </div>
</div>
`
export default globalTemplate;
