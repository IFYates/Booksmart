import State from "../../models/state.js"
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
            for (const site of sites.filter(s => s.url != document.location.href)) {
                SiteListElement.#sitesFolder.bookmarks.push(new SiteElement(site))
            }
            super.refresh()
        })
    }
}
customElements.define('bs-site-list', SiteListElement)

export class SiteElement extends BookmarkElement {
    get site() { return super.bookmark }

    constructor(site) {
        super({
            title: site.title,
            url: site.url,
            domain: isURL(site.url) ? new URL(site.url).origin : null,
            altIcon: 'far fa-file-code',
            readonly: true,
            immobile: true
        })
        this.removeAttribute('id')
    }

    async moveTo(folder, origin) {
        const data = await State.createBookmark(folder.folder, this.site.title, this.site.url)
        const element = new BookmarkElement(data)
        this.parentNode.insertBefore(element, this)
        origin?.parentNode.insertBefore(this, origin)
        folder.reindexBookmarks()
    }
}
customElements.define('bs-site', SiteElement)