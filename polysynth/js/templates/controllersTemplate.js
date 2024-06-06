import '../components/ModWheel.js';

const controllersTemplate = `
<div class="control-group">
    <mod-wheel id="pitch-bend" min-value="-64" max-value="64" snap-back>Bend</mod-wheel>
    <mod-wheel id="mod-wheel" max-value="127">Mod</mod-wheel>
</div>
`;

export default controllersTemplate;
