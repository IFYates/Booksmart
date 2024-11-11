import State from './state.js'

/*
A single bookmark.
*/
export default class Bookmark {
    constructor(bookmark, data = {}) {
        this.#parentId = bookmark.parentId
        this.#id = bookmark.id
        this.#dateAdded = num(bookmark.dateAdded)

        this.#title = bookmark.title
        this.#url = bookmark.url
        this.#index = num(bookmark.index)

        this.import(data)
    }

    get uuid() { return `${this.#id}:${this.#dateAdded}:${this.#url.hashCode()}` }

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

    async click() {
        this.#clicks += 1
        this.#lastClick = new Date().getTime()
        State.updateEntry(this)
    }

    async duplicate() {
        return await State.createBookmark(this.#parentId, this.#title, this.#url, this.export())
    }

    static #defaults = {
        favourite: false,
        icon: '',
        index: null,
        clicks: 0,
        lastClick: 0,
        notes: '',
        title: null,
        url: null
    }
    export(standalone) {
        return {
            favourite: this.#favourite,
            icon: this.#icon,
            index: this.#index,
            clicks: this.#clicks,
            lastClick: this.#lastClick,
            notes: this.#notes,
            title: standalone ? this.#title : null,
            url: standalone ? this.#url : null
        }.pick(Bookmark.#defaults)
    }

    import(data) {
        this.#index = num(data.index, this.#index)
        this.#icon = data.icon || ''
        this.#favourite = !!data.favourite
        this.#clicks = num(data.clicks)
        this.#lastClick = num(data.lastClick)
        this.#notes = data.notes || ''
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
}