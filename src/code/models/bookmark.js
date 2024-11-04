import State from './state.js'

/*
A single bookmark.
*/
export default class Bookmark {
    constructor(bookmark, data = {}) {
        this.#parentId = bookmark.parentId
        this.#id = bookmark.id
        this.#index = num(data.index, bookmark.index)
        this.#dateAdded = num(bookmark.dateAdded)

        this.#title = bookmark.title
        this.#url = bookmark.url

        this.#icon = data.icon || ''
        this.#favourite = !!data.favourite
        this.#clicks = num(data.clicks)
        this.#lastClick = num(data.lastClick)
        this.#notes = data.notes || ''
    }

    #parentId
    get folderId() { return this.#parentId }
    #id
    get id() { return this.#id }
    #dateAdded
    get dateAdded() { return new Date(this.#dateAdded) }

    #title
    get title() { return this.#title }
    set title(value) { this.#title = value?.trim() }
    #index
    get index() { return this.#index }
    set index(value) { this.#index = num(value) }
    #url
    get url() { return this.#url }
    set url(value) { this.#url = value?.trim() }
    get domain() { return new URL(this.#url).origin }

    #icon
    get icon() { return this.#icon }
    set icon(value) { this.#icon = value?.trim() }
    #favourite
    get favourite() { return this.#favourite }
    set favourite(value) { this.#favourite = !!value }
    #clicks
    get clicks() { return this.#clicks }
    #lastClick
    get lastClick() { return new Date(this.#lastClick) }
    #notes
    get notes() { return this.#notes }
    set notes(value) { this.#notes = value?.trim() }

    async duplicate() {
        return await State.createBookmark(this.#parentId, this.#title, this.#url, this.export())
    }

    static #defaults = {
        favourite: false,
        icon: '',
        index: null,
        clicks: 0,
        lastClick: 0,
        notes: ''
    }
    export() {
        return {
            favourite: this.#favourite,
            icon: this.#icon,
            index: this.#index,
            clicks: this.#clicks,
            lastClick: this.#lastClick,
            notes: this.#notes
        }.pick(Bookmark.#defaults)
    }

    async moveTo(folder) {
        if (this.#parentId != folder.id) {
            const from = State.folder(this.#parentId)
            this.#parentId = folder.id
            await State.moveBookmark(this, folder)
            from.bookmarks.splice(from.bookmarks.indexOf(this), 1)
            folder.bookmarks.push(this)
        }
    }

    // folder
    // previous
    // next
    // get isFirst() { return !this.previous }
    // get isLast() { return !this.next }

    // export(includeInternals = true) {
    //     const data = this.#data
    //     data.tidy(['favourite', 'icon', 'click', 'lastClick', 'notes'], (v) => !!v)

    //     if (includeInternals) {
    //         data.id = this.id
    //         data.index = this.index
    //         data.title = this.title
    //         data.url = this.url
    //     }
    //     return data
    // }
    // import(data) {
    //     if (this.readonly) return
    //     this.#applyData(data)
    // }

    // async save() {
    //     if (this.readonly) return
    //     await this.#storage.save(this)
    // }

    // async setIndex(index) {
    //     this.#index = Math.max(0, index)
    //     await this.save()
    // }
}