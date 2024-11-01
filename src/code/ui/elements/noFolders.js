import { BookmarkElement } from "./bookmark.js";

export class NoFoldersElement extends BookmarkElement {
    constructor() {
        super({});
        this.id = 'empty';
    }

    async _ondisplay(root) {
        root.innerHTML = 'You don\'t have any bookmarks; create one now';
    }
}
customElements.define('bs-nobookmarks', NoFoldersElement)