/*
The collection layout.
*/
export default class Layout {
    #root = null
    #data = null
    #collections = []

    onchange = () => { }

    constructor(root) {
        this.#root = root
    }
    static async folder() {
        const tree = (await chrome.bookmarks.getTree())[0].children
        const layoutFolder = tree.find(b => b.title === 'Other bookmarks').children
            .find(b => b.title === LayoutTitle || b.title.includes(`"title":"${LayoutTitle}"`))
        if (!layoutFolder) {
            layoutFolder = await chrome.bookmarks.create({ title: LayoutTitle })
        }
        return layoutFolder
    }
    static async load() {
        const root = await Layout.folder()
        const layout = new Layout(root)
        await layout.#apply()
        if (!layout.collections.length) {
            await layout.collections.create('First collection')
        }
        return layout
    }
    async reload() {
        const root = await Layout.folder()
        this.#root = root
        await this.#apply()
    }
    async #apply() {
        const data = tryParse(this.#root.title, { title: this.#root.title })
        this.#applyData(data)

        this.#collections = []
        for (const child of this.#root.children?.filter(c => Array.isArray(c.children)) ?? []) {
            this.#collections.push(new Collection(this, child))
        }
        for (const [folderId, fdata] of Object.entries(this.#data.folders)) {
            const folder = await Folder.get(folderId, this, fdata)

            // Remove missing folders
            if (!folder) {
                delete this.#data.folders[folderId]
            }

            if (!fdata.hidden) {
                this.#collections.push(folder)
            }
        }
    }
    #applyData(data) {
        this.#data = {
            title: LayoutTitle, // To find it later
            allowEdits: data.allowEdits !== false,
            backgroundImage: data.backgroundImage,
            columns: num(data.columns, 2),
            openExistingTab: data.openExistingTab !== false,
            openNewTab: !!data.openNewTab,
            showFavicons: data.showFavicons !== false,
            showTabList: !!data.showTabList,
            showTopSites: !!data.showTopSites,
            themeAccent: data.themeAccent ?? [240, 14],
            wrapTitles: data.wrapTitles !== false,
            folders: data.folders ?? {}
        }
    }

    get id() { return this.#root.id }
    get allowEdits() { return this.#data.allowEdits }
    set allowEdits(value) { this.#data.allowEdits = !!value }
    get backgroundImage() { return this.#data.backgroundImage }
    set backgroundImage(value) { this.#data.backgroundImage = value }
    get columns() { return this.#data.columns }
    set columns(value) { this.#data.columns = num(value) }
    get openExistingTab() { return this.#data.openExistingTab }
    set openExistingTab(value) { this.#data.openExistingTab = !!value }
    get openNewTab() { return this.#data.openNewTab }
    set openNewTab(value) { this.#data.openNewTab = !!value }
    get showFavicons() { return this.#data.showFavicons }
    set showFavicons(value) { this.#data.showFavicons = !!value }
    get showTabList() { return this.#data.showTabList }
    set showTabList(value) { this.#data.showTabList = !!value }
    get showTopSites() { return this.#data.showTopSites }
    set showTopSites(value) { this.#data.showTopSites = !!value }
    get themeAccent() { return [...this.#data.themeAccent] }
    set themeAccent(value) {
        if (value instanceof Array && value.length == 2 && num(value[0], -1) > -1 && num(value[1], -1) > -1) {
            this.#data.themeAccent = value
        }
    }
    get wrapTitles() { return this.#data.wrapTitles }
    set wrapTitles(value) { this.#data.wrapTitles = !!value }

    async save() {
        await chrome.bookmarks.update(this.id, {
            title: JSON.stringify(this.#data)
        })
    }

    #collectionProto
    get collections() {
        if (!this.#collectionProto) {
            this.#collectionProto = Object.create(Array.prototype);
            this.#collectionProto.create = async (title) => {
                const child = await chrome.bookmarks.create({
                    parentId: this.#root.id,
                    title: JSON.stringify({ title: title })
                })
                const collection = new Collection(this, child)
                this.#collections.push(collection)
                return collection
            }
        }
        const arr = [...this.#collections].sort((a, b) => a.index - b.index)
        Object.setPrototypeOf(arr, this.#collectionProto);
        return arr
    }

    get folders() {
        return {
            remove: async (folder) => {
                const id = num(folder, folder?.id)
                if (id && this.#data.folders.hasOwnProperty(id)) {
                    if (!Object.keys(this.#data.folders[id])) {
                        delete this.#data.folders[id]
                    } else {
                        this.#data.folders[id].hidden = true
                    }
                    await this.save()
                }
            },
            show: async (folder) => {
                const id = num(folder, folder?.id)
                if (id) {
                    if (!this.#data.folders.hasOwnProperty(id)) {
                        this.#data.folders[id] = {}
                    } else if (this.#data.folders[id].hidden) {
                        delete this.#data.folders[id].hidden
                    }
                    await this.save()
                }
            }
        }
    }

    export() {
        const data = { ...this.#data }
        data['.booksmart.version'] = 1
        data['.booksmart.content'] = 'layout'
        delete data.title
        data.collections = this.#collections.map(c => c.export())
        return data
    }
    async import(data) {
        if (!data || data['.booksmart.version'] !== 1) {
            console.error('Unsupported import version', data)
            return false
        }

        if (data['.booksmart.content'] === 'collection') {
            data = {
                collections: [data]
            }
        } else if (data['.booksmart.content'] === 'layout') {
            this.#applyData(data)
            this.save()
        } else {
            console.error('Unsupported import content', data)
            return false
        }

        const bookmarks = this.#collections.flatMap(c => c.bookmarks.list())
        const collections = [...this.#collections]
        async function applyCollectionImport(collection, data) {
            collections.splice(collections.indexOf(collection), 1)
            collection.import(data)
            await collection.save()

            // Update bookmarks by id
            const unimportedBookmarks = []
            for (const importBookmark of data.bookmarks) {
                var bookmark = bookmarks.find(b => b.id == importBookmark.id)
                if (bookmark) {
                    bookmarks.splice(bookmarks.indexOf(bookmark), 1)
                    bookmark.import(importBookmark)
                    await bookmark.moveTo(collection)
                    await bookmark.save()
                } else {
                    unimportedBookmarks.push(importBookmark)
                }
            }
            // Update bookmarks by url, otherwise create
            for (const importBookmark of unimportedBookmarks) {
                var bookmark = bookmarks.find(b => b.url == importBookmark.url)
                if (bookmark) {
                    bookmarks.splice(bookmarks.indexOf(bookmark), 1)
                    await bookmark.moveTo(collection)
                } else {
                    bookmark = await collection.bookmarks.create(importBookmark.title, importBookmark.url)
                }
                bookmark.import(importBookmark)
                await bookmark.save()
            }
        }

        // Update collection by id
        const unimportedCollections = []
        for (const importCollection of data.collections) {
            var collection = collections.find(c => c.id == importCollection.id)
            if (collection) {
                await applyCollectionImport(collection, importCollection)
            } else {
                unimportedCollections.push(importCollection)
            }
        }
        // Update collection by title, otherwise create
        for (const importCollection of unimportedCollections) {
            var collection = collections.find(c => c.title == importCollection.title)
            if (!collection) {
                collection = await this.collections.create(importCollection.title)
            }
            await applyCollectionImport(collection, importCollection)
        }

        document.location.reload()
        return true
    }
}

const LayoutTitle = '(Booksmart)'
import Collection from './collection.js'
import Folder from './folder.js'