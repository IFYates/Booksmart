import EditFolderDialog from './dialog/editFolder.js'
import InfoDialog from './dialog/info.js'
import OptionsDialog from './dialog/options.js'

// TODO: obsolete
export default class Dialogs {
    static async info() { return await new InfoDialog().show() }
    static async newFolder() { return await new EditFolderDialog('New folder').show(null) }
    static async options() { return await new OptionsDialog().show() }
}