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
    }
    #applyData(data) {
        this.#data = {
            favourite: !!data.favourite,
            icon: data.icon || '',
            index: num(data.index, 999),
            collapsed: !!data.collapsed,
            sortOrder: num(data.sortOrder)
        }
    }

    get readonly() { return !this.#storage }
    get immobile() { return false } // TODO
    get fixed() { return false } // TODO
    get isFolder() { return !this.#owned }

    get parentId() { return this.#parentId }
    get id() { return this.#id }
    get title() { return this.#title }
    set title(value) { this.#title = value?.trim() }

    get collapsed() { return this.#data.collapsed }
    set collapsed(value) { this.#data.collapsed = !!value }
    get favourite() { return this.#data.favourite }
    set favourite(value) { this.#data.favourite = !!value }
    get icon() { return this.#data.icon }
    set icon(value) { this.#data.icon = value?.trim() }
    get index() { return this.#data.index }
    get sortOrder() { return this.#data.sortOrder } // 0: Manual, 1: Alphabetic, 2: Creation date, 3: Clicks (then alphabetic), 4 Last click, -ve = opposite
    set sortOrder(value) { this.#data.sortOrder = num(value) }

    bookmarks = {
        count: () => this.#bookmarks.length,
        add: async (bookmark) => {
            if (bookmark.folderId !== this.id) {
                await bookmark.moveTo(this)
            } else if (!this.#bookmarks.includes(bookmark)) {
                this.#bookmarks.push(bookmark)
            }
            return bookmark
        },
        create: async (title, url) => {
            return this.#storage.createBookmark(this, title, url)
        },
        list: () => {
            const result = []
            for (const bookmark of this.#bookmarks) {
                result.push(bookmark)
            }

            function compareFavourite(a, b) { return (a.favourite ? 0 : 1) - (b.favourite ? 0 : 1) }
            switch (Math.abs(this.sortOrder)) {
                default: // Manual
                    result.sort(compareFavourite)
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
            return this.sortOrder < 0 ? result.reverse() : result
        },
        remove: (bookmark) => {
            const index = this.#bookmarks.indexOf(bookmark)
            if (index >= 0) {
                this.#bookmarks.splice(index, 1)
            }
        }
    }

    async delete() {
        if (this.readonly) return
        await this.#storage.delete(this)
    }

    export(includeInternals = true, includeVersion = false) {
        const data = { ...this.#data }
        data.keyTrim(['favourite', 'icon', 'collapsed', 'sortOrder'], (v, k) => !!v)
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

    async save() {
        if (this.readonly) return
        await this.#storage.save(this)
    }

    async setIndex(index) {
        if (this.readonly) return
        this.#data.index = index // TODO: (index - 1) + 0.5
        await this.#storage.save(this)
    }

    async remove() {
        if (this.readonly) return
        await this.#storage.remove(this)
    }
}