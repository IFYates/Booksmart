import './icon.js'
import "../../common/emojiHelpers.js"
import "../../common/faHelpers.js"

import { BaseHTMLElement, DragDropHandler } from "../../common/html.js"
import { Tabs } from "../../common/tabs.js"
import State from "../../models/state.js"
import Dialogs from '../dialogs.js'
import { BookmarkAddElement } from "./bookmarkAdd.js"

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

    get index() { return this.#bookmark.index }
    set index(value) { this.#bookmark.index = num(value) }

    constructor(bookmark) {
        super(template, ['/styles/common.css', '/styles/bookmark.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
        this.#bookmark = bookmark
        this.id = 'bookmark-' + bookmark.id
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

    async _ondisplay(root, host) {
        const self = this
        const bookmark = this.#bookmark
        const folder = this.parentNode.host.folder
        bookmark.readonly = bookmark.readonly || !State.options.allowEdits || folder.readonly

        // Replace templates
        root.innerHTML = BaseHTMLElement.replaceTemplates(root.innerHTML, bookmark)

        // Icon
        const icon = root.querySelector('bs-icon')
        icon.value = bookmark.icon
        icon.favDomain = bookmark.domain
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
        host.classList.toggle('readonly', !!bookmark.readonly)

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
            this._apply('.actions>.move[title="Move up"]', (el) => el.style.display = bookmark.readonly || isFirst ? 'none' : '')
            this._apply('.actions>.move[title="Move down"]', (el) => el.style.display = bookmark.readonly || isLast ? 'none' : '')
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
            this.style.display = bookmark.readonly ? 'none' : ''
            this.onclick = (ev) => {
                ev.stopPropagation()
                Dialogs.editBookmark(bookmark, folder).then(() => host.parentNode.host.refresh())
                return false
            }
        })

        // Dragging
        const drag = new DragDropHandler(host)
        drag.ondragstart = (ev) => {
            ev.stopPropagation()

            ev.dataTransfer.effectAllowed = bookmark.readonly ? 'copy' : 'copyMove'
            this.classList.add('dragging')
            MainView.elTrash.classList.toggle('active', !bookmark.readonly) // TODO: through global style?

            return { bookmark: bookmark, element: this, origin: this.nextSibling ?? this.parentNode }
        }
        drag.ondragend = (_, state) => {
            this.classList.remove('dragging')
            MainView.elTrash.classList.remove('active') // TODO: through global style?

            // Didn't drop on folder, so reset
            if (state.element && !state.dropped) {
                state.element.remove()
                if (state.origin instanceof BookmarkElement || state.origin instanceof BookmarkAddElement) {
                    state.origin.parentNode.insertBefore(this, state.origin)
                } else {
                    state.origin.appendChild(this)
                }
            }
        }
        if (!bookmark.readonly) {
            drag.ondragenter = (_, state) => {
                const dragging = state?.bookmark
                if (dragging && dragging !== bookmark && !bookmark.readonly) {
                    if (dragging.folderId == folder.id && folder.sortOrder !== 0) {
                        return // Cannot reorder non-manual folder
                    }

                    var target = !dragging.favourite ? this : this.parentNode.querySelectorAll('bookmark:first-of-type')[0]
                    if (target !== state.element) {
                        const startIndex = Array.prototype.indexOf.call(target.parentNode.children, state.element)
                        const targetIndex = Array.prototype.indexOf.call(target.parentNode.children, target)
                        if (startIndex < 0 || startIndex > targetIndex) {
                            target.parentNode.insertBefore(state.element, target)
                        } else {
                            target.insertAdjacentElement('afterend', state.element)
                        }
                    }
                }
            }
        }
    }

    #lastTab = null
    onmouseenter() {
        Tabs.find(this.#bookmark.url).then(t => this.#lastTab = t)
    }

    async moveTo(folder, origin, doCopy) {
        if (doCopy || this.readonly) {
            const element = new BookmarkElement(await this.bookmark.duplicate())
            await element.bookmark.moveTo(folder.folder)
            this.parentNode.insertBefore(element, this)
            origin?.parentNode.insertBefore(this, origin)
        }
        else {
            const startParent = this.parent
            await this.bookmark.moveTo(folder.folder)
            startParent.reindexBookmarks()
        }
        folder.reindexBookmarks()
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