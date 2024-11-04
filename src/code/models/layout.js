/*
The Booksmart layout.
*/
export default class Layout {
    #storage
    #data

    onchange = () => { }

    static async load() {
        const layout = new Layout()
        await layout.reload()
        return layout
    }

    async reload() {
        this.#storage = await Storage.load()
        this.#applyData(this.#storage.data)
    }
    #applyData(data) {
        this.#data = {
            allowEdits: data.allowEdits !== false,
            backgroundImage: data.backgroundImage,
            columns: num(data.columns, 500),
            openExistingTab: data.openExistingTab !== false,
            openNewTab: !!data.openNewTab,
            showFavicons: data.showFavicons !== false,
            showTabList: !!data.showTabList,
            showTopSites: !!data.showTopSites,
            accentColour: data.accentColour?.length === 7 ? data.accentColour.toString() : '#4F4F78',
            wrapTitles: data.wrapTitles !== false
        }
    }

    get folders() { return this.#storage.folders }
    get id() { return this.#storage.rootId }
    get dataId() { return this.#storage.dataId }

    get accentColour() { return this.#data.accentColour }
    set accentColour(value) {
        if (/^#[0-9A-F]{6}$/i.test(value)) {
            this.#data.accentColour = value
        }
    }
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
    get themeAccent() { return [0, 0] } // TODO: DROP
    set themeAccent(value) { // DROP
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
        data.folders = (await this.folders.entries()).map(c => c.export())
        return data
    }
    async import(data) {
        if (!data || data['.booksmart']?.version !== 1) {
            console.error('Unsupported import version', data)
            return false
        }

        if (data['.booksmart'].content === 'folder') {
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

        const folders = await this.folders.entries()
        const bookmarks = folders.flatMap(c => c.bookmarks.list())
        async function applyFolderImport(folder, data) {
            folders.splice(folders.indexOf(folder), 1)
            folder.import(data)
            await folder.save()

            // Update bookmarks by ID and URL
            const unimportedBookmarks = []
            for (const importBookmark of data.bookmarks || []) {
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
                    bookmark = await folder.bookmarks.create(importBookmark.title, importBookmark.url)
                }
                bookmark.import(importBookmark)
                await bookmark.save()
            }
        }

        // Update folder by ID and title
        const unimportedFolders = []
        for (const importFolder of data.folders) {
            var folder = folders.find(c => c.id == importFolder.id && c.title == importFolder.title)
            if (folder) {
                await applyFolderImport(folder, importFolder)
            } else {
                unimportedFolders.push(importFolder)
            }
        }
        // Update folder by title, otherwise create
        for (const importFolder of unimportedFolders) {
            var folder = folders.find(c => c.title === importFolder.title)
            if (!folder) {
                folder = await this.folders.create(importFolder.title)
            }
            await applyFolderImport(folder, importFolder)
        }

        document.location.reload()
        return true
    }

    async save() {
        this.#data.tidy({
            allowEdits: true,
            columns: 500,
            backgroundImage: (v) => !v,
            openExistingTab: true,
            openNewTab: false,
            showFavicons: true,
            showTabList: false,
            showTopSites: false,
            accentColour: '#4F4F78',
            wrapTitles: true,
            bookmarks: null,
            folders: null
        })
        this.#storage.save(this.#data)
        this.#applyData(this.#data)
    }

    // TODO: subscribe to tab events to keep bookmarks up-to-date
}

import Storage from './storage.js'