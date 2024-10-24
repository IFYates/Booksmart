/*
A managed collection of bookmarks.
*/
export default class Collection extends Folder {
    #_

    constructor(layout, folder) {
        super(layout, folder)
        this.#_ = this._share()

        if (this.#_.isExternal) {
            console.log('Provided folder is not part of the Booksmart hierarchy', folder)
            throw Error('Invalid collection')
        }

        this.#_.applyData = (data) => {
            data = tryParse(data, { title: data })
            this.#_.data = {
                title: data.title || '',
                icon: data.icon || '',
                collapsed: !!data.collapsed,
                favourite: !!data.favourite, // TODO: not currently used
                sortOrder: num(data.sortOrder)
            }
        }

        this.#_.apply(folder)
    }

    get readonly() { return false }
    get immobile() { return false }
    get fixed() { return false }

    get title() { return this.#_.data.title }
    set title(value) { this.#_.data.title = value?.trim() }
    get icon() { return this.#_.data.icon }
    set icon(value) { this.#_.data.icon = value?.trim() }
    get collapsed() { return this.#_.data.collapsed }
    set collapsed(value) { this.#_.data.collapsed = !!value }
    get favourite() { return this.#_.data.favourite }
    set favourite(value) { this.#_.data.favourite = !!value }
    get sortOrder() { return this.#_.data.sortOrder } // 0: Manual, 1: Alphabetic, 2: Creation date, 3: Clicks (then alphabetic), 4 Last click, -ve = opposite
    set sortOrder(value) { this.#_.data.sortOrder = num(value) }

    bookmarks = {
        count: () => this.#_.bookmarks.length,

        add: async (bookmark) => {
            if (bookmark.collection.id !== this.id) {
                await bookmark.moveTo(this)
            } else if (this.#_.bookmarks.indexOf(bookmark) < 0) {
                this.#_.bookmarks.push(bookmark)
            }
            return bookmark
        },
        create: async (title, url) => {
            const bookmark = new Bookmark(this, {
                title: title,
                url: url
            })
            this.#_.bookmarks.push(bookmark)
            return bookmark
        },
        list: () => {
            var result = [...this.#_.bookmarks]
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
            const index = this.#_.bookmarks.indexOf(bookmark)
            if (index >= 0) {
                this.#_.bookmarks.splice(index, 1)
            }
        }
    }

    async delete() {
        if (this.isExternal) {
            console.error('TODO')
            return
        }

        await chrome.bookmarks.removeTree(this.id)
        await this.#_.layout.reload()
    }

    export(standalone) {
        const data = { ...this.#_.data }
        if (standalone) {
            data['.booksmart.version'] = 1
            data['.booksmart.content'] = 'collection'
        }
        data.id = this.id
        data.index = this.index
        data.bookmarks = this.#_.bookmarks.map(b => b.export())
        return data
    }
    import(data) {
        this.url = data.url
        delete data.url
        this.#_.applyData(data)
    }

    async save() {
        if (this.isExternal) {
            console.error('TODO')
            return
        }

        if (this.id) {
            // Update existing
            await chrome.bookmarks.update(this.id, {
                title: JSON.stringify(this.#_.data)
            })
        } else {
            // Create new
            this.#_.folder = await chrome.bookmarks.create({
                parentId: this.#_.layout.id,
                title: JSON.stringify(this.#_.data)
            })
            this.#_.apply(this.#_.folder)
        }
    }

    async setIndex(index) {
        if (this.isExternal) {
            console.error('TODO')
            return
        }

        index = Math.min(Math.max(0, index), this.#_.layout.collections.count() - 1)
        await this.#_.layout.collections.setIndex(this, index)
    }

    async reload() {
        this.#_.folder = (await chrome.bookmarks.get(this.id))[0]
        this.#_.folder.children = await chrome.bookmarks.getChildren(this.id)
        this.#_.apply(this.#_.folder)
    }
}

import Bookmark from './bookmark.js'
import Folder from './folder.js'