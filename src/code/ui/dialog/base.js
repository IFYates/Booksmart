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
    _ondisplay(dialog) {
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
        dialog.add('form', { className: this.formClass, onsubmit: () => false }, () => self._ondisplay(dialog, ...args))

        const promise = new Promise(resolve => {
            dialog.showModal()
            dialog.classList.add('open')
            dialog.onclose = resolve
        })
        await promise
        dialog.remove()
        return dialog.returnValue
    }

    static setTheme(accentColour) {
        const element = document.getElementsByTagName('dialog')[0]
        MainView.setTheme(accentColour, element)
    }

    _addCheckbox(labelText, value, setter) {
        const label = add('label', labelText)
        const checkbox = add('i', { className: 'fa-fw fas fa-toggle-off', role: 'button', tabIndex: 0 }, function () {
            function toggle() {
                value = !value
                this.classList.toggle('fa-toggle-off', !value)
                this.classList.toggle('fa-toggle-on', !!value)
                setter(!!value, this, label)
            }

            this.classList.toggle('fa-toggle-off', !value)
            this.classList.toggle('fa-toggle-on', !!value)

            this.addEventListener('click', toggle)
            this.addEventListener('keydown', (ev) => {
                if (ev.key == 'Enter' || ev.key == ' ') {
                    toggle.call(this)
                }
            })
        })
        label.addEventListener('click', () => checkbox.click())
    }
}