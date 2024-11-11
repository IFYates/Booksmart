import Emojis from "../../common/emojiHelpers.js"
import FontAwesome from "../../common/faHelpers.js"
import { BaseHTMLElement } from "../../common/html.js"

// supports altIcon and favicon for domain
export default class IconElement extends BaseHTMLElement {
    #icon
    get value() { return this.#icon }
    set value(string) {
        this.#icon = string
        this.refresh()
    }

    #altIcon
    get altIcon() { return this.#altIcon }
    set altIcon(value) {
        this.#altIcon = value
        this.refresh()
    }

    #favDomain
    get favDomain() { return this.#favDomain }
    set favDomain(value) {
        this.#favDomain = value
        this.refresh()
    }

    constructor() {
        super()
        this.#altIcon = this.attributes.altIcon?.value
    }

    _ondisplay() {
        this.#show(this.#altIcon)
        this.#show(this.#icon)
    }

    #show(icon) {
        if (Emojis.isEmoji(icon)) {
            this.querySelector('i.icon')?.remove()
            this.add('i', icon, { className: 'icon emoji fa-fw' })
        }
        else if (FontAwesome.isFacon(icon)) {
            this.querySelector('i.icon')?.remove()
            this.add('i', { className: `icon fa-fw ${icon}` })
        }
        else {
            icon = (!icon && this.#favDomain) ? `${this.#favDomain}/favicon.ico` : null
            if (icon) {
                this.add('img', { className: 'icon', src: icon, style: 'display:none' })
                    .onload = (ev) => {
                        ev.target.style.display = ''
                        this.querySelector('i.icon')?.remove()
                    }
            }
        }
    }
}
customElements.define('bs-icon', IconElement)