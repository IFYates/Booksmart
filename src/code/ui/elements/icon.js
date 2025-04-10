import { BaseHTMLElement } from "../../common/BaseHTMLElement.js"
import State from "../../models/state.js"
import IconProvider from "../../common/icons/IconProvider.js"

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
        if (this.#altIcon) {
            this.#show(this.#altIcon)
        }
        this.#show(this.#icon)
    }

    #show(iconOrUrl) {
        const icon = IconProvider.findIcon(iconOrUrl)
        if (icon?.id == 'favicon') {
            iconOrUrl = 'favicon'
        } else if (icon) {
            this.querySelector('i.icon')?.remove()
            this.add('i', icon.content, { className: `icon ${icon.classes}` })
            return
        }

        if (iconOrUrl == 'favicon') {
            const m = /^https?:\/\/(\w+\.[^/\?]+)/i.exec(this.#favDomain || '')
            if (!m) {
                return
            }
            iconOrUrl = `https://favicone.com/${m[1]}?s=64`
        }
        if (iconOrUrl) {
            const img = this.querySelector('img.icon') || this.add('img', { className: 'icon', style: 'display: none' })
            State.resolveCachedImage(img, iconOrUrl)
                .then(r => {
                    this.querySelector('i.icon')?.remove()
                    img.show()
                    this.onchange?.() // TODO: ?
                })
                .catch(e => {
                    // Remove image
                    img.remove()
                })
        }
    }
}
customElements.define('bs-icon', IconElement)