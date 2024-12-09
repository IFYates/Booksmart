import State from "../../models/state.js";
import Tag from "../../models/Tag.js";
import BaseDialog from "./base.js";

export default class MessageDialog extends BaseDialog {
    #messages

    constructor(icon, title, messages) {
        super(icon, title)
        this.#messages = Array.isArray(messages) ? messages : [messages]
    }

    _display(dialog) {
        for (const message of this.#messages) {
            add('p').innerHTML = message
        }

        add('p', { className: 'spanCols3', style: 'text-align: center' }, () => {
            add('br')
            add('button', 'Close', { type: 'button' }).onclick = async () => {
                dialog.close()
            }
        })
    }
}