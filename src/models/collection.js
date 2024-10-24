/*
A collection of bookmarks.
*/
class Collection {
    #layout
    #folder
    #data
    #bookmarks = []

    constructor(layout, folder) {
        this.#layout = layout
        this.#apply(folder)
    }
    #apply(folder) {
        this.#bookmarks = []
        for (const child of folder.children?.filter(c => !Array.isArray(c.children)).sort(b => b.index) ?? []) {
            this.#bookmarks.push(new Bookmark(this, child))
            // TODO: deep?
        }

        this.#folder = folder
        const data = tryParse(folder.title, {})
        this.#applyData(data)
    }
    #applyData(data) {
        this.#data = {
            title: data.title || '',
            icon: data.icon || '',
            collapsed: !!data.collapsed,
            favourite: !!data.favourite,
            sortOrder: num(data.sortOrder)
        }
    }

    get layout() { return this.#layout }
    get id() { return this.#folder.id }
    get index() { return this.#folder.index }
    get title() { return this.#data.title }
    set title(value) { this.#data.title = value?.trim() }
    get icon() { return this.#data.icon }
    set icon(value) { this.#data.icon = value?.trim() }
    get collapsed() { return this.#data.collapsed }
    set collapsed(value) { this.#data.collapsed = !!value }
    get favourite() { return this.#data.favourite }
    set favourite(value) { this.#data.favourite = !!value }
    get sortOrder() { return this.#data.sortOrder } // 0: Manual, 1: Alphabetic, 2: Creation date, 3: Clicks (then alphabetic), 4 Last click, -ve = opposite
    set sortOrder(value) { this.#data.sortOrder = num(value) }

    bookmarks = {
        count: () => this.#bookmarks.length,

        add: async (bookmark) => {
            if (bookmark.collection.id !== this.id) {
                await bookmark.moveTo(this)
            } else if (this.#bookmarks.indexOf(bookmark) < 0) {
                this.#bookmarks.push(bookmark)
            }
            return bookmark
        },
        create: async (title, url) => {
            const bookmark = new Bookmark(this, {
                title: title,
                url: url
            })
            this.#bookmarks.push(bookmark)
            return bookmark
        },
        list: () => {
            var result = this.#bookmarks.slice()
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
        await chrome.bookmarks.removeTree(this.id)
        await this.#layout.reload()
    }

    export() {
        const data = { ...this.#data }
        data.id = this.id
        data.index = this.index
        data.bookmarks = this.#bookmarks.map(b => b.export())
        return data
    }
    import(data) {
        this.url = data.url
        this.#applyData(data)
    }

    async save() {
        if (this.id) {
            // Update existing
            await chrome.bookmarks.update(this.id, {
                title: JSON.stringify(this.#data)
            })
        } else {
            // Create new
            this.#folder = await chrome.bookmarks.create({
                parentId: this.#layout.id,
                title: JSON.stringify(this.#data)
            })
            this.#apply(this.#folder)
        }
    }

    async setIndex(index) {
        index = Math.min(Math.max(0, index), this.#layout.collections.count() - 1)
        await this.#layout.collections.setIndex(this, index)
    }

    async reload() {
        this.#folder = (await chrome.bookmarks.get(this.id))[0]
        this.#folder.children = await chrome.bookmarks.getChildren(this.id)
        this.#apply(this.#folder)
    }
}

import Bookmark from './bookmark.js'
export default Collection