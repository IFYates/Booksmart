/*
The collection layout.
*/
class Layout {
    #folder = null
    #collections = [] // Collections
    columns = 2 // Number of columns to display

    constructor(folder) {
        this.#apply(folder)
    }
    async reload() {
        const folder = await Layout.folder()
        this.#apply(folder)
    }
    #apply(folder) {
        // TODO: this.columns = params?.columns ?? 2
        this.#folder = folder

        this.#collections.splice(0, this.#collections.length)
        for (const child of folder.children.filter(c => Array.isArray(c.children))) {
            this.#collections.push(new Collection(this, child))
            // TODO: deep?
        }        
    }

    static async folder() {
        const tree = (await chrome.bookmarks.getTree())[0].children
        var layoutFolder = tree.find(b => b.title === 'Other bookmarks').children.find(b => b.title === LayoutTitle)
        if (!layoutFolder) {
            layoutFolder = await chrome.bookmarks.create({ title: LayoutTitle })
        }
        return layoutFolder
    }
    static async load() {
        const layoutFolder = await Layout.folder()
        return new Layout(layoutFolder)
    }
    async save() {
        // TODO
    }

    nextCollectionId() {
        return this.#collections.length + 1
    }
    nextBookmarkId() {
        return this.#collections.length > 0 ? Math.max(...this.#collections.flatMap(c => c.bookmarks.length > 0 ? c.bookmarks.map(b => b.id) : 0)) + 1 : 1
    }

    collections = {
        create: async (title) => {
            const child = await chrome.bookmarks.create({
                parentId: this.#folder.id,
                title: JSON.stringify({ title: title })
            })
            const collection = new Collection(this, child)
            this.#collections.push(collection)
            return collection
        },

        list: async () => {
            const collections = []
            for (const collection of this.#collections) {
                collections.push(collection)
            }
            return collections
        },

        get: async (collectionId) => {
            var collection = this.#collections.find(c => c.id === collectionId)
            if (!collection) {
                collection = await Collection.load(this, collectionId)
                this.#collections.push(collection)
            }
            return collection
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

    async export() {
        return {
            _version: 1,
            columns: this.columns,
            collections: await this.collections.list()
        }
    }
    async import(data) {
        // TODO
    }
}

const LayoutTitle = '(Booksmart)'
import Collection from './collection.js'
export default Layout