//import EditBookmarkDialog from './dialog/editBookmark.js'
import EditCollectionDialog from './dialog/editCollection.js'
//import InfoDialog from './dialog/info.js'
//import OptionsDialog from './dialog/options.js'

export default class Dialogs {
    static #newCollection = new EditCollectionDialog('New collection')
    static #editCollection = new EditCollectionDialog('Edit collection')

    //get editBookmark() { return EditBookmarkDialog }
    static async editCollection(collection) {
        return await this.#editCollection.show(collection, null)
    }
    static async newCollection(layout) {
        return await this.#newCollection.show(null, layout)
    }
    //get info() { return InfoDialog }
    //get options() { return OptionsDialog }
}