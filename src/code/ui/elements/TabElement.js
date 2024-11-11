import State from "../../models/state.js"
import { BookmarkElement } from "./bookmark.js"

export class TabElement extends BookmarkElement {
    #tab
    get tab() { return this.#tab }

    constructor(tab) {
        super({
            id: tab.id,
            title: tab.title,
            url: tab.url,
            readonly: true,
            domain: isURL(tab.url) ? new URL(tab.url).origin : null,
            altIcon: 'fas fa-window-maximize',
            icon: tab.icon,
            hasOpenTab: () => true
        })
        this.#tab = tab
        this.id = 'tab-' + tab.id
    }

    onclick(ev) {
        ev.stopPropagation()
        this.focus()
        return false
    }

    async focus() {
        await this.#tab.focus()
    }

    async moveTo(folder, origin) {
        const data = await State.createBookmark(folder.folder, this.tab.title, this.tab.url, { icon: this.tab.icon })
        const element = new BookmarkElement(data)
        this.parentNode.insertBefore(element, this)
        if (origin instanceof TabElement) {
            origin.parentNode?.insertBefore(this, origin)
        } else {
            origin?.appendChild(this)
        }
        folder.reindexBookmarks()
    }
}
customElements.define('bs-tab', TabElement)