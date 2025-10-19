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
        <rotary-knob module-id="voiceAllocator" parameter-name="glideTime" logarithmic max-value="10">Glide Time</rotary-knob>
    </div>
    <div class="vertical-group">
        <rotary-switch module-id="noise" parameter-name="type" title="Noise" labels="right">
            <option value="white" selected>WHITE</option>
            <option value="pink">PINK</option>
            <option value="brown">BROWN</option>
        </rotary-switch>
        <cycle-switch module-id="voiceAllocator" parameter-name="glideType" title="Glide Type">
            <option value="off" selected>OFF</option>
            <option value="always">ALL</option>
            <option value="legato">LEGATO</option>
        </cycle-switch>
        <toggle-switch module-id="global" parameter-name="envelopeStretch">Env. Stretch</toggle-switch>
    </div>
</div>
`
export default globalTemplate;
