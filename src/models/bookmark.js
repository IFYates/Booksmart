/*
A single bookmark.
*/
class Bookmark {
    #collection = null

    id = 0 // TODO: can drop?
    title = ''
    url = ''
    icon = ''
    dateAddedUtc = 0
    clicks = 0
    lastClick = 0
    favourite = false

    constructor(collection, params) {
        this.#collection = collection
        this.id = params.id
        this.title = params.title
        this.url = params.url
        this.icon = params.icon
        this.dateAddedUtc = params.dateAddedUtc ?? new Date().getTime()
        this.clicks = params.clicks | 0
        this.lastClick = 0
        this.favourite = params.favourite
    }

    click() {
        this.clicks += 1
        this.lastClick = new Date().getTime()
        this.#collection.save()
    }

    index() {
        return this.#collection.bookmarks.indexOf(this)
    }

    moveTo(collection) {
        if (this.#collection !== collection) {
            this.#collection = collection
            this.#collection.bookmarks.add(this)
            return true
        }
        return false
    }
}

export default Bookmark