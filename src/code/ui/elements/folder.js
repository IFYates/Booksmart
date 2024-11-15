import './icon.js'
import "../../common/emojiHelpers.js"
import "../../common/faHelpers.js"

import { BaseHTMLElement } from "../../common/BaseHTMLElement.js"
import DragDropHandler from "../../common/DragDropHandler.js"
import { BookmarkAddElement } from './bookmarkAdd.js'
import { BookmarkElement, } from './bookmark.js'
import State from "../../models/state.js"
import EditFolderDialog from '../dialog/editFolder.js'
import ImportBookmarkDialog from '../dialog/importBookmark.js'

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
`

export class FolderElement extends BaseHTMLElement {
    #folder
    get folder() { return this.#folder }
    get immobile() { return !State.options?.allowEdits || this.#folder.immobile || this.#folder.readonly }
    get readonly() { return this.classList.contains('readonly') || this.#folder.readonly }

    get index() { return this.#folder.index }
    set index(value) { this.#folder.index = num(value) }

    get bookmarks() { return this.shadowRoot.querySelectorAll(customElements.getName(BookmarkElement)) }

    constructor(folder) {
        super(template, ['/styles/common.css', '/styles/folder.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
        this.#folder = folder
        this.id = 'folder-' + folder.id

        document.body.on_class((cl) => this.#refreshStyles(cl))
    }

    #refreshStyles(cl) {
        const readonly = this.#folder.readonly || cl.includes('readonly')
        this.classList.toggle('readonly', readonly)
        this.bookmarks.forEach(el => el.classList.toggle('readonly', readonly))
        this.shadowRoot.querySelectorAll(customElements.getName(BookmarkAddElement)).forEach(el => el.classList.toggle('readonly', readonly))

        const tagId = cl.find(c => c.startsWith('tagging-'))?.substring(8)
        this.classList.toggle('tag-nodrop', !this.#folder.tags?.length ? tagId == 0 : this.#folder.tags.some(t => t.id == tagId))
    }

    setTheme() {
        const accentColour = this.#folder.accentColour
        MainView?.setTheme(accentColour, this.shadowRoot.host)
        this.shadowRoot.host.style.backgroundColor = accentColour || State.options?.backgroundImage ? 'var(--theme-colour-shade)' : 'rgb(0, 0, 0, 0.1)'
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
                : State.options.tags.find(t => t.id == 0)?.visible !== false
            this.shadowRoot.host.style.display = !visible ? 'none' : ''
        }
    }

    _prepareTemplate(template) {
        return BaseHTMLElement.replaceTemplates(template, this.#folder)
    }

    async _ondisplay(root, host) {
        const self = this
        const folder = this.#folder

        host.style.gridRow = folder.height > 1 ? `span ${folder.height}` : ''
        host.style.gridColumn = folder.width > 1 ? `span ${folder.width}` : ''
        host.style.zoom = ((folder.scale || 100) != 100) ? `${folder.scale}%` : ''

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
            this.onclick = (ev) => {
                ev.stopPropagation()
                new EditFolderDialog('Edit folder').show(folder, null)
                    .then(() => self.refresh())
            }
        })
        if (!folder.isOwned) {
            root.querySelector('.actions').style.right = '25px'
            this._apply('i.fa-folder', function () {
                this.style.display = ''
                this.onclick = (ev) => {
                    ev.stopPropagation()
                    new ImportBookmarkDialog().show()
                        .then(MainView.fullRefresh)
                }
            })
        }

        // Bookmarks
        if (!folder.collapsed) {
            const bookmarks = folder.getBookmarks ? folder.getBookmarks() : folder.bookmarks
            for (const bookmark of bookmarks) {
                root.appendChild(bookmark instanceof BookmarkElement ? bookmark : new BookmarkElement(bookmark))
            }

            root.appendChild(new BookmarkAddElement(folder))

            this.#refreshStyles([...document.body.classList])
        }

        // Collection dragging
        var sibling = null, dropped = false
        const drag = new DragDropHandler(root.querySelector('h1'))
        drag.ondragstart = (ev) => {
            if (this.readonly) {
                ev.preventDefault()
                return
            }

            ev.stopPropagation()
            ev.dataTransfer.effectAllowed = 'move'
            self.classList.add('dragging')
            document.body.classList.add('dragging')
            sibling = self.nextSibling
            dropped = false
        }
        drag.ondragend = () => {
            self.classList.remove('dragging')
            document.body.classList.remove('dragging')
            document.body.classList.remove('over-trash')

            if (!dropped) {
                if (sibling) {
                    self.parentElement.insertBefore(self, sibling)
                } else {
                    self.parentElement.appendChild(self)
                }
            }
        }

        // Trash drop
        drag.subscribeDrop((el) => !folder.readonly && el === MainView.elTrash, {
            ondragenter: () => {
                document.body.classList.add('over-trash')
            },
            ondragover: (ev) => {
                ev.preventDefault()
                ev.dataTransfer.dropEffect = 'move'
            },
            ondragleave: () => {
                document.body.classList.remove('over-trash')
            },
            ondrop: (ev) => {
                ev.stopPropagation()
                dropped = true
                self.remove()
                State.removeFolder(folder)
            }
        })

        // Collection reorder
        drag.subscribeDrop((el) => el === MainView.elLayout, {
            ondragover: (ev) => {
                ev.preventDefault()
                ev.dataTransfer.dropEffect = 'move'
            },
            ondrop: async (ev) => {
                ev.stopPropagation()
                dropped = true
                self.reindexSiblings()
                await State.save()
            }
        })
        drag.subscribeDrop((el) => el !== self && el instanceof FolderElement && !el.folder.immobile, {
            ondragenter: (ev) => {
                const startIndex = Array.prototype.indexOf.call(ev.target.parentElement.children, self)
                const targetIndex = Array.prototype.indexOf.call(ev.target.parentElement.children, ev.target)
                if (startIndex < 0 || startIndex > targetIndex) {
                    ev.target.parentElement.insertBefore(self, ev.target)
                } else {
                    ev.target.insertAdjacentElement('afterend', self)
                }
            }
        })
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