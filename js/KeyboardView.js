
export default class KeyboardView {
    constructor(id) {
        this.id = id;
        this.element = document.getElementById(id)
        this.render();
        this.keys = this.element.querySelectorAll('.key');
        this.addKeyEventListeners();
    }

    render() {
        this.element.innerHTML = `
        <div class="keyboard">
            <div class="key" data-midi-note="60"></div>
            <div class="key black" data-midi-note="61"></div>
            <div class="key" data-midi-note="62"></div>
            <div class="key black" data-midi-note="63"></div>
            <div class="key" data-midi-note="64"></div>
            <div class="key" data-midi-note="65"></div>
            <div class="key black" data-midi-note="66"></div>
            <div class="key" data-midi-note="67"></div>
            <div class="key black" data-midi-note="68"></div>
            <div class="key" data-midi-note="69"></div>
            <div class="key black" data-midi-note="70"></div>
            <div class="key" data-midi-note="71"></div>
            <div class="key" data-midi-note="72"></div>
        </div>
        `;
    }

    addKeyEventListeners() {
        this.keys.forEach(key => {
            key.addEventListener('mousedown', this.onKeyDown);
            key.addEventListener('mouseup', this.onKeyDown);
            key.addEventListener('mouse', this.onKeyDown);
        })
    }

    onKeyDown = evt => {
        const key = evt.target;

    }
}
