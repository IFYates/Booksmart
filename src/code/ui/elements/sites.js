import State from "../../models/state.js"
import { FolderElement } from "./folder.js"
import { SiteElement } from "./SiteElement.js"

export class SiteListElement extends FolderElement {
    static #sitesFolder = {
        id: 'topSites',
        isOwned: true,
        fixed: true,
        immobile: true,
        readonly: true,
        icon: 'fas fa-arrow-up-wide-short',
        title: 'Most visited sites',
        bookmarks: []
    }

    static #instance
    static get instance() { return SiteListElement.#instance ??= document.getElementsByTagName(customElements.getName(SiteListElement)) }

    constructor() {
        if (SiteListElement.#instance) {
            throw new Error('Only one instance of SitesElement allowed')
        }

        super(SiteListElement.#sitesFolder)
        SiteListElement.#instance = this
    }

    refresh() {
        if (!State.options.showTopSites) {
            this.shadowRoot.host.style.display = 'none'
            super.refresh()
            return
        }
        this.shadowRoot.host.style.display = ''

        chrome.topSites.get().then((sites) => {
            SiteListElement.#sitesFolder.bookmarks.splice(0, SiteListElement.#sitesFolder.bookmarks.length)
            for (const site of sites.filter(s => s.url != document.location.href)) {
                SiteListElement.#sitesFolder.bookmarks.push(new SiteElement(site))
            }
            super.refresh()
        })
    }

    _ondisplay(root, host) {
        if (this.shadowRoot.host.style.display != 'none' && !SiteListElement.#sitesFolder.bookmarks.length) {
            this.refresh()
            return
        }

        super._ondisplay(root, host)
    }
}
customElements.define('bs-site-list', SiteListElement)