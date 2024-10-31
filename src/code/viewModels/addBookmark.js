import { BaseHTMLElement, DropHandler } from "../common/html.js"
import Dialogs from '../ui/dialogs.js'
import MainView from "../ui/main.js"

const template = document.createElement('template')
template.innerHTML = `
<i class="fa-fw fas fa-plus"></i>
`

export class AddBookmarkElement extends BaseHTMLElement {
    #folder
    get folder() { return this.#folder }

    constructor(folder) {
        super(template, ['/code/styles/common.css', '/code/styles/bookmark.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
        this.#folder = folder
    }

    _ondisplay(root, host) {
        host.classList.add('add')
        host.title = 'Add bookmark'

        host.addEventListener('click', (ev) => {
            Dialogs.newBookmark(this.#folder).then(MainView.fullRefresh)
        })
        
        // ondragenter: function () {
        //     const bookmark = MainView.dragInfo?.bookmark
        //     if (bookmark && (bookmark.folderId !== folder.id || folder.sortOrder === 0)) {
        //         this.parentElement.insertBefore(MainView.dragInfo.element, this)
        //     }
        // }
    }
}
customElements.define('bs-bookmark-add', AddBookmarkElement)