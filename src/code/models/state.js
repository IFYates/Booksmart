import Bookmark from "./bookmark.js"
import Folder from "./folder.js"
import Options from "./options.js"

const IMAGE_CACHE_TTL = 604800000 // 7 days

var _booksmartRootId = -1

async function _getFullTree() {
    const root = (await chrome.bookmarks.getTree())[0]
    const fullTree = []
    function flattenTree(item) {
        if (item.id) {
            fullTree.push(item)
        }
        if (!item.url) {
            item.children?.forEach(flattenTree)
        }
    }
    flattenTree(root)
    return fullTree
}

// Must match at id and dateAdded, otherwise text (title / url)
// Prefer items in the Booksmart folder
function _findBestMatch(items, textGetter, id, dateAdded, hashCode) {
    function score(item) {
        const score = (item.id == id ? 2 : -1) // id
            + (item.dateAdded > 0 && item.dateAdded == dateAdded ? 1 : -1) // dateAdded
            + (textGetter(item)?.hashCode() == hashCode ? 3 : -2) // hash of item text
            + (item.parentId == _booksmartRootId ? 1 : 0) // Is Booksmart folder
        return score
    }

    return items.map(item => ({ item, v: score(item) }))
        .sort((a, b) => b.v - a.v)
        .find(f => f.v > 0)?.item
}

export default class State {
    static get Title() { return '(Booksmart)' }

    static async init() {
        const fullTree = await _getFullTree()
        var booksmartRoot = fullTree.find(b => b.title == State.Title && !b.url)
        if (!booksmartRoot) {
            const bookmarkRoot = fullTree.find(b => b.parentId == 0 && b.title == 'Bookmarks' && !b.url) // Chrome
                || fullTree.find(b => b.parentId == 0 && b.title == 'Other bookmarks' && !b.url) // Vivaldi
                || fullTree.find(b => b.parentId == 0 && b.title == 'Other favourites' && !b.url) || fullTree.find(b => b.parentId == 0 && b.title == 'Other favorites' && !b.url) // Edge
            if (!bookmarkRoot) {
                console.error('Unable to find viable root folder')
            }
            booksmartRoot = await chrome.bookmarks.create({
                parentId: bookmarkRoot.id,
                title: State.Title
            })
        }
        _booksmartRootId = booksmartRoot.id

        const state = await chrome.storage.sync.get()
        console.debug(state)
        const keys = Object.keys(state)
        State.#options = new Options(state.options || {})
        const folders = {}
        for (const key of keys.filter(k => k.startsWith('folder:'))) {
            const uuid = key.split(':')
            const match = _findBestMatch(fullTree, f => f.title, uuid[1], uuid[2], uuid[3])
            if (match) {
                folders[match.id] = state[key]
            } else {
                delete state[key]
            }
        }
        const bookmarks = {}
        for (const key of keys.filter(k => k.startsWith('bookmark:'))) {
            const uuid = key.split(':')
            const match = _findBestMatch(fullTree, b => b.url, uuid[1], uuid[2], uuid[3])
            if (match) {
                bookmarks[match.id] = state[key]
            } else {
                delete state[key]
            }
        }

        // Ensure all Booksmart children included
        for (const child of booksmartRoot.children || []) {
            if (!child.url) {
                folders[child.id] ??= {}
            }
        }

        // Map all included folders
        for (const [id, data] of Object.entries(folders)) {
            const folder = fullTree.find(f => f.id == id)
            if (folder) {
                State.importFolder(folder, data, bookmarks)
            } else {
                delete folders[id]
            }
        }
    }

    static get booksmartRootId() { return _booksmartRootId }

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
            parentId: _booksmartRootId,
            title: title
        })
        const folder = new Folder(item, data)
        State.#folders[folder.id] = folder
        return folder
    }

    static async deleteBookmark(bookmark) {
        await chrome.bookmarks.remove(bookmark.id)
        const folder = State.#folders[bookmark.folderId]
        folder?.bookmarks.remove(bookmark)
        delete State.#bookmarks[bookmark.id]
        await chrome.storage.sync.remove(bookmark.uuid)
    }

    static async removeFolder(folder, deleteOwned = null) {
        if (deleteOwned !== false && (deleteOwned === true || folder.isOwned)) {
            await chrome.bookmarks.removeTree(folder.id)
        }
        delete State.#folders[folder.id]
        await chrome.storage.sync.remove(folder.uuid)
    }

    static folder(id) {
        return State.#folders[id]
    }

    static importFolder(item, data = null, bookmarkStore = null) {
        bookmarkStore ??= State.#bookmarks
        const folder = State.#folders[item.id] ??= new Folder(item)
        if (data) {
            folder.import(data)
        }
        State.#folders[folder.id] = folder
        folder.bookmarks.clear()
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
            state[folder.uuid] = folder.export(false)
        }
        for (const bookmark of Object.values(State.#bookmarks)) {
            state[bookmark.uuid] = bookmark.export(false)
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

        const fullTree = await _getFullTree()
        const folders = fullTree.filter(e => !e.url).map(f => new Folder(f))

        // Match existing folders
        for (const [id, item] of Object.entries(data.folders)) {
            const match = _findBestMatch(folders, f => f.title, id, null, item.title.hashCode())
            if (match) {
                const folder = State.importFolder(match, item)
                await State.updateEntry(folder, false)
                delete data.folders[item.id || id]
                folders.remove(match)
                await importFolder(folder, item.children)
            }
        }

        // Create new folders
        for (const item of Object.values(data.folders)) {
            const folder = await State.createFolder(item.title, item)
            await importFolder(folder, item.children)
        }

        await State.save()
        document.location.reload()

        async function importFolder(folder, children) {
            // Match existing bookmarks (can only do by URL)
            const bookmarks = fullTree.filter(b => b.parentId == folder.id && b.url)
                .reduce((obj, b) => { obj[b.id] = new Bookmark(b); return obj }, {})
            for (const item of [...children]) {
                const bookmark = _findBestMatch(Object.values(bookmarks), b => b.url, -1, null, item.url.hashCode())
                if (bookmark) {
                    bookmark.import(item)
                    await State.updateEntry(bookmark, false)
                    children.remove(item)
                    delete bookmarks[bookmark.id]
                }
            }

            // Create new bookmarks
            for (const item of Object.values(children)) {
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

    static async updateEntry(entry, standalone = true) {
        const data = entry.export?.(false)
        try {
            await chrome.bookmarks.update(entry.id, { title: entry.title, url: entry.url })
        } catch (e) {
            console.error(e)
            const item = await chrome.bookmarks.get(entry.id)
            entry.title = item[0]?.title || entry.title
            if (entry.url) entry.url = item[0]?.url || entry.url
        }
        if (standalone) {
            await chrome.storage.sync.set({ [entry.uuid]: data })
        }
    }

    static async resolveCachedImage(img, url, force = false) {
        if (url?.startsWith('data:image/')) return url

        // Try from cache first
        const cached = !force ? (await chrome.storage.local.get(url))?.[url] : null
        const resultPromise = new Promise(async (resolve, reject) => {
            const now = new Date().getTime()
            if (cached?.expire > now && cached?.src) {
                // From cache

                // Check it isn't a disguised 404
                var failure = null
                if (isURL(cached.src)) {
                    await fetch('https://corsproxy.io/?url=' + encodeURIComponent(cached.src))
                        .then(data => failure = data.ok ? null : data)
                        .catch(e => failure = e)
                }
                if (failure) {
                    reject(failure)
                } else {
                    img.src = cached.src
                    resolve(cached.src)
                }
                return
            }

            img.showImageAsDataUrl(url)
                .then(r => {
                    if (r) {
                        try {
                            chrome.storage.local.set({ [url]: { src: r, expire: now + IMAGE_CACHE_TTL } })
                        } catch { }
                    }
                    resolve(r)
                })
                .catch(_ => {
                    const tomorrow = new Date()
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    tomorrow.setHours(0, 0, 0, 0)
                    chrome.storage.local.set({ [url]: { expire: tomorrow.getTime() } }) // Don't retry today
                    reject()
                })
        })
        return resultPromise
    }
}