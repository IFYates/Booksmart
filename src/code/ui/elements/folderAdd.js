import { BaseHTMLElement } from "../../common/BaseHTMLElement.js"
import Dialogs from "../dialogs.js"
import FontAwesome from "../../common/faHelpers.js"

const template = document.createElement('template')
template.innerHTML = `
<a title="Add new folder">
    <i class="fa-fw fas fa-folder-plus"></i>
    <span style="margin:0 5px">New folder</span>
</a>
`

export class FolderAddElement extends BaseHTMLElement {
    constructor() {
        super(template, [
            '/styles/common.css',
            '/styles/bookmark.css',
            FontAwesome.CSS
        ])
    }

    onclick() {
        Dialogs.newFolder().then(MainView.fullRefresh)
    }
}
customElements.define('bs-folder-add', FolderAddElement)