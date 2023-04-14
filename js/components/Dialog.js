import Modal from './Modal.js';

export default class Dialog extends Modal {
    constructor(contentHTML, options) {
        const dialogHTML = Dialog.dialogTemplate({
            contentHTML,
            title: options.title || '',
            optionLabels: options.optionLabels || ['OK'],
        });
        super(dialogHTML, options);
        return new Promise(resolve => {
            this.elem.querySelectorAll('.hl-dialog-options button').forEach(button => {
                button.addEventListener('click', evt => {
                    const btn = evt.target;
                    resolve({option: Number(btn.value), contentElement: this.elem.querySelector('.hl-dialog-content')});
                    this.remove();
                });
            });
        })
    }

    static dialogTemplate = data => {
        return `
        <style>
            .hl-dialog {
                background: white;
                padding: 0;
            }
            .hl-dialog-title {
                padding: 20px;
                font-size: larger;
                font-weight: bold;
            }
            .hl-dialog-content {
                padding: 20px;
            }
            .hl-dialog-options {
                padding: 20px;
                text-align: center;
            }
        </style>
        <div class="hl-dialog">
            <div class="hl-dialog-title">${data.title}</div>
            <div class="hl-dialog-content">${data.contentHTML}</div>
            <div class="hl-dialog-options">
            ${data.optionLabels.map((label, i) => `<button value="${i}">${label}</button>`).join(' ')}
            </div>
        </div>`;
    }
}
