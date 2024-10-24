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
            this.#_.applyData(folder.title)
        }
        this.#_.rebuild = (folder) => {
            this.#_.bookmarks = []
            for (const child of folder.children?.filter(c => c.url).sort(b => b.index) ?? []) {
                this.#_.bookmarks.push(new Bookmark(this, child))
            }
        }
        this.#_.applyData = (data) => {
            this.#_.data = {
                title: data || '',
                // TODO: how to store and retrieve these
                //icon: data.icon || '',
                //collapsed: !!data.collapsed,
                //favourite: !!data.favourite,
                //sortOrder: num(data.sortOrder)
            }
        }

        if (new.target === Folder) {
            this.#registered = 1
            this.#_.folder = folder
            this.#_.rebuild(folder)
            this.#_.applyData(folder)
        }
    }
    
    get readonly() { return true } // TODO: what can we edit?
    get immobile() { return true } // TODO: how can we store index?
    get fixed() { return true } // TODO: how can we store?

    get isExternal() { return this.#_.isExternal }
    get layout() { return this.#_.layout }
    get id() { return this.#_.folder.id }
    get index() { return this.#_.folder.index }
    get title() { return this.#_.folder.title }

    static async get(id, layout) {
        const folder = (await chrome.bookmarks.get(id))[0]
        if (folder) {
            folder.children = await chrome.bookmarks.getChildren(id)
            return new Folder(layout, folder)
        }
        return null
    }

    bookmarks = {
        count: () => this.#_.bookmarks.length,
        list: () => [...this.#_.bookmarks]

        // TODO: add?
        // TODO: create?
        // TODO: remove?
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
}

import Bookmark from './bookmark.js'