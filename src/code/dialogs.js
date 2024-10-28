import EditBookmarkDialog from './dialog/editBookmark.js'
import EditCollectionDialog from './dialog/editCollection.js'
import ImportBookmarkDialog from './dialog/importBookmark.js'
import InfoDialog from './dialog/info.js'
import OptionsDialog from './dialog/options.js'

export default class Dialogs {
    static #editBookmark = new EditBookmarkDialog('Edit bookmark')
    static #editCollection = new EditCollectionDialog('Edit collection')
    static #importBookmarks = new ImportBookmarkDialog()
    static #info = new InfoDialog()
    static #newBookmark = new EditBookmarkDialog('New bookmark')
    static #newCollection = new EditCollectionDialog('New collection')
    static #options = new OptionsDialog()

    static async editBookmark(bookmark, collection) { return await this.#editBookmark.show(bookmark, collection) }
    static async editCollection(collection) { return await this.#editCollection.show(collection, null) }
    static async importBookmarks(layout) { return await this.#importBookmarks.show(layout) }
    static async info() { return await this.#info.show() }
    static async newBookmark(collection) { return await this.#newBookmark.show(null, collection) }
    static async newCollection(layout) { return await this.#newCollection.show(null, layout) }
    static async options(layout) { return await this.#options.show(layout) }
}