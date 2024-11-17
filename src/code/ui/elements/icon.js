import Emojis from "../../common/emojiHelpers.js"
import FontAwesome from "../../common/faHelpers.js"
import { BaseHTMLElement } from "../../common/BaseHTMLElement.js"

const CORS_PROXY = 'https://corsproxy.io/?'

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

        icon = (!icon && /^https?:\/\/\w+\.\w+/i.test(this.#favDomain))
            ? `${this.#favDomain}/favicon.ico` : icon
        if (icon) {
            this.#getIconImage(icon).then(src => {
                if (!src) return
                this.add('img', { className: 'icon', src: src }, (el) => {
                    el.onload = () => {
                        this.querySelector('i.icon')?.remove()
                        this.onchange?.() // TODO: ?
                    }
                    el.onerror = () => {
                        el.remove()
                        chrome.storage.local.set({ [icon]: '$' + new Date().toDateString() }) // Failed
                    }
                })
            })
        }
    }

    async #getIconImage(icon) {
        // Get from local
        const cached = (await chrome.storage.local.get(icon))?.[icon]
        const today = new Date().toDateString()
        if (cached == '$' + today) {
            return null // Already failed today
        } else if (!cached?.startsWith('$')) {
            return cached
        }

        // Try to fetch
        const response = await fetch(CORS_PROXY + icon)
        const image = await response?.blob()
        const data = (await image?.stream()?.getReader()?.read())?.value
        if (!data?.length) {
            chrome.storage.local.set({ [icon]: '$' + today }) // Failed
        }
        const base64 = btoa(String.fromCharCode.apply(null, data))
        chrome.storage.local.set({ [icon]: `data:image/png;base64,${base64}` })
        return `data:image/png;base64,${base64}`
    }
}
customElements.define('bs-icon', IconElement)