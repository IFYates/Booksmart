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
        this.#data = {
            title: data.title || '',
            columns: num(data.columns, 2),
            allowEdits: data.allowEdits !== false,
            openExistingTab: data.openExistingTab !== false,
            openNewTab: !!data.openNewTab,
            showFavicons: data.showFavicons !== false,
            showTabList: !!data.showTabList,
            showTopSites: !!data.showTopSites
        }
        
        this.#collections = []
        for (const child of root.children?.filter(c => Array.isArray(c.children)) ?? []) {
            this.#collections.push(new Collection(this, child))
            // TODO: deep?
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
        delete data.title
        data.collections = this.#collections.map(c => c.export())
        data._version = 1
        return data
    }
    async import(data) {
        // TODO
    }
}

const LayoutTitle = '(Booksmart)'
import Collection from './collection.js'
export default Layout