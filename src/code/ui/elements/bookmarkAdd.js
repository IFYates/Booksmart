import { BaseHTMLElement } from "../../common/BaseHTMLElement.js"
import IconProvider from "../../common/icons/IconProvider.js"
import EditBookmarkDialog from "../dialog/editBookmark.js"

const template = document.createElement('template')
template.innerHTML = `
<i class="fa-fw fas fa-plus"></i>
`

export class BookmarkAddElement extends BaseHTMLElement {
    #folder
    get folder() { return this.#folder }

    constructor(folder) {
        super(template, [
            '/styles/common.css',
            '/styles/bookmark.css',
            '/styles/bookmark.grid.css',
            ...IconProvider.CSS
        ])
        this.#folder = folder
        this.title = 'Add bookmark'
    }

    onclick() {
        new EditBookmarkDialog('New bookmark')
            .show(null, this.#folder)
            .then(MainView.fullRefresh)
    }
}
customElements.define('bs-bookmark-add', BookmarkAddElement)