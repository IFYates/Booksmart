/*
A single bookmark.
*/
class Bookmark {
    #collection = null
    #bookmark = null
    #data = {
        title: '',
        clicks: 0,
        lastClick: 0,
        favourite: false
    }

    get id() { return this.#bookmark.id }
    get title() { return this.#data.title }
    get url() { return this.#bookmark.url }
    get index() { return this.#bookmark.index }
    icon = ''
    get dateAddedUtc() { return new Date(this.#bookmark.dataAdded) }
    get clicks() { return this.#data.clicks }
    get lastClick() { return new Date(this.#data.lastClick) }
    get favourite() { return this.#data.favourite }

    constructor(collection, bookmark) {
        this.#collection = collection
        this.#bookmark = bookmark

        try {
            const data = JSON.parse(bookmark.title || '{}')
            this.#data.title = data.title
            this.#data.clicks = data.clicks | 0
            this.#data.lastClick = data.lastClick | 0
            this.#data.favourite = !!data.favourite
        } catch (e) {
            console.log(e)
        }

        // this.icon = params.icon
    }

    async click() {
        this.#data.clicks += 1
        this.#data.lastClick = new Date().getTime()
        await this.save()
    }

    async delete() {
        await chrome.bookmarks.remove(this.id)
        await this.#collection.reload()
    }

    moveTo(collection) {
        if (this.#collection !== collection) {
            this.#collection = collection
            this.#collection.bookmarks.add(this)
            return true
        }
        return false
    }

    async save() {
        await chrome.bookmarks.update(this.id, {
            title: JSON.stringify(this.#data),
            url: this.url
        })
    }

    async setFavourite(favourite) {
        this.#data.favourite = favourite
        await this.save()
    }

    async setIndex(index) {
        index = Math.min(Math.max(0, index), this.#collection.bookmarks.length)
        if (this.index !== index) {
            if (this.index < index) {
                index += 1
            }
            await chrome.bookmarks.move(this.id, { index: index })
            await this.#collection.reload()
        }
    }
}

export default Bookmark