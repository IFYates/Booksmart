import './icon.js'
import "../../common/emojiHelpers.js"
import "../../common/faHelpers.js"

import { BaseHTMLElement, DragDropHandler } from "../../common/html.js"
import { BookmarkAddElement } from './bookmarkAdd.js'
import { BookmarkElement, } from './bookmark.js'
import Dialogs from '../dialogs.js'
import State from "../../models/state.js"

const template = document.createElement('template')
template.innerHTML = `
<h1>
    <i class="showHide fa-fw far fa-square-caret-down" title="Show"></i>
    <i class="showHide fa-fw far fa-square-caret-up" title="Hide"></i>
    <bs-icon></bs-icon>
    
    <span class="title"><!--$ title $--></span>
    
    <div class="actions">
        <i class="move fa-fw fas fa-arrow-up" title="Move up"></i>
        <i class="move fa-fw fas fa-arrow-down" title="Move down"></i>
        <i class="fa-fw fas fa-pen" title="Edit folder"></i>
    </div>

    <div class="tags"></div>
    
    <i class="action fa-fw fas fa-folder" title="This is a folder from your browser bookmarks" style="display:none"></i>
</h1>
<!-- Bookmarks -->
`

export class FolderElement extends BaseHTMLElement {
    #folder
    get folder() { return this.#folder }
    get immobile() { return !State.options.allowEdits || this.#folder.immobile || this.#folder.readonly }

    get index() { return this.#folder.index }
    set index(value) { this.#folder.index = num(value) }

    get bookmarks() { return [...this.shadowRoot.children].filter(c => c instanceof BookmarkElement) }

    constructor(folder) {
        super(template, ['/styles/common.css', '/styles/folder.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
        this.#folder = folder
        this.id = 'folder-' + folder.id
    }

    setTheme() {
        const accentColour = this.#folder.accentColour
        MainView.setTheme(accentColour, this.shadowRoot.host)
        this.shadowRoot.host.style.backgroundColor = accentColour || State.options.backgroundImage ? 'var(--theme-colour-shade)' : 'rgb(0, 0, 0, 0.1)'
        this.shadowRoot.host.style.backgroundImage = this.#folder.backgroundImage ? `url(${this.#folder.backgroundImage})` : null
    }

    onShowOrHide() {
        State.updateEntry(this.#folder)
    }

    applyTags() {
        const folder = this.#folder
        if (num(folder.id) == folder.id) {
            const visible = folder.tags.length
                ? folder.tags.some(t => t.visible)
                : State.options.tags.find(t => t.id == 0).visible
            this.shadowRoot.host.style.display = !visible ? 'none' : ''
        }
    }

    async _ondisplay(root, host) {
        const self = this
        const folder = this.#folder
        const readonly = !State.options.allowEdits || folder.readonly

        host.style.gridRow = folder.height > 1 ? `span ${folder.height}` : ''
        host.style.gridColumn = folder.width > 1 ? `span ${folder.width}` : ''
        host.style.zoom = ((folder.scale || 100) != 100) ? `${folder.scale}%` : ''

        // Replace templates
        root.innerHTML = BaseHTMLElement.replaceTemplates(root.innerHTML, folder)
        this.setTheme()

        // Show/hide
        this._apply('i.showHide', function () {
            this.show(!folder.fixed)
        })
        if (!folder.fixed) {
            root.querySelector('h1').onclick = async () => {
                folder.collapsed = !folder.collapsed
                this.onShowOrHide()
                this.refresh()
            }
            this.classList.toggle('collapsed', !!folder.collapsed)
            this.classList.add('collapsable')
        }

        // Icon
        root.querySelector('bs-icon').value = folder.icon

        // Move
        const title = root.querySelector('h1')
        const attach = () => {
            const isFirst = !(self.previousElementSibling instanceof FolderElement)
            const isLast = self.nextElementSibling?.constructor.name != 'FolderElement'
            root.querySelector('.actions>.move[title="Move up"]').show(!this.immobile && !isFirst)
            root.querySelector('.actions>.move[title="Move down"]').show(!this.immobile && !isLast)
            title.removeEventListener('mouseenter', attach)
        }
        title.addEventListener('mouseenter', attach)
        this._apply('.actions>.move', function () {
            this.onclick = (ev) => {
                ev.stopPropagation()

                const down = this.title == 'Move down'
                const [first, second] = !down ? [self, self.previousElementSibling] : [self.nextElementSibling, self]
                self.parentNode.insertBefore(first, second)
                first.refresh()
                second.refresh()

                self.reindexSiblings()
                State.save()
                return false
            }
        })

        // Tags
        this.applyTags()
        const tagList = root.querySelector('.tags')
        tagList.clearChildren()
        for (const tag of folder.tags || []) {
            tagList.add('span', { className: 'tag', style: `background-color: ${tag.colour}`, title: tag.name })
        }

        // Edit
        this._apply('i.fa-pen', function () {
            this.show(!readonly)
            this.onclick = (ev) => {
                ev.stopPropagation()
                Dialogs.editFolder(folder).then(MainView.fullRefresh)
            }
        })
        if (!folder.isOwned) {
            root.querySelector('.actions').style.right = '25px'
            this._apply('i.fa-folder', function () {
                this.style.display = ''
                this.onclick = (ev) => {
                    ev.stopPropagation()
                    Dialogs.importBookmarks().then(MainView.fullRefresh)
                }
            })
        }

        // Bookmarks
        if (!folder.collapsed) {
            const bookmarks = folder.getBookmarks ? folder.getBookmarks() : folder.bookmarks
            for (const bookmark of bookmarks) {
                root.appendChild(bookmark instanceof BookmarkElement ? bookmark : new BookmarkElement(bookmark))
            }

            if (!readonly) {
                root.appendChild(new BookmarkAddElement(folder))
            }
        }

        // Collection dragging
        if (!this.immobile) {
            const drag = new DragDropHandler(root.querySelector('h1'))
            drag.ondragstart = (ev) => {
                ev.stopPropagation()
                ev.dataTransfer.effectAllowed = 'move'
                host.style.opacity = 0.5 // TODO: class
                MainView.elTrash.classList.add('active') // TODO: through global style?
                return { folder: folder, element: this, origin: this.nextSibling }
            }
            drag.ondragend = (ev, state) => {
                if (state && !state.dropped) {
                    state.origin.parentElement.insertBefore(this, state.origin)
                }
                host.style.opacity = null // TODO: class
                MainView.elTrash.classList.remove('active') // TODO: through global style?
            }
            drag.ondragenter = (ev, state) => {
                if (state?.folder && this !== state.element) {
                    const startIndex = Array.prototype.indexOf.call(this.parentElement.children, state.element)
                    const targetIndex = Array.prototype.indexOf.call(this.parentElement.children, this)
                    if (startIndex < 0 || startIndex > targetIndex) {
                        this.parentElement.insertBefore(state.element, this)
                    } else {
                        this.insertAdjacentElement('afterend', state.element)
                    }
                }
            }
        }
    }

    reindexBookmarks() {
        var idx = 0
        for (const child of this.bookmarks) {
            child.bookmark.index = idx++
        }
        this.refresh()
    }

    reindexSiblings() {
        var idx = 0
        for (const folder of [...this.parentNode.children].filter(c => c instanceof FolderElement)) {
            folder.index = idx++
        }
    }
}
customElements.define('bs-folder', FolderElement)