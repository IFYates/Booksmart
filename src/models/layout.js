/*
The collection layout.
*/
class Layout {
    #root = null
    #data = null
    #collections = []

    onchange = () => { }

    constructor(root) {
        this.#apply(root)
    }
    async reload() {
        const root = await Layout.folder()
        this.#apply(root)
    }
    #apply(root) {
        this.#root = root

        const data = tryParse(root.title, { title: root.title })
        this.#applyData(data)
        
        this.#collections = []
        for (const child of root.children?.filter(c => Array.isArray(c.children)) ?? []) {
            this.#collections.push(new Collection(this, child))
            // TODO: deep?
        }
    }
    #applyData(data) {
        this.#data = {
            title: LayoutTitle, // To find it later
            columns: num(data.columns, 2),
            allowEdits: data.allowEdits !== false,
            openExistingTab: data.openExistingTab !== false,
            openNewTab: !!data.openNewTab,
            showFavicons: data.showFavicons !== false,
            showTabList: !!data.showTabList,
            showTopSites: !!data.showTopSites
        }
    }

    get id() { return this.#root.id }
    get columns() { return this.#data.columns }
    set columns(value) { this.#data.columns = num(value) }
    get allowEdits() { return this.#data.allowEdits }
    set allowEdits(value) { this.#data.allowEdits = !!value }
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

    static async folder() {
        const tree = (await chrome.bookmarks.getTree())[0].children
        console.log(tree)
        var layoutFolder = tree.find(b => b.title === 'Other bookmarks').children
            .find(b => b.title === LayoutTitle || b.title.includes(`"title":"${LayoutTitle}"`))
        if (!layoutFolder) {
            layoutFolder = await chrome.bookmarks.create({ title: LayoutTitle })
        }
        return layoutFolder
    }
    static async load() {
        const layoutFolder = await Layout.folder()
        var layout = new Layout(layoutFolder)
        if (!layout.collections.count()) {
            await layout.collections.create('First collection')
        }
        return layout
    }
    async save() {
        await chrome.bookmarks.update(this.id, {
            title: JSON.stringify(this.#data)
        })
    }

    collections = {
        count: () => this.#collections.length,

        create: async (title) => {
            const child = await chrome.bookmarks.create({
                parentId: this.#root.id,
                title: JSON.stringify({ title: title })
            })
            const collection = new Collection(this, child)
            this.#collections.push(collection)
            return collection
        },
        get: async (collectionId) => {
            var collection = this.#collections.find(c => c.id === collectionId)
            if (!collection) {
                collection = await Collection.load(this, collectionId)
                this.#collections.push(collection)
            }
            return collection
        },
        list: async () => {
            const collections = []
            for (const collection of this.#collections) {
                collections.push(collection)
            }
            return collections
        },
        setIndex: async (collection, index) => {
            index = Math.min(Math.max(0, index), this.#collections.length)
            if (collection.index !== index) {
                if (collection.index < index) {
                    index += 1
                }
                await chrome.bookmarks.move(collection.id, { index: index })
                await this.reload()
            }
        }
    }

    export() {
        const data = { ...this.#data }
        data['.booksmart.version'] = 1
        delete data.title
        data.collections = this.#collections.map(c => c.export())
        return data
    }
    async import(data) {
        if (!data || data['.booksmart.version'] !== 1) {
            console.error('Unsupported import version', data)
            return false
        }

        this.#applyData(data)
        this.save()

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
export default Layout