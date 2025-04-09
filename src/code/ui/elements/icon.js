import Boxicons from "../../common/bxHelpers.js"
import Emojis from "../../common/emojiHelpers.js"
import FontAwesome from "../../common/faHelpers.js"
import { BaseHTMLElement } from "../../common/BaseHTMLElement.js"
import State from "../../models/state.js"

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

    #show(icon) {
        if (Boxicons.isBoxicon(icon)) {
            this.querySelector('i.icon')?.remove()
            this.add('i', { className: `icon ${icon}` })
            return
        }
        if (Emojis.isEmoji(icon)) {
            this.querySelector('i.icon')?.remove()
            this.add('i', icon, { className: 'icon emoji fa-fw' })
            return
        }
        if (FontAwesome.isFacon(icon)) {
            this.querySelector('i.icon')?.remove()
            this.add('i', { className: `icon fa-fw ${icon}` })
            return
        }

        if (!icon && /^https?:\/\/\w+\.\w+/i.test(this.#favDomain)) {
            icon = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=128&url=${this.#favDomain}`
        }
        if (icon) {
            const img = this.querySelector('img.icon') || this.add('img', { className: 'icon', style: 'display: none' })
            State.resolveCachedImage(img, icon)
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