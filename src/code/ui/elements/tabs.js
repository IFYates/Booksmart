import { BookmarkElement } from './bookmark.js'
import { FolderElement } from './folder.js'
import { Tabs } from '../../common/tabs.js'

export class TabListElement extends FolderElement {
    static #tabsFolder = {
        id: 'tabs',
        isOwned: true,
        immobile: true,
        readonly: true,
        collapsed: false,
        icon: 'fas fa-window-restore',
        title: 'Open tabs',
        bookmarks: []
    }

    static #instance
    static get instance() { return TabListElement.#instance ??= new TabListElement() }

    constructor() {
        if (TabListElement.#instance) {
            throw new Error('Only one instance of SitesElement allowed')
        }

        super(TabListElement.#tabsFolder)

        TabListElement.#tabsFolder.collapsed = !MainView.layout.showTabList // TODO: wrong place
        TabListElement.#tabsFolder.bookmarks.list = () => [...TabListElement.#tabsFolder.bookmarks]
        TabListElement.#tabsFolder.save = (async function () {
            MainView.layout.showTabList = !TabListElement.#tabsFolder.collapsed // TODO: wrong place
            await MainView.layout.save()
        }).bind(this)

        this.refresh()
        Tabs.subscribe(this.refresh.bind(this))
    }

    #refreshing = false
    refresh() {
        if (this.#refreshing) return
        this.#refreshing = true

        TabListElement.#tabsFolder.bookmarks.splice(0, TabListElement.#tabsFolder.bookmarks.length)

        if (TabListElement.#tabsFolder.collapsed) {
            super.refresh()
            this.#refreshing = false
            return
        }

        Tabs.list().then((tabs) => {
            tabs = tabs.filter(tab => !Tabs.isSelf(tab))
                .sort((a, b) => (a.windowId - b.windowId) || (a.index - b.index))
                .map(t => new TabElement(t))
            TabListElement.#tabsFolder.bookmarks.push(...tabs)
            super.refresh()
            this.#refreshing = false
        })
    }
}
customElements.define('bs-tab-list', TabListElement)

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
}
customElements.define('bs-tab', TabElement)