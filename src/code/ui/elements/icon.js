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
            this.#showIconImage(icon, {
                loaded: () => {
                    this.querySelector('i.icon')?.remove()
                    this.onchange?.() // TODO: ?
                },
                error: () => {
                    // Remove image
                    this.remove()
                }
            })
        }
    }

    async #showIconImage(icon, callbacks) {
        // Element
        const img = this.querySelector('img.icon') || this.add('img', { className: 'icon' })
        img.crossOrigin = 'anonymous'

        // First failure retries without CORS proxy
        img.onerror = () => {
            // Second failure removes CORS bypass (won't cache)
            img.onerror = () => {
                // Failed now
                img.onerror = () => {
                    img.onerror = null
                    chrome.storage.local.set({ [icon]: '$' + today }) // Don't retry today
                    callbacks?.error?.call(img)
                }

                img.crossOrigin = null
            }

            img.src = icon
        }

        // Get from local
        const cached = (await chrome.storage.local.get(icon))?.[icon]
        const today = new Date().toDateString()
        if (cached == '$' + today) { // Already failed today
            callbacks?.error?.call(img)
            return
        } else if (cached?.startsWith('$') === false) {
            img.src = cached
            callbacks?.loaded?.call(img)
            return
        }

        // Load image
        img.onload = async () => {
            img.onload = null

            // Cache data URL
            if (img.crossOrigin) {
                const imgBitmap = await createImageBitmap(img);
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')
                ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height)
                img.src = canvas.toDataURL()
                await chrome.storage.local.set({ [icon]: canvas.toDataURL() })
            }

            callbacks?.loaded?.call(img)
        }
        img.src = CORS_PROXY + icon
    }
}
customElements.define('bs-icon', IconElement)