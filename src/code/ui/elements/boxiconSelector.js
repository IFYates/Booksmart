import { BaseHTMLElement } from "../../common/BaseHTMLElement.js"
import Boxicons from "../../common/bxHelpers.js"

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

list .boxicon {
    padding: 2.5px 1px;
    border: 1px solid transparent;
    border-radius: 3px;
    user-select: none;
}

.boxicon.selected {
    border-color: var(--text-colour);
    background-color: rgba(255, 255, 255, 0.2);
}
</style>

<input type="text" placeholder="Filter" />
<list>
    <i role="button" tabIndex="0" class="boxicon bx-md"></i>
</list>
`

export class BoxiconSelectorElement extends BaseHTMLElement {
    #value
    get value() { return this.#value }

    constructor(currentIcon) {
        super(template, [Boxicons.CSS])
        this.#value = Boxicons.isBoxicon(currentIcon) ? currentIcon : null
    }

    update(value, scrollTo, force) {
        if (force || this.#value !== value) {
            for (const el of this.shadowRoot.querySelectorAll('.selected')) {
                el.classList.remove('selected')
            }

            if (value) {
                const el = this.shadowRoot.querySelector('.boxicon.' + value.replace(' ', '.'))
                if (el) {
                    el.classList.add('selected')
                }
            }

            this.#value = value
            this.dispatchEvent(new Event('change'))
        }

        if (scrollTo) {
            const el = this.shadowRoot.querySelector('.boxicon.selected')
            setTimeout(() => el?.scrollIntoView({ block: 'center' }), 100)
        }
    }

    _ondisplay(root) {
        const txtFilter = root.querySelector('input')
        txtFilter.onkeyup = function () {
            for (const el of root.querySelectorAll('.boxicon')) {
                el.style.display = (!this.value || el.title.includes(this.value.toLowerCase())) ? '' : 'none'
            }
        }

        const boxiconTemplate = root.querySelector('.boxicon')
        const list = boxiconTemplate.parentElement
        for (const [icon, styles] of Boxicons.icons) {
            for (const style of styles) {
                const value = `bx ${style}-${icon}`
                const boxicon = boxiconTemplate.cloneNode(true)
                list.appendChild(boxicon)

                boxicon.classList.add('bx', `${style}-${icon}`)
                boxicon.title = icon.replace(/-/g, ' ') + ` (${style})`
                boxicon.onfocus = () => {
                    this.update(value)
                }
                boxicon.onmouseenter = (ev) => {
                    if (ev.buttons == 1) {
                        this.update(value)
                    }
                }
                boxicon.onmouseup = () => {
                    if (this.#value == value) {
                        this.update(value, true)
                        this.dispatchEvent(new Event('change'))
                    }
                }
            }
        }
        boxiconTemplate.remove()
        this.update(this.#value, true, true)

        txtFilter.placeholder = `Filter (${list.childNodes.length} icons)`
    }
}
customElements.define('boxicon-selector', BoxiconSelectorElement)