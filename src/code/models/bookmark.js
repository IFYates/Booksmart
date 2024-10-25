/*
A single bookmark.
*/
export default class Bookmark {
    #collection
    #bookmark
    #data

    constructor(collection, bookmark) {
        this.#collection = collection
        this.#apply(bookmark)
    }
    #apply(bookmark) {
        this.#bookmark = bookmark
        const data = tryParse(this.#bookmark.title, { title: this.#bookmark.title })
        this.#applyData(data)
    }
    #applyData(data) {
        this.#data = {
            title: data.title || '',
            icon: data.icon || '',
            clicks: num(data.clicks),
            lastClick: this.#bookmark.dateLastUsed || data.lastClick || 0,
            favourite: !!data.favourite,
            notes: data.notes || ''
        }
    }

    get readonly() { return this.#collection.readonly || (this.#collection.isExternal && !this.#collection.isFolder) }
    get isExternal() { return this.#collection.isExternal }

    get collection() { return this.#collection }
    get id() { return this.#bookmark.id }
    get index() { return this.#bookmark.index }
    get title() { return this.#data.title }
    set title(value) { this.#data.title = value?.trim() }
    get icon() { return this.#data.icon }
    set icon(value) { this.#data.icon = value?.trim() }
    get url() { return this.#bookmark.url }
    set url(value) { this.#bookmark.url = value?.trim() }
    get domain() { return new URL(this.#bookmark.url).origin }
    get favourite() { return this.#data.favourite }
    set favourite(value) { this.#data.favourite = !!value }
    get dateAddedUtc() { return new Date(this.#bookmark.dataAdded) }
    get clicks() { return this.#data.clicks }
    get lastClick() { return new Date(this.#data.lastClick) }
    get notes() { return this.#data.notes }
    set notes(value) { this.#data.notes = value?.trim() }

    #lastTab = null
    async click(ev, openExistingTab) {
        if (openExistingTab && this.#lastTab) {
            ev.preventDefault()
            await Tabs.focus(this.#lastTab)
        } else if (!this.#collection.layout.openNewTab) {
            ev.target.parentNode.classList.add('pulse')
        }

        this.#data.clicks += 1
        this.#data.lastClick = new Date().getTime()
        await this.save()
    }

    async duplicate() {
        const data = { ...this.#data }
        data.clicks = 0
        data.lastClick = 0
        const bookmark = await chrome.bookmarks.create({
            parentId: this.#collection.id,
            title: JSON.stringify(data),
            url: this.url
        })
        return this.#collection.bookmarks.add(new Bookmark(this.#collection, bookmark))
    }

    async delete() {
        if (this.readonly) return
        await chrome.bookmarks.remove(this.id)
        await this.#collection.reload()
    }

    export() {
        const data = { ...this.#data }
        data.id = this.#bookmark.id
        data.index = this.#bookmark.index
        data.url = this.#bookmark.url
        data.dateAdded = this.#bookmark.dataAdded
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

    async moveTo(collection) {
        if (this.readonly) return
        if (this.#collection?.id !== collection.id) {
            this.#collection?.bookmarks.remove(this)
            this.#collection = collection
            this.#collection.bookmarks.add(this)
            await chrome.bookmarks.move(this.id, { parentId: this.#collection.id })
        }
    }

    async save() {
        if (this.readonly) return

        var titleData
        if (!this.#collection.isFolder) {
            titleData = JSON.stringify(this.#data)
        } else {
            titleData = this.title
            // TODO: other data for isFolder
        }

        if (this.id) {
            // Update existing
            await chrome.bookmarks.update(this.id, {
                title: titleData,
                url: this.#bookmark.url
            })
            return
        } else {
            // Create new
            this.#bookmark = await chrome.bookmarks.create({
                parentId: this.#collection.id,
                title: titleData,
                url: this.#bookmark.url
            })
            this.#apply(this.#bookmark)
        }
    }

    async setIndex(index) {
        index = Math.max(0, index)
        if (this.index < index) {
            index += 1
        }
        await chrome.bookmarks.move(this.id, { index: index })
        await this.#collection.layout.reload()
    }
}

import Tabs from '../tabs.js'