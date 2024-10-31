/*
Abstracts away the Chrome bookmark storage, without understanding model data structures.
*/
export default class Storage {
    #dataId = -1
    #booksmartRootId = -1
    #data = {}

    static get Title() { return '(Booksmart)' }
    get rootId() { return this.#booksmartRootId }
    get dataId() { return this.#dataId }
    get data() {
        const data = { ...this.#data }
        delete data.bookmarks
        delete data.folders
        return data
    }

    static async load() {
        const tree = (await chrome.bookmarks.getTree())[0].children

        const bookmarkRoot = tree.find(b => b.title === 'Bookmarks')
        const booksmartRoot = bookmarkRoot.children.find(b => b.title === Storage.Title)
            || await chrome.bookmarks.create({ parentId: bookmarkRoot.id, title: Storage.Title })
        bookmarkRoot.children.push(booksmartRoot)

        const hiddenRoot = tree.find(b => b.title === 'Other bookmarks')
        const dataItem = hiddenRoot.children.find(b => b.title.startsWith(Storage.Title))
            || await chrome.bookmarks.create({ parentId: hiddenRoot.id, title: `${Storage.Title}{}` })

        return new Storage(dataItem, bookmarkRoot, booksmartRoot)
    }

    constructor(dataItem, bookmarkRoot, booksmartRoot) {
        this.#dataId = dataItem.id
        this.#booksmartRootId = booksmartRoot.id
        this.#parseData(dataItem.title)
        this.#cacheTree(bookmarkRoot)
        delete this.#data.folders[booksmartRoot.id]

        // Booksmart children are always included
        for (const child of bookmarkRoot.children) {
            if (!child.url) {
                this.folders.add(child)
            }
        }
    }
    #parseData(data) {
        this.#data = tryParse(data.substring(Storage.Title.length))
        this.#data.bookmarks ??= {}
        this.#data.folders ??= {}
    }

    #cache = {}
    #cacheTree(tree) {
        this.#cache = {}
        cacheItem.call(this, tree, { bookmarks: { add: () => { } } })

        function cacheItem(item, folder) {
            for (const child of item.children) {
                if (child.url) {
                    if (this.#data.bookmarks.hasOwnProperty(child.id)) {
                        folder.bookmarks.add(this.#cacheAdd(child))
                    }
                } else {
                    if (this.#data.folders.hasOwnProperty(child.id)) {
                        cacheItem.call(this, child, this.#cacheAdd(child))
                    }
                }
            }
        }
    }
    #cacheAdd(item) {
        if (!this.#cache[item.id]) {
            this.#cache[item.id] = item.url
                ? new Bookmark(this.bookmarks, item, this.#data.bookmarks[item.id] ??= {})
                : new Folder(this.folders, item, this.#data.folders[item.id] ??= {}, item.parentId === this.#booksmartRootId)
        }
        return this.#cache[item.id]
    }
    async #cacheGet(id) {
        try {
            if (!this.#cache[id]) {
                const item = (await chrome.bookmarks.get(id))[0]
                if (!item) {
                    return null
                }
                if (!item.url) {
                    item.children = await chrome.bookmarks.getChildren(id)
                }
                this.#cacheAdd(item)
                this.#cacheTree(item)
            }
            return this.#cache[id]
        } catch {
            return null
        }
    }

    bookmarks = {
        create: async (folder, title, url) => {
            const item = await chrome.bookmarks.create({
                parentId: String(folder.id || num(folder)),
                title: title,
                url: url
            })
            this.#data.bookmarks[item.id] = {}
            await this.save()
            return this.#cacheAdd(item)
        },
        data: (id) => {
            return this.#data.bookmarks[id] ??= {}
        },
        delete: async (bookmark) => {
            await chrome.bookmarks.remove(bookmark.id)
            delete this.#data.bookmarks[bookmark.id]
            await this.save()
        },
        get: async (id) => {
            const bookmark = await this.#cacheGet(id)
            if (!bookmark) {
                if (this.#data.bookmarks[id]) {
                    delete this.#data.bookmarks[id]
                }
                return null
            }
            return bookmark
        },
        save: async (bookmark) => {
            const item = await chrome.bookmarks.update(bookmark.id, {
                title: bookmark.title,
                url: bookmark.url
            })

            if (item.parentId !== bookmark.folderId || item.index !== bookmark.index) {
                await chrome.bookmarks.move(bookmark.id, {
                    parentId: bookmark.folderId,
                    index: bookmark.index
                })
            }

            const dataItem = (await chrome.bookmarks.get(this.#dataId))[0]
            this.#parseData(dataItem.title)
            this.#data.bookmarks[bookmark.id] = bookmark.export(false)
            await this.save()
        }
    }

    folders = {
        bookmarks: this.bookmarks,
        ids: () => Object.keys(this.#data.folders),
        count: () => Object.keys(this.#data.folders).length,
        add: async (folder) => {
            if (!folder.url) {
                this.#data.folders[folder.id] ??= {}
                await this.save()
                return this.#cacheAdd(folder)
            }
        },
        create: async (title) => {
            const folder = await chrome.bookmarks.create({
                parentId: this.#booksmartRootId,
                title: title
            })
            return await this.folders.add(folder)
        },
        data: async (id) => {
            return this.#data.folders[id] ??= {}
        },
        delete: async (folder) => {
            delete this.#data.folders[folder.id]
            await chrome.bookmarks.removeTree(folder.id)
            await this.save()
        },
        get: async (id) => {
            if (num(id, null) === null || id == this.#booksmartRootId) {
                return null
            }

            const folder = await this.#cacheGet(id)
            if (!folder) {
                if (this.#data.folders[id]) {
                    delete this.#data.folders[id]
                }
                return null
            }

            if (folder.bookmarks.length) {
                folder.bookmarks[0].isFirst = true
                folder.bookmarks[entries.length - 1].isLast = true
            }
            return folder
        },
        entries: async () => {
            // Build data
            const entries = []
            for (const id of Object.keys(this.#data.folders)) {
                const folder = await this.folders.get(id)
                if (folder) {
                    entries.push(folder)
                }
            }

            // Ensure order
            entries.sort((a, b) => a.index - b.index)
            var changed = false
            for (const [index, folder] of entries.entries()) {
                if (folder.index !== index) {
                    folder.index = index
                    this.#data.folders[folder.id].index = index
                    changed = true
                }
            }
            if (changed) {
                await this.save()
            }

            if (entries.length) {
                entries[0].isFirst = true
                entries[entries.length - 1].isLast = true
            }
            return entries
        },
        remove: async (folder) => {
            delete this.#data.folders[folder.id]
            await this.save()
        },
        save: async (folder) => {
            const item = await chrome.bookmarks.update(folder.id, {
                title: folder.title
            })

            if (item.parentId !== folder.parentId) {
                await chrome.bookmarks.move(folder.id, {
                    parentId: folder.parentId
                })
            }
            if (isNaN(folder.index)) {
                folder.index = Object.entries(this.#data.folders).map(f => num(f[1].index)).reduce((a, b) => Math.max(a, b)) + 1
            }

            const dataItem = (await chrome.bookmarks.get(this.#dataId))[0]
            this.#parseData(dataItem.title)
            this.#data.folders[folder.id] = folder.export(false)
            await this.save()
        }
    }

    async save(data) {
        if (data) {
            data = { ...data }
            data.bookmarks = this.#data.bookmarks
            data.folders = this.#data.folders
            this.#data = data
        }
        await chrome.bookmarks.update(this.#dataId, {
            title: Storage.Title + JSON.stringify(this.#data)
        })
    }
}

import Bookmark from './bookmark.js'
import Folder from './folder.js'