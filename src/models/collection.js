/*
A collection of bookmarks.
*/
class Collection {
    #layout = null

    id = 0
    title = ''
    colour = ''
    icon = ''
    description = ''
    dateAddedUtc = 0
    bookmarks = []
    sortOrder = 0 // 0: Manual, 1: Alphabetic, 2: Creation date, 3: Clicks (then alphabetic), 4 Last click, -ve = opposite

    constructor(layout, params) {
        this.#layout = layout
        this.id = params.id
        this.title = params.title
        this.colour = params.colour
        this.icon = params.icon
        this.description = params.description
        this.dateAddedUtc = params.dateAddedUtc ?? new Date().getTime()
        this.sortOrder = params.sortOrder | 0

        if (params.bookmarks) {
            for (const bookmark of params.bookmarks) {
                this.bookmarks.push(new Bookmark(this, bookmark))
            }
        }

        this.bookmarks.list = () => {
            var result = this.bookmarks.slice()
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
        }
        this.bookmarks.create = async (title, url) => {
            const bookmark = new Bookmark(this, { id: this.#layout.nextBookmarkId(), title: title, url: url })
            this.bookmarks.push(bookmark)
            await this.save()
        }
        this.bookmarks.add = async (bookmark, index) => {
            if (bookmark.moveTo(this)) {
                return
            }

            const currentCollection = (await this.#layout.collections.list()).find(c => c.bookmarks.includes(bookmark))
            if (currentCollection) {
                currentCollection.bookmarks.splice(bookmark.index(), 1)
            }

            if (typeof (index) == 'number') {
                index = Math.min(Math.max(0, index), this.bookmarks.length)
                this.bookmarks.splice(index, 0, bookmark)
            } else {
                this.bookmarks.push(bookmark)
            }
            await this.save()
        }
        this.bookmarks.remove = async (bookmark) => {
            this.bookmarks.splice(bookmark.index(), 1)
            await this.save()
        }
    }

    static async load(layout, id) {
        const data = await Storage.get(`collection:${id}`)
        return new Collection(layout, data)
    }
    async save() {
        await Storage.set(`collection:${this.id}`, this)
    }

    index() {
        return this.#layout.collectionIds.indexOf(this.id)
    }
}

import Storage from './storage.js'
import Bookmark from './bookmark.js'
export default Collection