import { BaseHTMLElement } from "../../common/html.js"
import Dialogs from '../dialogs.js'

const template = document.createElement('template')
template.innerHTML = `
<i class="fa-fw fas fa-plus"></i>
`

export class BookmarkAddElement extends BaseHTMLElement {
    #folder
    get folder() { return this.#folder }

    constructor(folder) {
        super(template, ['/code/styles/common.css', '/code/styles/bookmark.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
        this.#folder = folder
    }

    _ondisplay() {
        this.classList.add('add')
        this.title = 'Add bookmark'

        this.addEventListener('click', (ev) => {
            Dialogs.newBookmark(this.#folder).then(MainView.fullRefresh)
        })
    }
}
customElements.define('bs-bookmark-add', BookmarkAddElement)