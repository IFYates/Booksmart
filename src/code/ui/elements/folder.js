import { BaseHTMLElement, DropHandler, DragDropHandler } from "../../common/html.js"
import { BookmarkAddElement } from './bookmarkAdd.js'
import { BookmarkElement, } from './bookmark.js'
import Dialogs from '../dialogs.js'
import Emojis from "../../common/emojiHelpers.js"
import FontAwesome from "../../common/faHelpers.js"
import State from "../../models/state.js"

const template = document.createElement('template')
template.innerHTML = `
<h1>
    <i class="showHide fa-fw far fa-square-caret-down" title="Show"></i>
    <i class="showHide fa-fw far fa-square-caret-up" title="Hide"></i>
    <i class="icon fa-fw"></i>
    <img class="icon" style="display:none" />

    <span class="title"><!--$ title $--></span>

    <div class="actions">
        <i class="move fa-fw fas fa-arrow-up" title="Move up"></i>
        <i class="move fa-fw fas fa-arrow-down" title="Move down"></i>
        <i class="fa-fw fas fa-pen" title="Edit folder"></i>
    </div>

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

    // TODO: to model
    get iconType() {
        return !this.#folder.icon || this.#folder.icon.startsWith('chrome:')
            ? 'none'
            : FontAwesome.isFacon(this.#folder.icon) ? 'facon'
                : Emojis.isEmoji(this.#folder.icon) ? 'emoji'
                    : 'custom'
    }

    constructor(folder) {
        super(template, ['/code/styles/common.css', '/code/styles/folder.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
        this.#folder = folder
        this.id = 'folder-' + folder.id
    }

    setTheme() {
        const accentColour = this.#folder.accentColour
        MainView.setTheme(accentColour, this.shadowRoot.host)
        this.shadowRoot.host.style.backgroundColor = 'var(--theme-colour-shade)'
        this.shadowRoot.host.style.backgroundImage = this.#folder.backgroundImage ? `url(${this.#folder.backgroundImage})` : null
    }

    // TODO: to model
    get #bookmarks() {
        const result = [...this.#folder.bookmarks]
        const compareFavourite = (a, b) => (a.favourite ? 0 : 1) - (b.favourite ? 0 : 1)
        switch (Math.abs(this.sortOrder)) {
            default: // Manual
                result.sort((a, b) => compareFavourite(a, b) || a.index - b.index)
                break;
            case 1: // Alphabetic
                result.sort((a, b) => compareFavourite(a, b) || a.title.localeCompare(b.title))
                break;
            case 2: // Creation date
                result.sort((a, b) => compareFavourite(a, b) || a.dateAddedUtc - b.dateAddedUtc)
                break;
            case 3: // Clicks
                result.sort((a, b) => compareFavourite(a, b) || b.clicks - a.clicks || a.title.localeCompare(b.title))
                break;
            case 4: // Last click
                result.sort((a, b) => compareFavourite(a, b) || b.lastClick - a.lastClick)
                break;
        }
        if (this.sortOrder < 0) {
            result.reverse()
        }
        // TODO? this.#reindex(result)
        return result
    }

    onShowOrHide() { }

    async _ondisplay(root, host) {
        const self = this
        const folder = this.#folder
        const readonly = !State.options.allowEdits || folder.readonly

        // Replace templates
        var m
        while (m = BaseHTMLElement.TemplateRE.exec(root.innerHTML)) {
            root.innerHTML = String(root.innerHTML).replaceAll(m[0], folder[m[1]])
        }
        this.setTheme()

        // Show/hide
        this._apply('i.showHide', function () {
            this.show(!folder.fixed)
        })
        if (!folder.fixed) {
            root.querySelector('h1').onclick = async () => {
                folder.collapsed = !folder.collapsed
                this.onShowOrHide()
                await State.save()
                host.refresh()
            }
            this.classList.toggle('collapsed', !!folder.collapsed)
            this.classList.add('collapsable')
        }

        // Icon
        const faIcon = root.querySelector('i.icon')
        switch (this.iconType) {
            case 'custom':
                this._apply('img.icon', function () {
                    this.onload = () => {
                        faIcon.replaceWith(this)
                        this.style.display = ''
                    }
                    this.src = folder.icon
                })
                break;
            case 'emoji':
                faIcon.innerText = folder.icon
                break;
            case 'facon':
                faIcon.classList.add(...folder.icon.split(' '))
                break;
        }

        // Move
        const title = root.querySelector('h1')
        const attach = () => {
            const isFirst = !(self.previousElementSibling instanceof FolderElement)
            const isLast = self.nextElementSibling?.constructor.name !== 'FolderElement'
            root.querySelector('.actions>.move[title="Move up"]').show(!this.immobile && !isFirst)
            root.querySelector('.actions>.move[title="Move down"]').show(!this.immobile && !isLast)
            title.removeEventListener('mouseenter', attach)
        }
        title.addEventListener('mouseenter', attach)
        this._apply('.actions>.move', function () {
            this.onclick = (ev) => {
                ev.stopPropagation()

                const down = this.title === 'Move down'
                const [first, second] = !down ? [self, self.previousElementSibling] : [self.nextElementSibling, self]
                self.parentNode.insertBefore(first, second)
                first.refresh()
                second.refresh()

                self.reindexSiblings()
                State.save()
                return false
            }
        })

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
            for (const bookmark of this.#bookmarks) {
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

        // Bookmark dropping
        if (!readonly) {
            const drop = new DropHandler(host)
            drop.ondragover = (ev, state) => {
                const bookmark = state?.bookmark
                if (bookmark) {
                    if (bookmark.folderId === folder.id && folder.sortOrder !== 0) return // Cannot reorder non-manual folder
                    ev.preventDefault() // Can drop here
                    ev.dataTransfer.dropEffect = bookmark.folderId !== folder.id && (bookmark.readonly || ev.ctrlKey) ? 'copy' : 'move' // Can copy to another collection
                }
            }
            drop.ondrop = async (ev, state) => {
                var bookmark = state?.bookmark
                if (!bookmark || state.dropped) {
                    return
                }
                state.dropped = true

                // Place bookmark
                await state.element.moveTo(this, state.origin, bookmark.folderId !== folder.id && ev.ctrlKey)
                await State.save()
            }
        }
    }

    reindexBookmarks() {
        var idx = 0
        for (const bookmark of this.bookmarks) {
            bookmark.index = idx++
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