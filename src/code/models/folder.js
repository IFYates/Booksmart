/*
A folder in the bookmarks hierarchy.
*/
export default class Folder {
    #storage
    #parentId
    #id
    #title
    #data = {}
    #bookmarks = []
    #owned = true

    constructor(storage, folder, data, isOwned) {
        this.#storage = storage
        this.#parentId = folder.parentId
        this.#id = folder.id
        this.#title = folder.title
        this.#owned = isOwned
        this.#applyData(data)
        this.bookmarks.list()
    }
    #applyData(data) {
        this.#data = {
            accentColour: data.accentColour,
            collapsed: !!data.collapsed,
            favourite: !!data.favourite,
            icon: data.icon || '',
            index: num(data.index, NaN),
            sortOrder: num(data.sortOrder)
        }
    }

    get readonly() { return !this.#storage }
    get isOwned() { return this.#owned }

    get parentId() { return this.#parentId }
    get id() { return this.#id }
    get title() { return this.#title }
    set title(value) { this.#title = value?.trim() }

    get accentColour() { return this.#data.accentColour }
    set accentColour(value) {
        if (/^#[0-9A-F]{6}$/i.test(value)) {
            this.#data.accentColour = value
        }
    }
    get collapsed() { return this.#data.collapsed }
    set collapsed(value) { this.#data.collapsed = !!value }
    get favourite() { return this.#data.favourite }
    set favourite(value) { this.#data.favourite = !!value }
    get icon() { return this.#data.icon }
    set icon(value) { this.#data.icon = value?.trim() }
    get index() { return this.#data.index }
    set index(value) { this.#data.index = (isNaN(value) && typeof value === 'number') ? value : num(value) }
    get sortOrder() { return this.#data.sortOrder } // 0: Manual, 1: Alphabetic, 2: Creation date, 3: Clicks (then alphabetic), 4 Last click, -ve = opposite
    set sortOrder(value) { this.#data.sortOrder = num(value) }

    previous
    next
    get isFirst() { return !this.previous }
    get isLast() { return !this.next }
    get first() { return this.previous?.first || this }

    // TODO: remove this.save() and have global save manage all
    bookmarks = {
        count: () => this.#bookmarks.length,
        add: async (bookmark) => {
            if (bookmark.folderId !== this.id) {
                bookmark.folder?.bookmarks.remove(bookmark)
                await bookmark.moveTo(this)
            }
            if (!this.#bookmarks.includes(bookmark)) {
                this.#bookmarks.push(bookmark)
            }
            return bookmark
        },
        create: (title, url) => {
            return this.#storage.bookmarks.create(this, title, url)
        },
        get: (id) => {
            return this.#bookmarks.find(b => b.id === id)
                || this.#storage.bookmarks.get(id)
        },
        list: () => {
            const result = [...this.#bookmarks]
            const compareFavourite = (a, b) => (a.favourite ? 0 : 1) - (b.favourite ? 0 : 1)
            switch (Math.abs(this.sortOrder)) {
                default: // Manual
                    result.sort((a, b) => compareFavourite(a, b) || a.index - b.index)
                    break;
                case 1: // Alphabetic
                    result.sort((a, b) => compareFavourite(a, b) || a.title.localeCompare(b.title))
                    break;
                case 2: // Creation date
                    result.sort((a, b) => compareFavourite(a, b) || a.dateAddedUtc - b.dateAddedUtc)
                    break;
                case 3: // Clicks
                    result.sort((a, b) => compareFavourite(a, b) || b.clicks - a.clicks || a.title.localeCompare(b.title))
                    break;
                case 4: // Last click
                    result.sort((a, b) => compareFavourite(a, b) || b.lastClick - a.lastClick)
                    break;
            }
            if (this.sortOrder < 0) {
                result.reverse()
            }
            this.#reindex(result)
            return result
        },
        move: async (bookmark, index) => { // TODO: combine in to 'add'?
            await this.bookmarks.add(bookmark)
            this.bookmarks.remove(bookmark)
            const idx = this.#bookmarks.filter((b) => b.index < index).length
            this.#bookmarks.splice(idx, 0, bookmark)
            await bookmark.setIndex(index)
            await this.#reindex(this.#bookmarks)
        },
        remove: (bookmark) => {
            const index = this.#bookmarks.indexOf(bookmark)
            if (index >= 0) {
                this.#bookmarks.splice(index, 1)
            }
        }
    }

    // Ensures all bookmarks have a valid index and double-linked
    async #reindex(array) {
        var previous = null
        for (const entry of array) {
            if (entry.index <= previous?.index) {
                await entry.setIndex(previous.index + 1)
            }

            entry.folder = this
            entry.next = null
            if (previous) previous.next = entry
            entry.previous = previous
            previous = entry
        }
    }

    async delete() {
        if (this.readonly) return
        await this.#storage.delete(this)
    }

    export(includeInternals = true, includeVersion = false) {
        const data = { ...this.#data }
        data.tidy(['accentColour', 'collapsed', 'favourite', 'icon', 'sortOrder'], (v) => !!v)
        data.index = this.#data.index

        if (includeVersion) {
            data['.booksmart'] = { version: 1, content: 'folder' }
        }
        if (includeInternals) {
            data.id = this.id
            data.title = this.title
            data.bookmarks = this.#bookmarks.map(b => b.export())
        }
        return data
    }
    import(data) {
        this.title = data.title
        delete data.title
        this.url = data.url
        delete data.url
        this.#applyData(data)
    }

    async reindexAll() {
        if (this.readonly) return
        var idx = -1
        var item = this.first
        while (item) {
            if (item.index !== ++idx) {
                item.index = idx
                await item.save()
            }
            item = item.next
        }
    }

    async remove() {
        if (this.readonly) return
        await this.#storage.remove(this)
    }

    async save() {
        if (this.readonly) return
        await this.#storage.save(this)
    }
}