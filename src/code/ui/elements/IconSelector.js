import { BaseHTMLElement } from "../../common/BaseHTMLElement.js"
import IconProvider from "../../common/icons/IconProvider.js"

const _custom = {
    nonIcon: true,
    id: 'custom',
    name: 'Custom icon',
    classes: 'bx bxs-image-alt bx-sm gray'
}
const _none = {
    nonIcon: true,
    id: 'none',
    name: 'No icon',
    classes: 'bx bxs-x-square bx-sm gray'
}
const _favicon = {
    nonIcon: true,
    id: 'favicon',
    name: 'Favicon',
    classes: 'far fa-bookmark fa-fw fa-2x'
}

const template = document.createElement('template')
template.innerHTML = `
<style type="text/css">
:host {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto 1fr auto;
}

input {
    width: 100%;
}

.icon {
    font-style: normal;
}
.icon.gray {
    opacity: 0.25;
}
.icon.preview {
    zoom: 2;
    width: 50px;
    height: 100%;
    align-content: space-evenly;
    text-align: center;
}
.icon.preview img {
    max-width: -webkit-fill-available;
}
.emoji {
    font-size: 2em;
}

list {
    overflow-y: scroll;
}
list .icon {
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
list .icon.selected {
    border-color: var(--text-colour);
    background-color: rgba(255, 255, 255, 0.2);
}
</style>

<input type="text" id="filter" placeholder="Filter" style="grid-column: span 2" />
<bs-icon class="icon preview" altIcon="far fa-bookmark"></bs-icon>
<list><bs-icon role="button" tabIndex="0" class="icon"></bs-icon></list>
<div></div><input type="text" id="custom" placeholder="Custom icon URL" />
`

export class IconSelectorElement extends BaseHTMLElement {
    #current
    get value() {
        switch (this.#current) {
            case _custom:
                return this.#customUrl
            case _none:
                return null
            default:
                return this.#current?.id
        }
    }
    #preview
    #customUrl = ''
    #customIcon
    #favDomain

    constructor(currentIcon, favDomain) {
        super(template, IconProvider.CSS)
        this.#favDomain = favDomain
        this.select(currentIcon)
        if (!this.#current) {
            this.#current = favDomain ? _favicon : _none
        }
    }

    get isIcon() {
        return !this.#current.nonIcon
    }

    select(idOrUrl) {
        var icon = IconProvider.findIcon(idOrUrl)
        if (!icon) {
            if (!isURL(idOrUrl)) {
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

            // Show/hide custom icon
            if (this.#customIcon && this.#customIcon.value != this.#customUrl) {
                this.#customIcon.value = this.#customUrl
            }

            if (icon) {
                // Select new
                const el = root.querySelector('.icon#' + icon.id)
                el.classList.add('selected')

                // Update preview
                this.#preview.value = icon == _custom ? this.#customUrl : icon
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

        self.#preview = root.querySelector('.preview')
        self.#preview.favDomain = self.#favDomain

        const txtFilter = root.querySelector('input#filter')
        txtFilter.onkeyup = function () {
            for (const el of root.querySelectorAll('list>.icon')) {
                const words = this.value.toLowerCase().split(' ')
                el.show(!this.value || words.every(w => el.title.includes(w)))
            }
        }

        const iconTemplate = root.querySelector('list>.icon')
        const list = iconTemplate.parentElement
        function addIcon(icon) {
            const el = iconTemplate.cloneNode(true)
            list.appendChild(el)
            
            if (icon.listClasses) {
                icon = { ...icon }
                icon.classes = icon.classes + ' ' + icon.listClasses
            }

            el.id = icon.id
            el.value = icon
            el.title = icon.name
            if (icon.style) {
                el.title += ` (${icon.style})`
            }
            if (self.#current?.id == icon.id) {
                self.#current = icon
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

            return el
        }

        // Favicon / None
        if (self.#favDomain) {
            const el = addIcon(_favicon)
            el.altIcon = _favicon.classes
            el.favDomain = self.#favDomain
        } else {
            addIcon(_none)
        }

        // Custom
        this.#customIcon = addIcon(_custom)
        this.#customIcon.altIcon = _custom
        this.#customIcon.value = this.#customUrl
        const fn = this.#customIcon.onfocus
        this.#customIcon.onfocus = () => {
            fn()
            txtCustom.focus()
        }
        const txtCustom = root.querySelector('input#custom')
        txtCustom.value = self.#customUrl
        txtCustom.onkeyup = function () {
            const txt = this.value.trim()
            if (!isURL(txt)) {
                self.#customUrl = null
                self.#customIcon.value = null
            } else {
                self.#customUrl = txt
                self.#refresh(_custom, true)
            }
        }

        for (const icon of IconProvider.icons()) {
            addIcon(icon)
        }
        iconTemplate.remove()

        self.#refresh(self.#current, true)

        txtFilter.placeholder = `Filter (${list.childNodes.length} icons)`
    }
}
customElements.define('icon-selector', IconSelectorElement)