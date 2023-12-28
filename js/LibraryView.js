export default class LibraryView extends EventTarget {
    constructor(rootId, library, currentPresetId) {
        super();

        this.rootElement = document.getElementById(rootId);
        this.library = library;
        this.selectedBank = this.library.getBanks()[0];
        this.currentPresetId = currentPresetId;

        this.render();
        this.rootElement.addEventListener('click', evt => this.onClick(evt));
    }

    render() {
        this.rootElement.innerHTML = `
        <div class="library">
            <div class="banks">
                ${this.library.getBanks().map(bank => `<div class="bank ${this.selectedBank === bank ? 'selected' : ''}" data-bank="${bank}">${bank}</div>`).join('')}
            </div>
            <div class="presets">
                ${this.library.getPresetsByBank(this.selectedBank).map(preset => `<div class="preset ${preset.id === this.currentPresetId ? 'selected' : ''}" data-id="${preset.id}">${preset.name}</div>`).join('')}
            </div>
        </div>
        `;
    }

    onClick(evt) {
        const { target } = evt;
        if (target.classList.contains('bank')) {
            this.selectedBank = target.getAttribute('data-bank');
            this.render();
        } else if (target.classList.contains('preset')) {
            this.currentPresetId = Number(target.getAttribute('data-id'));
            this.render();
            this.dispatchEvent(new CustomEvent('preset-selected', {detail: this.currentPresetId}));
        }
    }

}
