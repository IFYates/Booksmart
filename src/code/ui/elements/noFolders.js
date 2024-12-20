import Dialogs from "../dialogs.js";
import { BookmarkElement } from "./bookmark.js";

export class NoFoldersElement extends BookmarkElement {
    constructor() {
        super({});
        this.id = 'empty';
    }

    async _ondisplay(root) {
        root.innerHTML = 'You don\'t have any bookmark folders yet; add or create one now';
    }

    onclick() {
        Dialogs.newFolder().then(MainView.fullRefresh)
    }
}
customElements.define('bs-nobookmarks', NoFoldersElement)