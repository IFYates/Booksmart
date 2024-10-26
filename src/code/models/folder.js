/*
A folder in the bookmarks hierarchy.
*/
export default class Folder {
    #_ = {}
    #registered = 0
    _share = () => !this.#registered++ ? this.#_ : undefined

    constructor(layout, folder) {
        this.#_.layout = layout
        this.#_.folder = folder
        this.#_.isExternal = folder.parentId !== layout.id

        this.#_.apply = (folder) => {
            this.#_.folder = folder
            this.#_.rebuild(folder)
            this.#_.applyData(folder.data)
        }
        this.#_.rebuild = (folder) => {
            this.#_.bookmarks = []
            for (const child of folder.children?.filter(c => c.url).sort(b => b.index) ?? []) {
                this.#_.bookmarks.push(new Bookmark(this, child))
            }
        }
        this.#_.applyData = (data) => {
            data.favourite = !!data.favourite
            data.icon = data.icon || ''
            data.index = num(data.index, 999)
            data.collapsed = !!data.collapsed
            data.sortOrder = num(data.sortOrder)
            data.title = data.title?.trim()
            this.#_.data = data
        }

        if (new.target === Folder) {
            this.#registered = 1
            this.#_.folder = folder
            this.#_.rebuild(folder)
            this.#_.applyData(folder.data)
        }
    }

    get isExternal() { return this.#_.isExternal }
    get isFolder() { return true }
    get layout() { return this.#_.layout }
    get id() { return this.#_.folder.id }
    get index() { return this.#_.data.index }
    get title() { return this.#_.folder.title }
    set title(value) { this.#_.data.title = value?.trim() }

    get collapsed() { return this.#_.data.collapsed }
    set collapsed(value) { this.#_.data.collapsed = !!value }
    get favourite() { return this.#_.data.favourite }
    set favourite(value) { this.#_.data.favourite = !!value }
    get icon() { return this.#_.data.icon }
    set icon(value) { this.#_.data.icon = value?.trim() }
    get sortOrder() { return this.#_.data.sortOrder } // 0: Manual, 1: Alphabetic, 2: Creation date, 3: Clicks (then alphabetic), 4 Last click, -ve = opposite
    set sortOrder(value) { this.#_.data.sortOrder = num(value) }

    static async get(id, layout, data) {
        try {
            const folder = (await chrome.bookmarks.get(id))[0]
            if (folder) {
                if (!data.hidden) {
                    folder.children = await chrome.bookmarks.getChildren(id)
                }
                folder.data = data
                return new Folder(layout, folder)
            }
        } catch {
        }
        return null
    }

    async delete() {
        await this.#_.layout.folders.remove(this)
        await this.#_.layout.reload()
    }

    async reload() {
        this.#_.folder = (await chrome.bookmarks.get(this.id))[0]
        this.#_.folder.children = await chrome.bookmarks.getChildren(this.id)
        this.#_.folder.data = tryParse(this.#_.folder.title, { title: this.#_.folder.title })
        this.#_.apply(this.#_.folder)
    }

    // TODO: change structure (like collections in layout)
    bookmarks = {
        count: () => this.#_.bookmarks.length,
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
        remove: (bookmark) => {
            const index = this.#_.bookmarks.indexOf(bookmark)
            if (index >= 0) {
                this.#_.bookmarks.splice(index, 1)
            }
        }
    }

    export(standalone) {
        const data = { ...this.#_.data }
        if (standalone) {
            data['.booksmart.version'] = 1
            data['.booksmart.content'] = 'folder'
        }
        data.id = this.id
        data.index = this.index
        data.bookmarks = this.#_.bookmarks.map(b => b.export())
        return data
    }

    async setIndex(index) {
        this.#_.data.index = (index - 1) + 0.5
        await this.#_.layout.save()
    }

    async save() {
        if (this.#_.data.title && this.#_.data.title !== this.#_.folder.title) {
            await chrome.bookmarks.update(this.#_.folder.id, { title: this.#_.data.title })
            this.#_.folder.title = this.#_.data.title
        }
        delete this.#_.data.title

        await this.#_.layout.save()
    }
}

import Bookmark from './bookmark.js'