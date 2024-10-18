/*
The collection layout.
*/
class Layout {
    #collections = [] // Collections

    collectionIds = [] // Collection IDs in manual order
    columns = 2 // Number of columns to display

    constructor(params) {
        this.collectionIds = params?.collectionIds || []
        this.columns = params?.columns ?? 2
    }

    static async load() {
        const data = await Storage.get('layout')
        return new Layout(data)
    }
    async save() {
        await Storage.set('layout', this)
    }

    nextCollectionId() {
        return this.collectionIds.length > 0 ? Math.max(...this.collectionIds) + 1 : 1
    }
    nextBookmarkId() {
        return this.#collections.length > 0 ? Math.max(...this.#collections.flatMap(c => c.bookmarks.length > 0 ? c.bookmarks.map(b => b.id) : 0)) + 1 : 1
    }

    collections = {
        create: async (title) => {
            const collection = new Collection(this, { id: this.nextCollectionId(), title: title })
            this.collectionIds.push(collection.id)
            this.#collections.push(collection)
            await collection.save()
            await this.save()
            return collection
        },

        list: async () => {
            const collections = []
            for (const collectionId of this.collectionIds) {
                collections.push(await this.collections.get(collectionId))
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
            index = Math.min(Math.max(0, index), this.collectionIds.length - 1)

            this.collectionIds = this.collectionIds.filter(id => id !== collection.id)
            this.collectionIds.splice(index, 0, collection.id)
            await this.save()
        },

        remove: async (collection) => {
            this.collectionIds = this.collectionIds.filter(id => id !== collection.id)
            this.#collections = this.#collections.filter(c => c !== collection)
            await this.save()
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

import Storage from './storage.js'
import Collection from './collection.js'
export default Layout