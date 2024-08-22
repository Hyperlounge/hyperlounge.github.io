
function toDimension(value, defaultValue) {
    if (!value) {
        value = defaultValue;
    }
    if (typeof value === 'string') {
        return value;
    } else {
        return `${value}px`;
    }
}

export default class Modal {
    constructor(contentHTML, options) {
        const width = toDimension(options.width, '60%');
        const maxWidth = toDimension(options.maxWidth, '700px');
        this.id = ++Modal.serialNumber;
        const temp = document.createElement('div');
        temp.innerHTML = Modal.modalTemplate({
            id: this.id,
            width,
            maxWidth,
            contentHTML,
        });
        this._elem = temp.firstChild;
        const root = options.root || document.body;
        root.append(this._elem);
    }

    remove() {
        this._elem.remove();
    }

    get mask() {
        return this._elem.querySelector('.modal-mask');
    }

    get elem() {
        return this._elem;
    }

    static serialNumber = 0;

    static modalTemplate = data => {
        const styles = {
            modal:
                `
                position: fixed;
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                background-color: rgba(0,0,0,0.3);
                pointer-events: none;
                `,
            modalMask:
                `
                width: 100%; 
                height: 100%;
                pointer-events: all;
                `,
            modalContent:
                `
                position: absolute; 
                top: 50%; 
                left: 50%; 
                width: ${data.width}; 
                max-width: ${data.maxWidth}; 
                transform: translate(-50%, -50%);
                pointer-events: all;
                `,
        };
        return `<div class="modal" style="${styles.modal}" id="modal-${data.id}">
            <div class="modal-mask" style="${styles.modalMask}"></div>
            <div class="modal-content" style="${styles.modalContent}">${data.contentHTML}</div>
        </div>`;
    }
}
