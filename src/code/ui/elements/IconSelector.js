import { BaseHTMLElement } from "../../common/BaseHTMLElement.js"
import IconProvider from "../../common/icons/IconProvider.js"

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
    classes: 'far fa-bookmark',
    listClasses: 'fa-fw fa-2x'
}

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


list {
    display: block;
    overflow-y: scroll;
    height: 150px;
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

<input type="text" id="custom" placeholder="Custom icon URL" />
<input type="text" id="filter" placeholder="Filter" />
<div>
    <bs-icon class="icon preview" altIcon="far fa-bookmark"></bs-icon>
    <list><bs-icon role="button" tabIndex="0" class="icon"></bs-icon></list>
</div>
`

export class IconSelectorElement extends BaseHTMLElement {
    #current
    get value() { return this.#current?.id }
    #preview
    #customUrl = ''
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

            // Show/hide custom icon
            const custom = root.querySelector('.icon#custom')
            if (custom?.show(!!this.#customUrl) && custom.value != this.#customUrl) {
                custom.value = this.#customUrl
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

        const txtCustom = root.querySelector('input#custom')
        txtCustom.value = self.#customUrl
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

        const iconTemplate = root.querySelector('list .icon')
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

        if (self.#favDomain) {
            const el = addIcon(self.#favDomain ? _favicon : _none)
            el.altIcon = _favicon.classes
            el.favDomain = self.#favDomain
        } else {
            addIcon(_none)
        }
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