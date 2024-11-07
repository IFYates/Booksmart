import Bookmark from "./bookmark.js"
import Folder from "./folder.js"
import Options from "./options.js"

export default class State {
    static get Title() { return '(Booksmart)' }

    static async init() {
        const tree = (await chrome.bookmarks.getTree())[0].children
        const bookmarkRoot = tree.find(b => b.title === 'Bookmarks')
        const hiddenRoot = tree.find(b => b.title === 'Other bookmarks')

        const everything = {}
        function flattenTree(item) {
            if (!item.url) {
                everything[item.id] = item
                item.children?.forEach(flattenTree)
            } else {
                everything[item.id] = item
            }
        }
        flattenTree(bookmarkRoot)

        const booksmartRoot = bookmarkRoot.children.find(b => b.title === State.Title)
            || await chrome.bookmarks.create({ parentId: bookmarkRoot.id, title: State.Title })
        State.#booksmartRootId = booksmartRoot.id

        const stateItem = hiddenRoot.children.find(b => b.title.startsWith(State.Title))
            || await chrome.bookmarks.create({ parentId: hiddenRoot.id, title: `${State.Title}{}` })
        State.#stateId = stateItem.id

        const state = tryParse(stateItem.title.substring(State.Title.length))
        state.bookmarks ??= {}
        state.folders ??= {}

        this.#options = new Options(state)

        // Ensure all Booksmart children included
        for (const child of booksmartRoot.children) {
            if (!child.url) {
                state.folders[child.id] ??= {}
            }
        }

        // Map all included folders
        for (const [id, data] of Object.entries(state.folders)) {
            if (everything[id]) {
                State.importFolder(everything[id], data, state.bookmarks)
            } else {
                delete state.folders[id]
            }
        }
    }

    static #stateId = -1
    static #booksmartRootId = -1
    static get booksmartRootId() { return State.#booksmartRootId }

    static #options // Options
    static get options() { return State.#options }
    static #folders = {} // id: Folder
    static get folders() { return State.#folders }
    static get folderCount() { return Object.keys(State.#folders).length }
    static #bookmarks = {} // id: Bookmark

    static async createBookmark(folder, title, url, data = {}) {
        if (!(folder instanceof Folder)) {
            folder = State.#folders[folder]
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
            parentId: this.#booksmartRootId,
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

    static async deleteFolder(folder) {
        if (folder.isOwned) {
            await chrome.bookmarks.removeTree(folder.id)
        }
        delete State.#folders[folder.id]
        await State.save()
    }

    static folder(id) {
        return State.#folders[id]
    }

    static importFolder(item, data = {}, bookmarkStore = null) {
        bookmarkStore ??= State.#bookmarks
        const folder = State.#folders[item.id] ??= new Folder(item, data)
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

    static #getData(standalone) {
        const state = State.#options.export()
        state.folders = Object.values(State.#folders).reduce((obj, f) => {
            obj[f.id] = f.export(standalone)
            delete obj[f.id]['.booksmart']
            return obj
        }, {})
        state.bookmarks = Object.values(State.#bookmarks).reduce((obj, b) => {
            obj[b.id] = b.export(standalone)
            return obj
        }, {})
        return state
    }

    static export() {
        const state = State.#getData(true)
        state['.booksmart'] = {
            version: 1,
            content: 'Booksmart'
        }

        for (const [id, data] of Object.entries(state.bookmarks)) {
            const bookmark = State.#bookmarks[id]
            const folder = state.folders[bookmark.folderId]
            if (folder) {
                folder.children ??= {}
                folder.children[id] = data
            }
        }

        delete state.bookmarks
        return state
    }

    static async import(data) {
        if (data['.booksmart']?.version != 1) {
            console.error('Unsupported version', data['.booksmart'])
            return
        }
        if (data['.booksmart']?.content === 'Folder') {
            // TODO
            return
        }
        if (data['.booksmart']?.content !== 'Booksmart') {
            return
        }

        State.#options.import(data)

        // Match existing folders by id and title
        const folders = { ...State.#folders }
        for (const [id, item] of Object.entries(data.folders)) {
            const folder = folders[id]
            if (folder?.title.localeCompare(item.title) === 0) {
                folder.import(item)
                await State.updateEntry(folder)
                delete data.folders[id]
                delete folders[id]
                await importBookmarks(folder, item.children)
            }
        }

        // Match existing folders by just title
        for (const [id, item] of Object.entries(data.folders)) {
            const folder = Object.values(folders).find(f => f.title.localeCompare(item.title) === 0)
            if (folder) {
                folder.import(item)
                await State.updateEntry(folder)
                delete data.folders[folder.id]
                await importBookmarks(folder, item.children)
            }
        }

        // Create new folders
        for (const [_, item] of Object.entries(data.folders)) {
            const folder = await State.createFolder(item.title, item)
            await importBookmarks(folder, item.children)
        }

        State.save()
        document.location.reload()

        async function importBookmarks(folder, bookmarks) {
            // Match existing bookmarks by id and url
            const children = Object.values(State.#bookmarks).filter(b => b.folderId === folder.id)
                .reduce((obj, b) => obj[b.id] = b, {})
            for (const [id, item] of Object.entries(bookmarks)) {
                const bookmark = children[id]
                if (bookmark?.url.localeCompare(item.url) === 0) {
                    bookmark.import(item)
                    await State.updateEntry(bookmark)
                    delete bookmarks[id]
                    delete children[id]
                }
            }

            // Match existing bookmarks by just url
            for (const [id, item] of Object.entries(bookmarks)) {
                const bookmark = Object.values(children).find(b => b.url.localeCompare(item.url) === 0)
                if (bookmark) {
                    bookmark.import(item)
                    await State.updateEntry(bookmark)
                    delete bookmarks[bookmark.id]
                }
            }

            // Create new bookmarks
            for (const [_, item] of Object.entries(bookmarks)) {
                await State.createBookmark(folder.id, item.title, item.url, item)
            }
        }
    }

    static async save() {
        const state = State.#getData(false)
        await chrome.bookmarks.update(State.#stateId, { title: `${State.Title}${JSON.stringify(state)}` })
    }

    static async updateEntry(entry) {
        if (entry.url) {
            await chrome.bookmarks.update(entry.id, { title: entry.title, url: entry.url })
        } else {
            await chrome.bookmarks.update(entry.id, { title: entry.title })
        }
    }
}