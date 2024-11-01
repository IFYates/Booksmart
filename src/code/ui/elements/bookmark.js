import { BaseHTMLElement, DragDropHandler } from "../../common/html.js"
import { Tabs } from "../../common/tabs.js"
import Dialogs from '../dialogs.js'

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
        <i class="fa-fw fas fa-arrow-up" title="Move up"></i>
        <i class="fa-fw fas fa-arrow-down" title="Move down"></i>
        <i class="fa-fw fas fa-pen" title="Edit bookmark"></i>
    </div>
</a>
`

export class BookmarkElement extends BaseHTMLElement {
    #bookmark
    get bookmark() { return this.#bookmark }
    //get folder() { return this.parentNode?.host.folder || this.#bookmark.folder }
    get folder() { return this.#bookmark.folder }
    set folder(value) { this.#bookmark.folder = value } // TEMP
    get url() { return this.#bookmark.url }

    constructor(bookmark) {
        super(template, ['/code/styles/common.css', '/code/styles/bookmark.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
        this.#bookmark = bookmark
        this.id = 'bookmark-' + bookmark.id
    }

    async _ondisplay(root, host) {
        const self = this
        const bookmark = this.#bookmark
        const folder = this.parentNode.host.folder
        bookmark.readonly = bookmark.readonly || !MainView.layout.allowEdits || folder.readonly

        // Replace templates
        var m
        while (m = BaseHTMLElement.TemplateRE.exec(root.innerHTML)) {
            root.innerHTML = String(root.innerHTML).replaceAll(m[0], bookmark[m[1]] || '')
        }

        // Icon
        const icon = bookmark.icon || (bookmark.domain ? `${bookmark.domain}/favicon.ico` : '')
        const faIcon = root.querySelector('i.icon')
        if (bookmark.altIcon?.includes('fa-')) {
            faIcon.classList.remove('far', 'fa-bookmark')
            faIcon.classList.add(...bookmark.altIcon.split(' '))
        }
        if (icon.includes('fa-')) {
            faIcon.classList.remove('far', 'fa-bookmark')
            faIcon.classList.add(...bookmark.icon.split(' '))
        } else if (icon && !icon.startsWith('chrome:') /* TODO && layout.showFavicons*/) {
            this._apply('img.icon', function () {
                this.onload = () => {
                    faIcon.replaceWith(this)
                    this.style.display = ''
                }
                this.src = icon
            })
        }

        // Link
        this._apply('a', function () {
            this.target = MainView.layout.openNewTab ? '_blank' : ''
            this.onclick = (ev) => {
                if (!ev.ctrlKey && !ev.shiftKey && MainView.layout.openExistingTab && self.#lastTab) {
                    ev.preventDefault()
                    self.#lastTab.focus()
                } else if (!MainView.layout.openNewTab) {
                    ev.target.parentNode.classList.add('pulse') // TODO
                }

                // TODO
                // self.#bookmark.clicks += 1
                // self.#bookmark.lastClick = new Date().getTime()
                // this.save()
            }
        })
        this._apply('span.title', function () {
            this.classList.toggle('nowrap', !MainView.layout.wrapTitles)
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
            bookmark.save().then(() => host.refresh())
            return false
        }

        // Move
        this._apply('.actions>i[title="Move up"]', function () {
            this.style.display = bookmark.readonly || bookmark.isFirst ? 'none' : ''
            this.onclick = (ev) => {
                ev.stopPropagation()
                const [newIndex, oldIndex] = [bookmark.previous.index, bookmark.index]
                Promise.allSettled([
                    bookmark.setIndex(newIndex),
                    bookmark.previous.setIndex(oldIndex)
                ]).then(() => host.parentNode.host.refresh())
                return false
            }
        })
        this._apply('.actions>i[title="Move down"]', function () {
            this.style.display = bookmark.readonly || bookmark.isLast ? 'none' : ''
            this.onclick = (ev) => {
                ev.stopPropagation()
                const [newIndex, oldIndex] = [bookmark.next.index, bookmark.index]
                Promise.allSettled([
                    bookmark.setIndex(newIndex),
                    bookmark.next.setIndex(oldIndex)
                ]).then(() => host.parentNode.host.refresh())
                return false
            }
        })
        if (bookmark.favourite) {
            this._apply('.actions>i[title="Move up"],.actions>i[title="Move down"]', (el) => {
                el.style.display = 'none'
            })
        }

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
            MainView.elTrash.classList.toggle('active', !bookmark.isTab) // TODO: through global style?

            return { bookmark: bookmark, element: this, origin: this.nextSibling }
        }
        drag.ondragend = (ev, state) => {
            this.classList.remove('dragging')
            MainView.elTrash.classList.remove('active') // TODO: through global style?

            // Didn't drop on folder, so reset
            if (state && !state.dropped) {
                state.origin.parentNode.insertBefore(this, state.origin)
            }
        }
        if (!bookmark.readonly) {
            drag.ondragenter = (_, state) => {
                const dragging = state?.bookmark
                if (dragging && dragging !== bookmark && !bookmark.isTab) {
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

    async moveTo(folder) {
        if (this.readonly) return
        if (this.folder.id !== folder.id) {
            this.#bookmark.index = null
            this.folder = folder
            await folder.bookmarks.add(this)
            this.#bookmark.parentId = folder.id
            await this.save()
        }
    }
}
customElements.define('bs-bookmark', BookmarkElement)