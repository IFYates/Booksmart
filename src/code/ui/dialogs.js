import EditBookmarkDialog from './dialog/editBookmark.js'
import EditFolderDialog from './dialog/editFolder.js'
import ImportBookmarkDialog from './dialog/importBookmark.js'
import InfoDialog from './dialog/info.js'
import OptionsDialog from './dialog/options.js'

export default class Dialogs {
    static #editBookmark = new EditBookmarkDialog('Edit bookmark')
    static #editFolder = new EditFolderDialog('Edit folder')
    static #importBookmarks = new ImportBookmarkDialog()
    static #info = new InfoDialog()
    static #newBookmark = new EditBookmarkDialog('New bookmark')
    static #newFolder = new EditFolderDialog('New folder')
    static #options = new OptionsDialog()

    static async editBookmark(bookmark, folder) { return await this.#editBookmark.show(bookmark, folder) }
    static async editFolder(folder) { return await this.#editFolder.show(folder, null) }
    static async importBookmarks(layout) { return await this.#importBookmarks.show(layout) }
    static async info() { return await this.#info.show() }
    static async newBookmark(folder) { return await this.#newBookmark.show(null, folder) }
    static async newFolder(layout) { return await this.#newFolder.show(null, layout) }
    static async options(layout) { return await this.#options.show(layout) }
}