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
        const self = this
        if (!iconOrUrl) {
            return
        }

        if (isURL(iconOrUrl)) {
            return self.#showImage(iconOrUrl)
        }

        var content = ''
        if (iconOrUrl && iconOrUrl != 'favicon') {
            const icon = IconProvider.findIcon(iconOrUrl)
            if (icon) {
                iconOrUrl = icon?.id == 'favicon' ? 'favicon' : icon.classes
                content = icon.content
            }
        }

        if (iconOrUrl == 'favicon') {
            // Get valid favicon from provider
            const domain = isURL(self.#favDomain)
            if (!domain) {
                return
            }

            function retryWithoutSubdomain(url) {
                const p = url.split('.')
                if (p.length > 2) {
                    url = p.slice(1).join('.')
                    self.#showImage(`https://favicone.com/${url}?s=128`, () => retryWithoutSubdomain(url))
                }
            }
            return self.#showImage(`https://favicone.com/${domain}?s=128`, () => retryWithoutSubdomain(domain))
        }

        // Assume classes
        self.querySelector('i.icon')?.remove()
        self.add('i', content, { className: `icon ${iconOrUrl}` })
    }

    #promise = null
    #showImage(iconOrUrl, failHandler) {
        // Ensure that we are the only current active request
        const img = this.add('img', { className: 'icon', style: 'display: none' })
        const promise = this.#promise = State.resolveCachedImage(img, iconOrUrl)
        promise.then(_ => {
            if (this.#promise !== promise) {
                img.remove()
                return
            }

            // Replace image
            this.querySelector('i.icon')?.remove()
            for (const old of this.querySelectorAll('img')) {
                if (old !== img) {
                    old.remove()
                }
            }
            img.show()

            this.onchange?.()
        })
            .catch(_ => {
                img.remove()
                if (this.#promise === promise) {
                    failHandler?.()
                }
            })
    }
}
customElements.define('bs-icon', IconElement)