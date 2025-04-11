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

        var content = ''
        if (!iconOrUrl) {
            iconOrUrl = 'favicon'
        } else if (iconOrUrl != 'favicon' && !isURL(iconOrUrl)) {
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
                if (p.length > 1) {
                    url = p.slice(1).join('.')
                    self.#showImage(`https://favicone.com/${url}?s=128`, () => retryWithoutSubdomain(url))
                }
            }
            return self.#showImage(`https://favicone.com/${domain}?s=128`, () => retryWithoutSubdomain(domain))
        } else if (isURL(iconOrUrl)) {
            return self.#showImage(iconOrUrl)
        }

        // Assume classes
        self.querySelector('i.icon')?.remove()
        self.add('i', content, { className: `icon ${iconOrUrl}` })
    }

    #imageBusy = false
    #showImage(iconOrUrl, failHandler) {
        // Ensure that we are the only current active request
        const uuid = 'I' + Math.random().toString(36).slice(2)
        this.#imageBusy = uuid
        for (const img of this.querySelectorAll('img')) {
            img.remove()
        }
        const img = this.add('img', { id: uuid, className: 'icon', style: 'display: none' })
        if (this.#imageBusy != uuid) {
            return
        }

        State.resolveCachedImage(img, iconOrUrl)
            .then(_ => {
                if (this.#imageBusy != uuid) {
                    img.remove()
                    return
                }

                this.#imageBusy = false
                this.querySelector('i.icon')?.remove()
                img.show()
                this.onchange?.()
            })
            .catch(_ => {
                img.remove()
                if (this.#imageBusy == uuid) {
                    this.#imageBusy = false
                    failHandler?.()
                }

            })
    }
}
customElements.define('bs-icon', IconElement)