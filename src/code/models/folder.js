import State from "./state.js"

/*
A folder in the bookmarks hierarchy.
*/
export default class Folder {
    constructor(folder, data = {}) {
        this.#parentId = folder.parentId
        this.#id = folder.id
        this.#title = folder.title
        this.#dateAdded = folder.dateAdded
        this.#index = num(data.index)
        this.#accentColour = data.accentColour
        this.#backgroundImage = data.backgroundImage
        this.#collapsed = !!data.collapsed
        this.#icon = data.icon
        this.#sortOrder = num(data.sortOrder)
    }

    get isOwned() { return this.#parentId == State.booksmartRootId }

    #parentId
    get parentId() { return this.#parentId }
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
    #bookmarks = []
    get bookmarks() { return this.#bookmarks }

    #accentColour
    get accentColour() { return this.#accentColour }
    set accentColour(value) { this.#accentColour = value }
    #backgroundImage
    get backgroundImage() { return this.#backgroundImage }
    set backgroundImage(value) { this.#backgroundImage = value }
    #collapsed
    get collapsed() { return this.#collapsed }
    set collapsed(value) { this.#collapsed = !!value }
    #icon
    get icon() { return this.#icon }
    set icon(value) { this.#icon = value?.trim() }
    #sortOrder
    get sortOrder() { return this.#sortOrder }
    set sortOrder(value) { this.#sortOrder = num(value) }

    get immobile() { return false }
    get readonly() { return false }

    static #defaults = {
        accentColour: v => !v,
        backgroundImage: v => !v?.length,
        collapsed: false,
        icon: v => !v?.length,
        index: null,
        sortOrder: 0
    }
    export() {
        return {
            accentColour: this.#accentColour,
            backgroundImage: this.#backgroundImage,
            collapsed: this.#collapsed,
            icon: this.#icon,
            index: this.#index,
            sortOrder: this.#sortOrder
        }.pick(Folder.#defaults)
    }

    // // TODO: remove this.save() and have global save manage all
    // bookmarks = {
    //     add: async (bookmark) => {
    //         if (bookmark.folderId !== this.id) {
    //             bookmark.folder?.bookmarks.remove(bookmark)
    //             // TEMP await bookmark.moveTo(this)
    //         }
    //         if (!this.#bookmarks.includes(bookmark)) {
    //             this.#bookmarks.push(bookmark)
    //         }
    //         return bookmark
    //     },
    //     create: (title, url) => {
    //         return this.#storage.bookmarks.create(this, title, url)
    //     },
    //     move: async (bookmark, index) => { // TODO: combine in to 'add'?
    //         await this.bookmarks.add(bookmark)
    //         this.bookmarks.remove(bookmark)
    //         const idx = this.#bookmarks.filter((b) => b.index < index).length
    //         this.#bookmarks.splice(idx, 0, bookmark)
    //         await bookmark.setIndex(index)
    //         await this.#reindex(this.#bookmarks)
    //     },
    //     remove: (bookmark) => {
    //         const index = this.#bookmarks.indexOf(bookmark)
    //         if (index >= 0) {
    //             this.#bookmarks.splice(index, 1)
    //         }
    //     }
    // }

    // // Ensures all bookmarks have a valid index and double-linked
    // async #reindex(array) {
    //     var previous = null
    //     for (const entry of array) {
    //         if (entry.index <= previous?.index) {
    //             await entry.setIndex(previous.index + 1)
    //         }

    //         // TEMP entry.folder = this
    //         entry.next = null
    //         if (previous) previous.next = entry
    //         entry.previous = previous
    //         previous = entry
    //     }
    // }

    // async delete() {
    //     if (this.readonly) return
    //     await this.#storage.delete(this)
    // }

    // export(includeInternals = true, includeVersion = false) {
    //     const data = { ...this.#data }
    //     data.tidy(['accentColour', 'backgroundImage', 'collapsed', 'icon', 'sortOrder'], (v) => !!v)
    //     data.index = this.#data.index

    //     if (includeVersion) {
    //         data['.booksmart'] = { version: 1, content: 'folder' }
    //     }
    //     if (includeInternals) {
    //         data.id = this.id
    //         data.title = this.title
    //         data.bookmarks = this.#bookmarks.map(b => b.export())
    //     }
    //     return data
    // }
    // import(data) {
    //     this.title = data.title
    //     delete data.title
    //     this.url = data.url
    //     delete data.url
    //     this.#applyData(data)
    // }

    // async remove() {
    //     if (this.readonly) return
    //     await this.#storage.remove(this)
    // }
}