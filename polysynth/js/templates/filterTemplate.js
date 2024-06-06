import '../components/RotaryKnob.js';
import '../components/CycleSwitch.js';

const filterTemplate = `
<div class="control-group">
    <div class="vertical-group">
    <cycle-switch module-id="filter" parameter-name="type" title="Pass">
        <option value="lowpass" selected>LOW</option>
        <option value="bandpass">BAND</option>
        <option value="highpass">HIGH</option>
    </cycle-switch>
    <cycle-switch module-id="filter" parameter-name="rolloff" numeric title="Rolloff/oct">
        <option value="12" selected>12dB</option>
        <option value="24">24dB</option>    
    </cycle-switch>
    <rotary-knob module-id="filter" parameter-name="frequency" value="500" logarithmic min-value="4.5" max-value="5000">Cut-off</rotary-knob>
    </div>
    <div class="vertical-group">
    <rotary-knob module-id="filter" parameter-name="resonance" max-value="20">Resonance</rotary-knob>
    <rotary-knob module-id="filter" parameter-name="envelopeAmount" value="5000" max-value="10000">Envelope</rotary-knob>
    </div>
    <div class="vertical-group">
    <rotary-knob module-id="filter" parameter-name="modAmount" max-value="10000">Modulation</rotary-knob>
    <rotary-knob module-id="filter" parameter-name="keyboardFollowAmount" max-value="10000">Follow Keys</rotary-knob>
    </div>
</div>
`;
export default filterTemplate;
