/*
Base logic for all dialogs
*/
export default class BaseDialog {
    #icon
    #id
    #title
    #formClass

    constructor(icon, title, formClass) {
        this.#id = new.target.name
        this.#icon = icon instanceof Array ? icon : icon.split(' ')
        this.#title = ' ' + title
        this.#formClass = formClass
    }

    get id() { return this.#id }
    get title() { return this.#title }
    get formClass() { return this.#formClass }

    async _prepare() { }
    _display(dialog) {
        throw new Error('Must be implemented by a subclass');
    }

    async show(...args) {        
        await this._prepare(...args)
        
        const self = this
        const dialog = document.body.add('dialog', function () {
            this.id = self.id
            add('title', () => {
                add('i', { classes: ['fa-fw', ...self.#icon] })
                add('span', self.title)
            })
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