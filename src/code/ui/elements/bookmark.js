import Emojis from "../../common/emojiHelpers.js"
import FontAwesome from "../../common/faHelpers.js"
import { BaseHTMLElement, DragDropHandler } from "../../common/html.js"
import { Tabs } from "../../common/tabs.js"
import State from "../../models/state.js"
import Dialogs from '../dialogs.js'
import { BookmarkAddElement } from "./bookmarkAdd.js"

const template = document.createElement('template')
template.innerHTML = `
<a href="<!--$ url $-->" title="<!--$ url $-->">
    <i class="icon fa-fw far fa-bookmark"></i>
    <img class="icon" style="display:none" />
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

    get iconType() {
        return !this.#bookmark.icon || this.#bookmark.icon.startsWith('chrome:')
            ? 'default'
            : FontAwesome.isFacon(this.#bookmark.icon)
                ? 'facon'
                : Emojis.isEmoji(this.#bookmark.icon)
                    ? 'emoji'
                    : 'custom'
    }

    constructor(bookmark) {
        super(template, ['/code/styles/common.css', '/code/styles/bookmark.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
        this.#bookmark = bookmark
        this.id = 'bookmark-' + bookmark.id
    }

    async _ondisplay(root, host) {
        const self = this
        const bookmark = this.#bookmark
        const folder = this.parentNode.host.folder
        bookmark.readonly = bookmark.readonly || !State.options.allowEdits || folder.readonly

        // Replace templates
        var m
        while (m = BaseHTMLElement.TemplateRE.exec(root.innerHTML)) {
            root.innerHTML = String(root.innerHTML).replaceAll(m[0], bookmark[m[1]] || '')
        }

        // Icon
        const faIcon = root.querySelector('i.icon')
        if (bookmark.altIcon?.includes('fa-')) {
            faIcon.classList.remove('far', 'fa-bookmark')
            faIcon.classList.add(...bookmark.altIcon.split(' '))
        }
        function showIcon(icon) {
            self._apply('img.icon', function () {
                this.onload = () => {
                    faIcon.replaceWith(this)
                    this.style.display = ''
                }
                this.src = icon
            })
        }
        switch (this.iconType) {
            case 'emoji':
                // TODO
                break
            case 'facon':
                faIcon.classList.remove('far', 'fa-bookmark')
                faIcon.classList.add(...bookmark.icon.split(' '))
                break
            case 'custom':
                showIcon(bookmark.icon)
                break
            default:
                showIcon(bookmark.domain ? `${bookmark.domain}/favicon.ico` : '')
                break
        }

        // Link
        this._apply('a', function () {
            this.target = State.options.openNewTab ? '_blank' : ''
            this.onclick = (ev) => {
                if (!ev.ctrlKey && !ev.shiftKey && State.options.openExistingTab && self.#lastTab) {
                    ev.preventDefault()
                    self.#lastTab.focus()
                }

                // TODO
                // self.#bookmark.clicks += 1
                // self.#bookmark.lastClick = new Date().getTime()
                // this.save()
            }
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
            root.querySelector('.actions>.move[title="Move up"]').style.display = bookmark.readonly || isFirst ? 'none' : ''
            root.querySelector('.actions>.move[title="Move down"]').style.display = bookmark.readonly || isLast ? 'none' : ''
            self.removeEventListener('mouseenter', attach)
        }
        self.addEventListener('mouseenter', attach)
        this._apply('.actions>.move', function () {
            this.onclick = (ev) => {
                ev.stopPropagation()

                const down = this.title === 'Move down'
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
                    if (dragging.folderId === folder.id && folder.sortOrder !== 0) {
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
        Tabs.find(this.url).then(t => this.#lastTab = t)
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
        index: null, // TODO?
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