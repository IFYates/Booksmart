/*
The collection layout.
*/
export default class Layout {
    #storage
    #data

    onchange = () => { }

    static async load() {
        const layout = new Layout()
        await layout.reload()
        if (!layout.collections.count()) {
            await layout.collections.create('My Bookmarks')
        }
        return layout
    }

    async reload() {
        this.#storage = await Storage.load()
        const data = this.#storage.data
        this.#data = {
            allowEdits: data.allowEdits !== false,
            backgroundImage: data.backgroundImage,
            columns: num(data.columns, 2),
            openExistingTab: data.openExistingTab !== false,
            openNewTab: !!data.openNewTab,
            showFavicons: data.showFavicons !== false,
            showTabList: !!data.showTabList,
            showTopSites: !!data.showTopSites,
            themeAccent: data.themeAccent ?? [240, 14],
            wrapTitles: data.wrapTitles !== false
        }
    }

    get collections() { return this.#storage.folders }

    get id() { return this.#storage.rootId }
    get dataId() { return this.#storage.dataId }
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

    async export() {
        const data = { ...this.#data }
        data['.booksmart'] = { version: 1, content: 'layout' }
        delete data.title
        data.folders = (await this.collections.entries()).map(c => c.export())
        return data
    }
    async import(data) {
        if (!data || data['.booksmart']?.version !== 1) {
            console.error('Unsupported import version', data)
            return false
        }

        if (data['.booksmart'].content === 'collection') {
            data = {
                folders: [data]
            }
        } else if (data['.booksmart'].content === 'layout') {
            this.#data = { ...data }
            this.save()
        } else {
            console.error('Unsupported import content', data)
            return false
        }

        const collections = await this.collections.entries()
        const bookmarks = collections.flatMap(c => c.bookmarks.list())
        async function applyCollectionImport(collection, data) {
            collections.splice(collections.indexOf(collection), 1)
            collection.import(data)
            await collection.save()

            // Update bookmarks by ID and URL
            const unimportedBookmarks = []
            for (const importBookmark of data.bookmarks) {
                var bookmark = bookmarks.find(b => b.id == importBookmark.id && b.url === importBookmark.url)
                if (bookmark) {
                    bookmarks.splice(bookmarks.indexOf(bookmark), 1)
                    bookmark.import(importBookmark)
                    await bookmark.save()
                } else {
                    unimportedBookmarks.push(importBookmark)
                }
            }
            // Update bookmarks by URL, otherwise create
            for (const importBookmark of unimportedBookmarks) {
                var bookmark = bookmarks.find(b => b.url === importBookmark.url)
                if (bookmark) {
                    bookmarks.splice(bookmarks.indexOf(bookmark), 1)
                } else {
                    bookmark = await collection.bookmarks.create(importBookmark.title, importBookmark.url)
                }
                bookmark.import(importBookmark)
                await bookmark.save()
            }
        }

        // Update collection by ID and title
        const unimportedCollections = []
        for (const importCollection of data.folders) {
            var collection = collections.find(c => c.id == importCollection.id && c.title == importCollection.title)
            if (collection) {
                await applyCollectionImport(collection, importCollection)
            } else {
                unimportedCollections.push(importCollection)
            }
        }
        // Update collection by title, otherwise create
        for (const importCollection of unimportedCollections) {
            var collection = collections.find(c => c.title === importCollection.title)
            if (!collection) {
                collection = await this.collections.create(importCollection.title)
            }
            await applyCollectionImport(collection, importCollection)
        }

        document.location.reload()
        return true
    }

    async save() {
        this.#data.keyTrim((v, k) => {
            switch (k) {
                case 'allowEdits':
                case 'openExistingTab':
                case 'showFavicons':
                case 'wrapTitles':
                    return v === false
                case 'backgroundImage':
                case 'openNewTab':
                case 'showTabList':
                case 'showTopSites':
                case 'themeAccent':
                case 'bookmarks':
                case 'folders':
                    return !!v
                case 'columns':
                    return v !== 2
            }
            return false
        })
        this.#storage.save(this.#data)
    }

    // TODO: subscribe to tab events to keep bookmarks up-to-date
}

import Storage from './storage.js'