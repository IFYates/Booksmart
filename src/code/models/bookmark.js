/*
A single bookmark.
*/
export default class Bookmark {
    #storage
    #parentId
    #id
    #index
    #title
    #url
    #dateAdded
    #data = {}

    constructor(storage, bookmark, data) {
        this.#storage = storage
        this.#parentId = bookmark.parentId
        this.#id = bookmark.id
        this.#index = num(bookmark.index)
        this.#title = bookmark.title
        this.#url = bookmark.url
        this.#dateAdded = bookmark.dateAdded
        this.#applyData(data)
    }
    #applyData(data) {
        this.#data = {
            icon: data.icon || '',
            favourite: !!data.favourite,
            clicks: num(data.clicks),
            lastClick: data.lastClick || 0,
            notes: data.notes || ''
        }
    }

    get readonly() { return !this.#storage }

    get folderId() { return this.#parentId }
    get id() { return this.#id }
    get index() { return this.#index }
    get title() { return this.#title }
    set title(value) { this.#title = value?.trim() }
    get url() { return this.#url }
    set url(value) { this.#url = value?.trim() }
    get dateAddedUtc() { return new Date(this.#dateAdded) }
    get domain() { return new URL(this.#url).origin }

    get icon() { return this.#data.icon }
    set icon(value) { this.#data.icon = value?.trim() }
    get favourite() { return this.#data.favourite }
    set favourite(value) { this.#data.favourite = !!value }
    get clicks() { return this.#data.clicks }
    get lastClick() { return new Date(this.#data.lastClick) }
    get notes() { return this.#data.notes }
    set notes(value) { this.#data.notes = value?.trim() }

    folder
    previous
    next
    get isFirst() { return !this.previous }
    get isLast() { return !this.next }

    #lastTab = null
    async click(ev, openExistingTab, openNewTab) {
        if (openExistingTab && this.#lastTab) {
            ev.preventDefault()
            await Tabs.focus(this.#lastTab)
        } else if (!openNewTab) {
            ev.target.parentNode.classList.add('pulse')
        }

        this.#data.clicks += 1
        this.#data.lastClick = new Date().getTime()
        await this.save()
    }

    async duplicate() {
        const data = { ...this.#data }
        delete data.clicks
        delete data.lastClick

        const bookmark = await this.#storage.create(this.folderId, this.title, this.url)
        bookmark.folder = this.folder
        bookmark.#applyData(data)
        await this.save()
        return bookmark
    }

    async delete() {
        if (this.readonly) return
        this.folder.bookmarks.remove(this)
        await this.#storage.delete(this)
    }

    export(includeInternals = true) {
        const data = this.#data
        data.tidy(['favourite', 'icon', 'click', 'lastClick', 'notes'], (v) => !!v)

        if (includeInternals) {
            data.id = this.id
            data.index = this.index
            data.title = this.title
            data.url = this.url
        }
        return data
    }
    import(data) {
        if (this.readonly) return
        this.#applyData(data)
    }

    async hasOpenTab() {
        if (!isURL(this.url)) {
            return false
        }
        this.#lastTab = await Tabs.find(this.url)
        return !!this.#lastTab
    }

    async moveTo(folder) {
        if (this.readonly) return
        if (this.folder.id !== folder.id) {
            this.#index = null
            this.folder = folder
            await folder.bookmarks.add(this)
            this.#parentId = folder.id
            await this.save()
        }
    }

    async save() {
        if (this.readonly) return
        await this.#storage.save(this)
    }

    async setIndex(index) {
        this.#index = Math.max(0, index)
        await this.save()
    }
}

import Tabs from './tabs.js'