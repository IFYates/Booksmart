/*
Base logic for all dialogs
*/
export default class BaseDialog {
    #id
    #title
    #formClass

    constructor(title, formClass) {
        this.#id = new.target.name
        this.#title = title
        this.#formClass = formClass
    }

    get id() { return this.#id }
    get title() { return this.#title }
    get formClass() { return this.#formClass }

    async _display(self) {
        throw new Error('Must be implemented by a subclass');
    }

    async show(...args) {
        const self = this
        const dialog = document.body.add('dialog', function () {
            this.id = self.id
            add('title', self.title)
        })
        dialog.add('form', { className: this.formClass, onsubmit: () => false }, () => self._display(dialog, ...args))

        const promise = new Promise(resolve => {
            dialog.showModal()
            dialog.onclose = resolve
        })
        await promise
        dialog.remove()
    }
}