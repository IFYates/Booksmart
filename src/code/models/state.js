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
            State.importFolder(everything[id], data, state.bookmarks)
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

    // TODO: import

    static export() {
        const state = State.#options.export()
        state.folders = Object.values(State.#folders).reduce((obj, f) => {
            obj[f.id] = f.export()
            return obj
        }, {})
        state.bookmarks = Object.values(State.#bookmarks).reduce((obj, b) => {
            obj[b.id] = b.export()
            return obj
        }, {})
        return state
    }

    static async save() {
        const state = State.export()
        console.log('save', state)
        await chrome.bookmarks.update(State.#stateId, { title: `${State.Title}${JSON.stringify(state)}` })
    }

    static async updateBookmark(bookmark) {
        await chrome.bookmarks.update(bookmark.id, { title: bookmark.title, url: bookmark.url })
    }
}