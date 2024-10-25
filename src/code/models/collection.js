/*
A managed collection of bookmarks.
*/
export default class Collection extends Folder {
    #_

    constructor(layout, folder) {
        super(layout, folder)
        this.#_ = this._share()

        if (this.#_.isExternal || this.#_.isFolder) {
            console.error('Provided folder is not part of the Booksmart hierarchy', folder)
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

        folder.data = tryParse(folder.title, { title: folder.title })
        this.#_.apply(folder)
    }

    get readonly() { return false }
    get immobile() { return false }
    get fixed() { return false }
    get isFolder() { return false }

    get index() { return this.#_.folder.index }
    get title() { return this.#_.data.title }
    set title(value) { this.#_.data.title = value?.trim() }

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
        await chrome.bookmarks.removeTree(this.id)
        await this.#_.layout.reload()
    }

    export(standalone) {
        const data = super.export(standalone)
        if (standalone) {
            data['.booksmart.content'] = 'collection'
        }
        return data
    }
    import(data) {
        this.url = data.url
        delete data.url
        this.#_.applyData(data)
    }

    async save() {
        if (this.id) {
            // Update existing
            await chrome.bookmarks.update(this.id, {
                title: JSON.stringify(this.#_.data)
            })
        } else {
            // Create new
            this.#_.folder = await chrome.bookmarks.create({
                parentId: this.#_.layout.id,
                title: JSON.stringify(this.#_.data),
                data: this.#_.data
            })
            this.#_.apply(this.#_.folder)
        }
    }

    async setIndex(index) {
        index = Math.min(Math.max(0, index), this.#_.layout.collections.length - 1)
        if (this.index !== index) {
            if (this.index < index) {
                index += 1
            }
            await chrome.bookmarks.move(this.id, { index: index })
            await this.reload()
        }
    }
}

import Bookmark from './bookmark.js'
import Folder from './folder.js'