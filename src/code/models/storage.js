/*
Abstracts away the Chrome bookmark storage, without understanding model data structures.
*/
export default class Storage {
    #dataId = -1
    #bookmarkRootId = -1
    #data = {}

    static get Title() { return '(Booksmart)' }
    get rootId() { return this.#bookmarkRootId }
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

        const hiddenRoot = tree.find(b => b.title === 'Other bookmarks')
        const dataItem = hiddenRoot.children.find(b => b.title.startsWith(Storage.Title))
            || await chrome.bookmarks.create({ parentId: hiddenRoot.id, title: `${Storage.Title}{}` })

        return new Storage(dataItem, booksmartRoot)
    }

    constructor(dataItem, bookmarkRoot) {
        this.#dataId = dataItem.id
        this.#bookmarkRootId = bookmarkRoot.id
        this.#parseData(dataItem.title)

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

    async #getItem(id) {
        try {
            const item = (await chrome.bookmarks.get(id))[0]
            if (!item.url) {
                item.children = await chrome.bookmarks.getChildren(id)
            }
            return item
        } catch {
            return null
        }
    }

    bookmarks = {
        create: async (folder, title, url) => {
            const bookmark = await chrome.bookmarks.create({
                parentId: String(folder.id || num(folder)),
                title: title,
                url: url
            })
            this.#data.bookmarks[bookmark.id] = {}
            await this.save()
            return new Bookmark(this.bookmarks, bookmark, this.#data.bookmarks[bookmark.id])
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
            const item = await this.#getItem(id)
            if (!item) {
                if (this.#data.bookmarks[id]) {
                    delete this.#data.bookmarks[id]
                }
                return null
            }

            return new Bookmark(this.bookmarks, item, this.#data.bookmarks[id] ??= {})
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

            const dataItem = await this.#getItem(this.#dataId)
            this.#parseData(dataItem.title)
            this.#data.bookmarks[bookmark.id] = bookmark.export(false)
            await this.save()
        }
    }

    folders = {
        ids: () => Object.keys(this.#data.folders),
        count: () => Object.keys(this.#data.folders).length,
        add: async (folder) => {
            if (!folder.url) {
                this.#data.folders[folder.id] ??= {}
                await this.save()
                return new Folder(this.folders, folder, this.#data.folders[folder.id], folder.parentId === this.#bookmarkRootId)
            }
        },
        create: async (title) => {
            const folder = await chrome.bookmarks.create({
                parentId: this.#bookmarkRootId,
                title: title
            })
            return await this.folders.add(folder)
        },
        createBookmark: (folder, title, url) => this.bookmarks.create(folder, title, url),
        data: async (id) => {
            return this.#data.folders[id] ??= {}
        },
        delete: async (folder) => {
            delete this.#data.folders[folder.id]
            await chrome.bookmarks.removeTree(folder.id)
            await this.save()
        },
        get: async (id) => {
            const item = await this.#getItem(id)
            if (!item) {
                if (this.#data.folders[id]) {
                    delete this.#data.folders[id]
                }
                return null
            }

            const folder = new Folder(this.folders, item, this.#data.folders[id] ??= {}, item.parentId === this.#bookmarkRootId)

            for (const child of item.children) {
                const item = await this.bookmarks.get(child.id)
                if (item?.url) {
                    folder.bookmarks.add(item)
                }
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

            const dataItem = await this.#getItem(this.#dataId)
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