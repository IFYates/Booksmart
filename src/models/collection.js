/*
A collection of bookmarks.
*/
class Collection {
    #layout = null
    #folder = null
    #data = {
        title: '',
        clicks: 0,
        lastClick: 0,
        favourite: false
    }

    get id() { return this.#folder.id }
    get title() { return this.#data.title }
    get index() { return this.#folder.index }
    get dateAddedUtc() { return new Date(this.#folder.dataAdded) }
    get favourite() { return this.#data.favourite }

    colour = ''
    icon = ''
    description = ''
    dateAddedUtc = 0
    bookmarks = []
    sortOrder = 0 // 0: Manual, 1: Alphabetic, 2: Creation date, 3: Clicks (then alphabetic), 4 Last click, -ve = opposite

    constructor(layout, folder) {
        this.#layout = layout
        this.#folder = folder

        this.#apply(folder)

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
            const child = await chrome.bookmarks.create({
                parentId: this.#folder.id,
                title: JSON.stringify({ title: title }),
                url: url
            })
            const bookmark = new Bookmark(this, child)
            this.bookmarks.push(bookmark)
        }
        this.bookmarks.add = async (bookmark, index) => {
            if (bookmark.moveTo(this)) {
                return
            }

            const currentCollection = (await this.#layout.collections.list()).find(c => c.bookmarks.includes(bookmark))
            if (currentCollection) {
                currentCollection.bookmarks.splice(bookmark.index, 1)
            }

            if (typeof (index) == 'number') {
                index = Math.min(Math.max(0, index), this.bookmarks.length)
                this.bookmarks.splice(index, 0, bookmark)
            } else {
                this.bookmarks.push(bookmark)
            }
            await this.save()
        }
    }

    async delete() {
        await chrome.bookmarks.removeTree(this.id)
        await this.#layout.reload()
    }

    async save() {
        await chrome.bookmarks.update(this.id, {
            title: JSON.stringify(this.#data)
        })
    }

    async setIndex(index) {
        await this.#layout.collections.setIndex(this, index)
    }

    async setTitle(title) {
        this.#data.title = title
        await this.save()
    }

    async reload() {
        const folder = (await chrome.bookmarks.get(this.id))[0]
        folder.children = await chrome.bookmarks.getChildren(this.id)
        this.#apply(folder)
    }
    #apply(folder) {
        this.#folder = folder
        // this.colour = params.colour
        // this.icon = params.icon
        // this.description = params.description
        // this.dateAddedUtc = params.dateAddedUtc ?? new Date().getTime()
        // this.sortOrder = params.sortOrder | 0

        try {
            const data = JSON.parse(folder.title || '{}')
            this.#data.title = data.title
            this.#data.clicks = data.clicks | 0
            this.#data.lastClick = data.lastClick | 0
            this.#data.favourite = !!data.favourite
        } catch (e) {
            console.log(e)
        }

        this.bookmarks.splice(0, this.bookmarks.length)
        for (const child of folder.children?.filter(c => !Array.isArray(c.children)).sort(b => b.index) ?? []) {
            this.bookmarks.push(new Bookmark(this, child))
            // TODO: deep
        }
    }
}

import Bookmark from './bookmark.js'
export default Collection