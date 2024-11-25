import './icon.js'
import "../../common/emojiHelpers.js"
import "../../common/faHelpers.js"

import { BaseHTMLElement } from "../../common/BaseHTMLElement.js"
import DragDropHandler from "../../common/DragDropHandler.js"
import { Tabs } from "../../common/tabs.js"
import State from "../../models/state.js"
import { FolderElement } from './folder.js'
import EditBookmarkDialog from '../dialog/editBookmark.js'
import { BookmarkAddElement } from './bookmarkAdd.js'

const template = document.createElement('template')
template.innerHTML = `
<a href="<!--$ url $-->" title="<!--$ url $-->">
    <bs-icon altIcon="far fa-bookmark"></bs-icon>

    <div class="favourite">
        <i class="fa-fw far fa-star" title="Pin"></i>
        <i class="fa-fw fas fa-star" title="Unpin"></i>
    </div>

    <span class="title"><!--$ title $--></span>

    <div class="actions">
        <i class="move fa-fw fas fa-arrow-up" title="Move up"></i>
        <i class="move fa-fw fas fa-arrow-down" title="Move down"></i>
        <i class="fa-fw fas fa-pen" title="Edit bookmark"></i>
    </div>
</a>
`

export class BookmarkElement extends BaseHTMLElement {
    #bookmark
    get bookmark() { return this.#bookmark }
    get folder() { return this.parentNode?.host.folder || this.#bookmark.folder }
    get parent() { return this.parentNode?.host }
    get readonly() { return this.#bookmark.readonly || this.parent.readonly }

    get index() { return this.#bookmark.index }
    set index(value) { this.#bookmark.index = num(value) }

    constructor(bookmark) {
        super(template, ['/styles/common.css', '/styles/bookmark.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
        this.#bookmark = bookmark
        this.id = 'bookmark-' + bookmark.id
        this.classList.add('grid') // TODO: option
    }

    onclick(ev) {
        this.#bookmark.click()

        if (!ev.ctrlKey && !ev.shiftKey && State.options.openExistingTab && this.#lastTab) {
            ev.stopPropagation()
            ev.preventDefault()
            this.#lastTab.focus()
            return true
        }
    }

    _prepareTemplate(template) {
        return BaseHTMLElement.replaceTemplates(template, this.#bookmark)
    }

    async _ondisplay(root, host) {
        const self = this
        const bookmark = this.#bookmark
        const folder = this.folder

        // Icon
        const icon = root.querySelector('bs-icon')
        icon.value = bookmark.icon
        icon.favDomain = State.options.showFavIcons ? bookmark.domain : null
        icon.onchange = () => {
            this.#bookmark.icon = icon.value
        }

        // Link
        this._apply('a', function () {
            this.target = State.options.openNewTab ? '_blank' : ''
        })
        this._apply('span.title', function () {
            this.classList.toggle('nowrap', !State.options.wrapTitles)
        })

        // Style
        host.classList.toggle('favourite', !!bookmark.favourite)

        // Favourite
        root.querySelector('.favourite>i[title="Pin"]').style.display = bookmark.favourite ? 'none' : ''
        root.querySelector('.favourite>i[title="Unpin"]').style.display = bookmark.favourite ? '' : 'none'
        root.querySelector('.favourite').onclick = (ev) => {
            ev.stopPropagation()
            bookmark.favourite = !bookmark.favourite
            State.save().then(() => host.parentNode.host.refresh())
            return false
        }

        // Move
        const attach = () => {
            const isFirst = !(self.previousElementSibling instanceof BookmarkElement) || self.previousElementSibling.bookmark.favourite
            const isLast = !(self.nextElementSibling instanceof BookmarkElement)
            this._apply('.actions>.move[title="Move up"]', (el) => el.style.display = isFirst ? 'none' : '')
            this._apply('.actions>.move[title="Move down"]', (el) => el.style.display = isLast ? 'none' : '')
            self.removeEventListener('mouseenter', attach)
        }
        self.addEventListener('mouseenter', attach)
        this._apply('.actions>.move', function () {
            this.onclick = (ev) => {
                ev.stopPropagation()

                const down = this.title == 'Move down'
                const [first, second] = !down ? [self, self.previousElementSibling] : [self.nextElementSibling, self]
                self.parentNode.insertBefore(first, second)
                first.refresh()
                second.refresh()

                self.parent.reindexBookmarks()
                State.save()
                return false
            }
        })

        // Edit
        this._apply('i[title="Edit bookmark"]', function () {
            this.onclick = (ev) => {
                ev.stopPropagation()
                new EditBookmarkDialog('Edit bookmark').show(bookmark, folder)
                    .then(() => host.parentNode.host.refresh())
                return false
            }
        })

        // Dragging
        var dragCopy = null
        const drag = new DragDropHandler(host)
        drag.ondragstart = (ev) => {
            ev.stopPropagation()

            dragCopy = new BookmarkElement(this.#bookmark)

            ev.dataTransfer.effectAllowed = this.readonly ? 'copy' : 'copyMove'
            self.classList.add('dragging')
            dragCopy.classList.add('dragging')
            if (!this.readonly) {
                document.body.classList.add('dragging')
            }
        }
        drag.ondragend = (ev) => {
            this.style.display = ''
            dragCopy?.remove()
            self.classList.remove('dragging')
            document.body.classList.remove('dragging')
            document.body.classList.remove('over-trash')
        }

        // Trash drop
        drag.subscribeDrop((el) => !this.readonly && el === MainView.elTrash, {
            ondragenter: () => {
                dragCopy.remove()
                document.body.classList.add('over-trash')
                self.style.display = 'none'
            },
            ondragover: (ev) => {
                ev.preventDefault()
                ev.dataTransfer.dropEffect = 'move'
            },
            ondragleave: () => {
                document.body.classList.remove('over-trash')
                self.style.display = ''
            },
            ondrop: (ev) => {
                ev.stopPropagation()
                self.remove()
                State.deleteBookmark(bookmark)
            }
        })

        // Bookmark move/reorder
        drag.subscribeDrop((el) => el instanceof FolderElement && !el.readonly, {
            ondragenter: (ev) => {
                if (bookmark.favourite || !ev.target.folder.bookmarks.length) {
                    // At start
                    const head = ev.target.shadowRoot.querySelector('h1')
                    head.insertAdjacentElement('afterend', dragCopy)
                } else {
                    // At end
                    const addButton = ev.target.shadowRoot.querySelector(customElements.getName(BookmarkAddElement))
                    ev.target.shadowRoot.insertBefore(dragCopy, addButton)
                }
            },
            ondragover: (ev) => {
                // Folder (other or manual sort)
                if (bookmark.folderId != ev.target.folder.id) {
                    ev.preventDefault() // Can drop here
                    ev.dataTransfer.dropEffect = this.readonly || ev.ctrlKey ? 'copy' : 'move' // Can copy to another collection
                }
                else if (ev.target.folder.sortOrder == 0) {
                    ev.preventDefault() // Can drop here
                    ev.dataTransfer.dropEffect = 'move' // Can reorder same collection
                }
                self.show(ev.target.folder.id == folder.id || ev.dataTransfer.dropEffect == 'copy')
            },
            ondragleave: () => {
                dragCopy.remove()
                self.style.display = ''
            },
            ondrop: async (ev) => {
                // Move/copy bookmark to the folder
                ev.stopPropagation()
                const dropElement = dragCopy
                dragCopy = null
                await self.applyFolderChange(dropElement, bookmark.folderId != ev.target.folder.id && ev.ctrlKey)
                await State.save()
            }
        })
        drag.subscribeDrop((el) => el !== dragCopy && el !== self && el instanceof BookmarkElement && el.folder && !el.parent.readonly && (!bookmark.favourite == !el.bookmark.favourite) && (el.folder.id != folder.id || folder.sortOrder == 0), {
            ondragenter: (ev) => {
                // Shift bookmarks as you drag over
                const startIndex = Array.prototype.indexOf.call(ev.target.parentNode.children, dragCopy)
                const targetIndex = Array.prototype.indexOf.call(ev.target.parentNode.children, ev.target)
                if (startIndex < 0 || startIndex > targetIndex) {
                    ev.target.parentNode.insertBefore(dragCopy, ev.target)
                } else {
                    ev.target.insertAdjacentElement('afterend', dragCopy)
                }
            }
        })
    }

    #lastTab = null
    onmouseenter() {
        Tabs.find(this.#bookmark.url).then(t => this.#lastTab = t)
    }

    async applyFolderChange(dropElement, asCopy) {
        const fromFolder = this.parentNode.host
        const toFolder = dropElement.parentNode.host
        const element = (asCopy || this.#bookmark.readonly) && this.#bookmark.folderId != toFolder.folder.id
            ? new BookmarkElement(await this.#bookmark.duplicate()) // Replace with duplicate
            : this
        dropElement.replaceWith(element)
        await element.bookmark.moveTo(element.folder)
        if (fromFolder != toFolder) {
            fromFolder?.reindexBookmarks?.()
        }
        toFolder.reindexBookmarks()
    }

    static #defaults = {
        index: null,
        dateAdded: 0,
        icon: '',
        favourite: false,
        clicks: 0,
        lastClick: 0,
        notes: ''
    }
    static export(data) {
        return data.pick(BookmarkElement.#defaults)
    }
}
customElements.define('bs-bookmark', BookmarkElement)