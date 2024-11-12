import EditBookmarkDialog from './dialog/editBookmark.js'
import EditFolderDialog from './dialog/editFolder.js'
import ImportBookmarkDialog from './dialog/importBookmark.js'
import InfoDialog from './dialog/info.js'
import OptionsDialog from './dialog/options.js'
import TagsDialog from './dialog/TagsDialog.js'

export default class Dialogs {
    static async editBookmark(bookmark, folder) { return await new EditBookmarkDialog('Edit bookmark').show(bookmark, folder) }
    static async editFolder(folder) { return await new EditFolderDialog('Edit folder').show(folder, null) }
    static async importBookmarks() { return await new ImportBookmarkDialog().show() }
    static async info() { return await new InfoDialog().show() }
    static async newBookmark(folder) { return await new EditBookmarkDialog('New bookmark').show(null, folder) }
    static async newFolder() { return await new EditFolderDialog('New folder').show(null) }
    static async options() { return await new OptionsDialog().show() }
    static async tags() { return await new TagsDialog().show() }
}