import Bookmark from "./bookmark.js"
import Folder from "./folder.js"
import Options from "./options.js"

export default class State {
    static get Title() { return '(Booksmart)' }

    static async #getEverything() {
        const root = (await chrome.bookmarks.getTree())[0]
        const everything = {}
        function flattenTree(item) {
            if (item.id) {
                everything[item.id] = item
            }
            if (!item.url) {
                item.children?.forEach(flattenTree)
            }
        }
        flattenTree(root)
        return everything
    }

    static async init() {
        const everything = await State.#getEverything()
        const allItems = Object.values(everything)

        var booksmartRoot = Object.values(everything).find(b => b.title == State.Title && !b.url)
        if (!booksmartRoot) {
            const bookmarkRoot = Object.values(everything).find(b => b.parentId == 0 && b.title == 'Bookmarks' && !b.url)
                || Object.values(everything).find(b => b.parentId == 0 && b.title == 'Other bookmarks' && !b.url)
            if (!bookmarkRoot) {
                console.error('Unable to find viable root folder')
            }
            booksmartRoot = await chrome.bookmarks.create({
                parentId: bookmarkRoot.id,
                title: State.Title
            })
        }
        State.#booksmartRootId = booksmartRoot.id

        const keys = await chrome.storage.sync.getKeys()
        const state = await chrome.storage.sync.get(keys)
        State.#options = new Options(state.options || {})
        const folders = {}
        for (const key of keys.filter(k => k.startsWith('folder.'))) { // TODO: old: remove
            const id = key.substring(7)
            if (everything.hasOwnProperty(id) && !everything[id].url) {
                folders[id] = state[key]
            } else {
                delete state[key]
            }
        }
        for (const key of keys.filter(k => k.startsWith('folder:'))) {
            const uuid = key.split(':')
            const match = allItems.find(f => (f.id == uuid[1] || f.dateAdded == uuid[2]) && f.title.hashCode() == uuid[3] && !f.url)
            if (match) {
                folders[match.id] = state[key]
            } else {
                delete state[key]
            }
        }
        const bookmarks = {}
        for (const key of keys.filter(k => k.startsWith('bookmark.'))) { // TODO: old: remove
            const id = key.substring(9)
            if (everything.hasOwnProperty(id) && everything[id].url) {
                bookmarks[id] = state[key]
            } else {
                delete state[key]
            }
        }
        for (const key of keys.filter(k => k.startsWith('bookmark:'))) {
            const uuid = key.split(':')
            const match = allItems.find(b => (b.id == uuid[1] || b.dateAdded == uuid[2]) && b.url?.hashCode() == uuid[3])
            if (match) {
                bookmarks[match.id] = state[key]
            } else {
                delete state[key]
            }
        }

        // Ensure all Booksmart children included
        for (const child of booksmartRoot.children) {
            if (!child.url) {
                folders[child.id] ??= {}
            }
        }

        // Map all included folders
        for (const [id, data] of Object.entries(folders)) {
            if (everything[id]) {
                State.importFolder(everything[id], data, bookmarks)
            } else {
                delete folders[id]
            }
        }
    }

    static #booksmartRootId = -1
    static get booksmartRootId() { return State.#booksmartRootId }

    static #options // Options
    static get options() { return State.#options }
    static #folders = {} // id: Folder
    static get folders() { return State.#folders }
    static get folderCount() { return Object.keys(State.#folders).length }
    static #bookmarks = {} // id: Bookmark

    static async createBookmark(folder, title, url, data = {}) {
        const folderParam = folder
        if (!(folder instanceof Folder)) {
            folder = State.#folders[folder.id || folder]
        }
        if (!folder) {
            console.error('Unable to find existing folder', folderParam)
        }
        const item = await chrome.bookmarks.create({
            parentId: folder.id,
            title: title,
            url: url
        })
        const bookmark = new Bookmark(item, data)
        folder.bookmarks.push(bookmark)
        State.#bookmarks[bookmark.id] = bookmark
        return bookmark
    }

    static async createFolder(title, data = {}) {
        const item = await chrome.bookmarks.create({
            parentId: State.#booksmartRootId,
            title: title
        })
        const folder = new Folder(item, data)
        State.#folders[folder.id] = folder
        return folder
    }

    static async deleteBookmark(bookmark) {
        await chrome.bookmarks.remove(bookmark.id)
        const folder = State.#folders[bookmark.folderId]
        folder?.bookmarks.splice(folder.bookmarks.indexOf(bookmark), 1)
        delete State.#bookmarks[bookmark.id]
        await State.save()
    }

    static async removeFolder(folder, deleteOwned = null) {
        if (deleteOwned !== false && (deleteOwned === true || folder.isOwned)) {
            await chrome.bookmarks.removeTree(folder.id)
        }
        delete State.#folders[folder.id]
        await State.save()
    }

    static folder(id) {
        return State.#folders[id]
    }

    static importFolder(item, data = null, bookmarkStore = null) {
        bookmarkStore ??= State.#bookmarks
        const folder = State.#folders[item.id] ??= new Folder(item, data)
        if (data) {
            folder.import(data)
        }
        State.#folders[folder.id] = folder
        folder.bookmarks.splice(0, folder.bookmarks.length)
        for (const child of (item.children || []).filter(c => c.url)) {
            const bookmark = new Bookmark(child, bookmarkStore[child.id] ?? {})
            folder.bookmarks.push(bookmark)
            State.#bookmarks[child.id] = bookmark
        }
        return folder
    }

    static async moveBookmark(bookmark, folder) {
        if (!(folder instanceof Folder)) {
            folder = State.#folders[folder]
        }
        await chrome.bookmarks.move(bookmark.id, { parentId: folder.id })
    }

    static #getData() {
        const state = {
            options: State.#options.export()
        }
        for (const folder of Object.values(State.#folders)) {
            state[`folder:${folder.uuid}`] = folder.export(false)
        }
        for (const bookmark of Object.values(State.#bookmarks)) {
            state[`bookmark:${bookmark.uuid}`] = bookmark.export(false)
        }
        return state
    }

    static export() {
        const state = {
            '.booksmart': {
                version: 1,
                content: 'Booksmart'
            },
            options: State.#options.export(),
            folders: {}
        }
        for (const [id, folder] of Object.entries(State.#folders)) {
            state.folders[id] = folder.export(true)
        }
        return state
    }

    static async import(data) {
        if (data['.booksmart']?.version != 1) {
            console.error('Unsupported version', data['.booksmart'])
            return
        }
        if (data['.booksmart']?.content == 'Folder') {
            const folder = await State.createFolder(data.title, data)
            for (const child of data.children) {
                await State.createBookmark(folder, child.title, child.url, child)
            }
            await State.save()
            document.location.reload()
            return
        }
        if (data['.booksmart']?.content != 'Booksmart') {
            return
        }

        State.#options.import(data.options)

        const everything = Object.values(await State.#getEverything())
        const folders = everything.filter(e => !e.url).map(f => new Folder(f))
            .reduce((obj, f) => { obj[f.id] = f; return obj }, {})

        // Match existing folders by id and title
        for (const [id, item] of Object.entries(data.folders)) {
            const match = folders[id]
            if (match?.title.localeCompare(item.title) == 0) {
                const folder = await State.importFolder(match, item)
                await State.updateEntry(folder)
                delete data.folders[id]
                delete folders[folder.id]
                await importBookmarks(folder, item.children)
            }
        }

        // Match existing folders by just title
        for (const [id, item] of Object.entries(data.folders)) {
            const match = Object.values(folders).find(f => f.title.localeCompare(item.title) == 0)
            if (match) {
                const folder = await State.importFolder(match, item)
                await State.updateEntry(folder)
                delete data.folders[id]
                delete folders[folder.id]
                await importBookmarks(folder, item.children)
            }
        }

        // Create new folders
        for (const item of Object.values(data.folders)) {
            const folder = await State.createFolder(item.title, item)
            await importBookmarks(folder, item.children)
        }

        await State.save()
        document.location.reload()

        async function importBookmarks(folder, bookmarks) {
            // Match existing bookmarks by id and url
            const children = everything.filter(b => b.parentId == folder.id && b.url)
                .reduce((obj, b) => { obj[b.id] = new Bookmark(b); return obj }, {})
            for (const [id, item] of Object.entries(bookmarks)) {
                const bookmark = children[id]
                if (bookmark?.url.localeCompare(item.url) == 0) {
                    bookmark.import(item)
                    await State.updateEntry(bookmark)
                    delete bookmarks[id]
                    delete children[id]
                }
            }

            // Match existing bookmarks by just url
            for (const [id, item] of Object.entries(bookmarks)) {
                const bookmark = Object.values(children)
                    .find(b => b.url.localeCompare(item.url) == 0)
                if (bookmark) {
                    bookmark.import(item)
                    await State.updateEntry(bookmark)
                    delete bookmarks[id]
                    delete children[bookmark.id]
                }
            }

            // Create new bookmarks
            for (const item of Object.values(bookmarks)) {
                await State.createBookmark(folder.id, item.title, item.url, item)
            }
        }
    }

    static async reset() {
        await chrome.storage.sync.clear()
    }

    static async save() {
        const state = State.#getData(false)
        await chrome.storage.sync.set(state)
        const keys = await chrome.storage.sync.getKeys()
        for (const key of keys.filter(k => !state.hasOwnProperty(k))) {
            await chrome.storage.sync.remove(key)
        }
    }

    static async updateEntry(entry) {
        const data = entry.export?.call(entry, false)
        if (entry.url) {
            await chrome.bookmarks.update(entry.id, { title: entry.title, url: entry.url })
            await chrome.storage.sync.set({ [`bookmark.${entry.uuid}`]: data })
        } else {
            await chrome.bookmarks.update(entry.id, { title: entry.title })
            await chrome.storage.sync.set({ [`folder:${entry.uuid}`]: data })
        }
    }
}