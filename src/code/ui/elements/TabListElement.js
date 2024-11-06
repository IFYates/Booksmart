import { FolderElement } from './folder.js'
import { Tabs } from '../../common/tabs.js'
import State from '../../models/state.js'
import { TabElement } from './TabElement.js'

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

        TabListElement.#tabsFolder.collapsed = !State.options.showTabList
        super(TabListElement.#tabsFolder)

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

    onShowOrHide() {
        State.options.showTabList = !TabListElement.#tabsFolder.collapsed
    }
}
customElements.define('bs-tab-list', TabListElement)