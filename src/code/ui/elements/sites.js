import { BookmarkElement } from "./bookmark.js"
import { FolderElement } from "./folder.js"

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
    static get instance() { return SiteListElement.#instance ??= new SiteListElement() }

    constructor() {
        if (SiteListElement.#instance) {
            throw new Error('Only one instance of SitesElement allowed')
        }

        SiteListElement.#sitesFolder.bookmarks.list = () => [...SiteListElement.#sitesFolder.bookmarks]

        super(SiteListElement.#sitesFolder)
        this.refresh()
    }

    refresh() {
        chrome.topSites.get().then((sites) => {
            SiteListElement.#sitesFolder.bookmarks.splice(0, SiteListElement.#sitesFolder.bookmarks.length)
            for (const site of sites.filter(s => s.url !== document.location.href)) {
                SiteListElement.#sitesFolder.bookmarks.push(new SiteElement(site))
            }
            super.refresh()
        })
    }
}
customElements.define('bs-site-list', SiteListElement)

export class SiteElement extends BookmarkElement {
    constructor(site) {
        super({
            title: site.title,
            url: site.url,
            domain: isURL(site.url) ? new URL(site.url).origin : null,
            altIcon: 'far fa-file-code',
            readonly: true,
            immobile: true
        })
        delete this.id
    }
}
customElements.define('bs-site', SiteElement)