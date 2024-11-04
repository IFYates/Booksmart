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
            dialog.classList.add('open')
            dialog.onclose = resolve
        })
        await promise
        dialog.remove()
    }

    static setTheme(accentColour) {
        //const element = this.shadowRoot.host
        const element = document.getElementsByTagName('dialog')[0]
        if (accentColour) {
            element.style.setProperty('--accent-colour', accentColour)
            element.style.setProperty('--accent-colour-r', accentColour.substring(1, 3).fromHex())
            element.style.setProperty('--accent-colour-g', accentColour.substring(3, 5).fromHex())
            element.style.setProperty('--accent-colour-b', accentColour.substring(5, 7).fromHex())
            // element.style.setProperty('--accent-colour-hue', this.#folder.themeAccent[0])
            // element.style.setProperty('--accent-colour-saturation', `${this.#folder.themeAccent[1]}%`)
            // element.style.setProperty('--accent-colour-lightness', '24%')
            // element.style.setProperty('--text-colour', '#eee') // TODO

            element.style.setProperty('--theme-colour-darkest', 'rgb(calc(var(--accent-colour-r) * 0.585), calc(var(--accent-colour-g) * 0.585), calc(var(--accent-colour-b) * 0.585))')
            element.style.setProperty('--theme-colour-lighter', 'rgb(calc(var(--accent-colour-r) * 1.5), calc(var(--accent-colour-g) * 1.5), calc(var(--accent-colour-b) * 1.5))')
        }
        else {
            element.style.setProperty('--accent-colour', null)
            element.style.setProperty('--accent-colour-r', null)
            element.style.setProperty('--accent-colour-g', null)
            element.style.setProperty('--accent-colour-b', null)
        }
    }
}