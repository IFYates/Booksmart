import { BaseHTMLElement } from "../../common/html.js"
import Dialogs from "../dialogs.js"

const template = document.createElement('template')
template.innerHTML = `
<a title="Add new folder">
    <i class="fa-fw fas fa-folder-plus"></i>
    <span style="margin:0 5px">New folder</span>
</a>
`

export class FolderAddElement extends BaseHTMLElement {
    constructor() {
        super(template, ['/styles/common.css', '/styles/bookmark.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
    }

    onclick() {
        Dialogs.newFolder().then(MainView.fullRefresh)
    }
}
customElements.define('bs-folder-add', FolderAddElement)