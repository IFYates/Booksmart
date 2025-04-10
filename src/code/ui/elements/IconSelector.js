import { BaseHTMLElement } from "../../common/BaseHTMLElement.js"
import IconProvider from "../../common/icons/IconProvider.js"

const template = document.createElement('template')
template.innerHTML = `
<style type="text/css">
div {
    display: grid;
    grid-template-columns: auto 1fr;
}

input {
    width: 100%;
}

i.preview {
    zoom: 2;
    width: 50px;
    height: 100%;
    align-content: space-evenly;
    text-align: center;
}

list {
    display: block;
    overflow-y: scroll;
    height: 150px;
}

i.icon, i.preview {
    font-style: normal;
}
i.icon.gray {
    opacity: 0.25;
}
i.emoji {
    font-size: 2em;
}
list i.icon {
    padding: 2.5px 1px;
    border: 1px solid transparent;
    border-radius: 3px;
    user-select: none;
    height: 32px;
    width: 32px;
    align-content: space-evenly;
    text-align: center;
    display: inline-block;
}
i.icon.selected {
    border-color: var(--text-colour);
    background-color: rgba(255, 255, 255, 0.2);
}
</style>

<input type="text" id="custom" placeholder="Custom icon URL" />
<input type="text" id="filter" placeholder="Filter" />
<div>
    <i class="preview"></i>
    <list><i role="button" tabIndex="0" class="icon"></i></list>
</div>
`

const _custom = {
    nonIcon: true,
    id: 'custom',
    name: 'Custom icon',
    classes: 'custom'
}
const _none = {
    nonIcon: true,
    id: 'none',
    name: 'No icon',
    classes: 'bx bx-sm bx-square-rounded gray'
}
const _favicon = {
    nonIcon: true,
    id: 'favicon',
    name: 'Favicon',
    classes: 'far fa-fw fa-2x fa-bookmark'
}

export class IconSelectorElement extends BaseHTMLElement {
    #current
    get value() { return this.#current?.id }
    #preview
    #customUrl
    #faviconUrl

    constructor(currentIcon, faviconUrl) {
        super(template, IconProvider.CSS)
        this.#faviconUrl = faviconUrl
        this.select(currentIcon)
        if (!this.#current) {
            this.#current = faviconUrl ? _favicon : _none
        }
    }

    get isIcon() {
        return !this.#current.nonIcon
    }

    select(idOrUrl) {
        var icon = IconProvider.findIcon(idOrUrl)
        if (!icon) {
            if (!/^https?:\/\//.test(idOrUrl)) {
                return
            }
            icon = _custom
            this.#customUrl = idOrUrl
        }
        if (this.#preview) {
            this.#refresh(icon, true)
        } else {
            this.#current = icon
        }
    }

    #refresh(icon, scrollTo) {
        if (scrollTo || this.#current?.id !== icon?.id) {
            const root = this.shadowRoot

            // Clear current
            for (const el of root.querySelectorAll('.selected')) {
                el.classList.remove('selected')
            }
            if (this.#current?.classes) {
                this.#preview.classList.remove(...this.#current.classes.split(' '))
            }
            this.#preview.innerHTML = ''

            // Show/hide custom icon
            var custom = root.querySelector('.icon.custom')
            if (custom?.show(!!this.#customUrl)) {
                custom.innerHTML = `<img src="${this.#customUrl}"/>`
            }

            if (icon) {
                // Select new
                if (icon.classes) {
                    root.querySelector('.icon.' + icon.classes.replaceAll(' ', '.'))
                        ?.classList.add('selected')
                    this.#preview.classList.add(...icon.classes.split(' '))
                } else {
                    root.querySelector('.icon.' + _favicon.classes.replaceAll(' ', '.'))
                        ?.classList.add('selected')
                }
                if (icon.content) {
                    this.#preview.innerHTML = icon.content
                } else if (icon == _custom) {
                    this.#preview.innerHTML = `<img src="${this.#customUrl}"/>`
                }
            }

            this.#current = icon
            this.dispatchEvent(new Event('change'))
        }

        if (scrollTo) {
            const el = this.shadowRoot.querySelector('.icon.selected')
            setTimeout(() => el?.scrollIntoView({ block: 'center' }), 100)
        }
    }

    _ondisplay(root) {
        const self = this
        self.#preview = root.querySelector('i.preview')
        
        const txtCustom = root.querySelector('input#custom')
        txtCustom.onkeyup = function () {
            if (!/^https?:\/\/./.test(this.value)) {
                self.#customUrl = null
            } else {
                self.#customUrl = this.value
                self.#refresh(_custom, true)
            }
        }

        const txtFilter = root.querySelector('input#filter')
        txtFilter.onkeyup = function () {
            for (const el of root.querySelectorAll('.icon')) {
                const words = this.value.toLowerCase().split(' ')
                el.style.display = (!this.value || words.every(w => el.title.includes(w))) ? '' : 'none'
            }
        }

        const iconTemplate = root.querySelector('i.icon')
        const list = iconTemplate.parentElement
        function addIcon(icon) {
            const el = iconTemplate.cloneNode(true)
            list.appendChild(el)

            el.title = icon.name
            if (icon.style) {
                el.title += ` (${icon.style})`
            }
            if (icon.classes) {
                el.classList.add(...icon.classes.split(' '))
            }
            if (icon.content) {
                el.innerHTML = icon.content
            }

            el.onfocus = () => {
                self.#refresh(icon)
            }
            el.onmouseenter = (ev) => {
                if (ev.buttons == 1) {
                    self.#refresh(icon)
                }
            }
            el.onmouseup = () => {
                if (self.#current?.id == icon.id) {
                    self.#refresh(icon, true)
                }
            }
        }

        addIcon(this.#faviconUrl ? _favicon : _none)
        addIcon(_custom)

        for (const icon of IconProvider.icons()) {
            addIcon(icon)
        }

        iconTemplate.remove()
        self.#refresh(self.#current, true)

        txtFilter.placeholder = `Filter (${list.childNodes.length} icons)`
    }
}
customElements.define('icon-selector', IconSelectorElement)