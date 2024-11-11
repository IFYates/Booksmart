import { BaseHTMLElement, DragDropHandler } from "../../common/html.js"
import FontAwesome from "../../common/faHelpers.js"

const template = document.createElement('template')
template.innerHTML = `
<style type="text/css">
input {
    width: 100%;
}

list {
    display: block;
    overflow-y: scroll;
    height: 150px;
}

list .facon {
    padding: 2.5px 1px;
    border: 1px solid transparent;
    border-radius: 3px;
    user-select: none;
}

.facon.selected {
    border-color: var(--text-colour);
    background-color: rgba(255, 255, 255, 0.2);
}
</style>

<input type="text" placeholder="Filter" />
<list>
    <i role="button" tabIndex="0" class="facon fa-fw fa-2x"></i>
</list>
`

export class FaconSelectorElement extends BaseHTMLElement {
    #value
    get value() { return this.#value }

    constructor(currentIcon) {
        super(template, ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
        this.#value = currentIcon
    }

    update(value, scrollTo, force) {
        if (force || this.#value !== value) {
            for (const el of this.shadowRoot.querySelectorAll('.selected')) {
                el.classList.remove('selected')
            }

            if (value) {
                const el = this.shadowRoot.querySelector('.facon.' + value.replace(' ', '.'))
                if (el) {
                    el.classList.add('selected')
                }
            }

            this.#value = value
            this.dispatchEvent(new Event('change'))
        }

        if (scrollTo) {
            const el = this.shadowRoot.querySelector('.facon.selected')
            setTimeout(() => el?.scrollIntoView({ block: 'center' }), 100)
        }
    }

    _ondisplay(root) {
        const txtFilter = root.querySelector('input')
        txtFilter.onkeyup = function () {
            for (const el of root.querySelectorAll('.facon')) {
                el.style.display = (!this.value || el.title.includes(this.value)) ? '' : 'none'
            }
        }

        const faconTemplate = root.querySelector('.facon')
        for (const [icon, styles] of FontAwesome.icons) {
            for (const style of styles) {
                const value = `${style} ${icon}`
                const facon = faconTemplate.cloneNode(true)
                faconTemplate.parentElement.appendChild(facon)

                facon.classList.add(style, icon)
                facon.title = icon.substring(3).replace(/-/g, ' ')
                facon.onfocus = () => {
                    this.update(value)
                }
                facon.onmouseenter = (ev) => {
                    if (ev.buttons == 1) {
                        this.update(value)
                    }
                }
                facon.onmouseup = () => {
                    if (this.#value == value) {
                        this.update(value, true)
                        this.dispatchEvent(new Event('change'))
                    }
                }
            }
        }
        faconTemplate.remove()
        this.update(this.#value, true, true)
    }
}
customElements.define('facon-selector', FaconSelectorElement)