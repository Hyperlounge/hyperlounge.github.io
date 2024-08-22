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
                background-color: #cccccc;
                padding: 0;
                overflow: hidden;
                border-radius: 1em;
                font-size: 120%;
            }
            .hl-dialog-title {
                padding: 20px;
                font-size: 150%;
                font-weight: bold;
                background: white;
            }
            .hl-dialog-content {
                padding: 20px;
            }
            .hl-dialog-options {
                padding: 20px;
                text-align: center;
            }
            .hl-dialog-options button {
                border: 1px solid black;
                border-radius: 0.5em;
                padding: 0.5em 2em;
                margin: 0 0.5em;
                color: black;
            }
            .hl-dialog-content select {
                border: 1px solid black;
                border-radius: 0.5em;
                color: black;
            }

            .hl-dialog-content label {
                display: inline-block;
                width: 100px;
                margin-right: 0.5em;
                text-align: right;
            }
            .hl-dialog-content p.centered {
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
