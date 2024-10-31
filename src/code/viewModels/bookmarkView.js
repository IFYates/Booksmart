/*
View model for Bookmark.
*/
// TODO: obsolete
export default class BookmarkView {
    static display(layout, folder, bookmark, isFirst, isLast) {
        if (bookmark.type === 'separator') {
            return add('bookmark', { className: 'separator' }) // TODO: new element?
        }

        /*add('bookmark', {
            id: bookmark.id ? ((bookmark.isTab ? 'tab-' : 'bookmark-') + bookmark.id) : null
        })/**/
        // TODO: bookmark.isTab - add('bs-tab', { $tab: `${bookmark.id}` })
        return add('bs-bookmark', { $bookmark: `${folder.id}:${bookmark.id}` })
    }
}

import Dialogs from '../ui/dialogs.js'
import MainView from "../ui/main.js"
import { BaseHTMLElement, DragDrop } from "../common/html.js"

const template = document.createElement('template')
template.innerHTML = `
<a>
    <i class="icon fa-fw fas fa-bookmark"></i>
    <img class="icon" style="display:none" />
    <div class="favourite">
        <i class="fa-fw far fa-square" title="Pin"></i>
        <i class="fa-fw fas fa-thumbtack" title="Unpin"></i>
    </div>
    <span class="title"></span>
    <div class="actions">
        <i class="fa-fw fas fa-arrow-up" title="Move up"></i>
        <i class="fa-fw fas fa-arrow-down" title="Move down"></i>
        <i class="fa-fw fas fa-pen" title="Edit bookmark"></i>
    </div>
</a>
`
class BookmarkElement extends BaseHTMLElement {
    #bookmark
    get bookmark() { return this.#bookmark }
    #folder
    get folder() { return this.#folder }

    constructor() {
        super(template, ['/code/ui/common.css', '/code/ui/bookmark.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
    }

    async ondisplay() {
        super.reset()
        const self = this

        // Find source data
        const bookmarkRef = this.getAttribute('bookmark')?.split(':')
        const folder = bookmarkRef?.length === 2 ? await MainView.layout.folders.get(bookmarkRef[0]) : null
        const bookmark = folder ? await folder.bookmarks.get(bookmarkRef[1]) : null
        this.#bookmark = bookmark

        // Icon
        const icon = bookmark?.icon ? bookmark.icon : bookmark?.domain ? `${bookmark.domain}/favicon.ico` : ''
        const faIcon = this.shadowRoot.querySelector('i.icon')
        if (bookmark.altIcon?.includes('fa-')) {
            faIcon.classList.remove('fas', 'fa-bookmark')
            faIcon.classList.add('fas', bookmark.altIcon)
        }
        if (icon.includes('fa-')) {
            faIcon.classList.remove('fas', 'fa-bookmark')
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
            this.href = bookmark?.url
            this.title = bookmark?.url
            this.target = MainView.layout.openNewTab ? '_blank' : ''
            this.onclick = (ev) => {
                bookmark.click(ev, MainView.layout.openExistingTab, MainView.layout.openNewTab)
            }
        })
        this._apply('span.title', function () {
            this.textContent = bookmark?.title
            this.classList.toggle('nowrap', !MainView.layout.wrapTitles)
        })
        this.onmouseenter = () => bookmark.hasOpenTab()

        // TODO: handle click here?

        // Style
        this.shadowRoot.host.classList.toggle('tab', bookmark?.isTab) // TODO: probably handled through 'bs-tab' element
        this.shadowRoot.host.classList.toggle('favourite', bookmark?.favourite)
        this.shadowRoot.host.classList.toggle('readonly', bookmark?.readonly || !MainView.layout.allowEdits)

        // Favourite
        this.shadowRoot.querySelector('.favourite>i[title="Pin"]').style.display = bookmark?.favourite ? 'none' : ''
        this.shadowRoot.querySelector('.favourite>i[title="Unpin"]').style.display = bookmark?.favourite ? '' : 'none'
        this.shadowRoot.querySelector('.favourite').onclick = () => {
            bookmark.favourite = !bookmark.favourite
            bookmark.save().then(() => MainView.refreshFolder(folder))
            return false
        }

        // Move
        this._apply('.actions>i[title="Move up"]', function () {
            this.style.display = bookmark?.isFirst ? 'none' : ''
            this.onclick = () => {
                const [newIndex, oldIndex] = [bookmark.previous.index, bookmark.index]
                Promise.allSettled([
                    bookmark.setIndex(newIndex),
                    bookmark.previous.setIndex(oldIndex)
                ]).then(() => { console.log(bookmark.id, bookmark.index); MainView.refreshFolder(folder) })
                return false
            }
        })
        this._apply('.actions>i[title="Move down"]', function () {
            this.style.display = bookmark?.isLast ? 'none' : ''
            this.onclick = () => {
                const [newIndex, oldIndex] = [bookmark.next.index, bookmark.index]
                Promise.allSettled([
                    bookmark.setIndex(newIndex),
                    bookmark.next.setIndex(oldIndex)
                ]).then(() => MainView.refreshFolder(folder))
                return false
            }
        })
        if (bookmark?.favourite) {
            this._apply('.actions>i[title="Move up"],.actions>i[title="Move down"]', (el) => {
                el.style.display = 'none'
            })
        }

        // Edit
        this.shadowRoot.querySelector('i[title="Edit bookmark"]').onclick = () => {
            Dialogs.editBookmark(bookmark, folder).then(() => MainView.refreshFolder(folder))
            return false
        }

        // Dragging
        const drag = this._enableDragDrop()
        if (MainView.layout.allowEdits) {
            drag.ondragstart = (ev) => {
                ev.stopPropagation()

                ev.dataTransfer.effectAllowed = bookmark.isTab ? 'copy' : 'copyMove'
                this.classList.add('dragging')
                MainView.elTrash.classList.toggle('active', !bookmark.isTab) // TODO: through global style?

                return { bookmark: bookmark, element: this, origin: this.nextSibling }
            }
            drag.ondragend = (ev, state) => {
                this.classList.remove('dragging')
                MainView.elTrash.classList.remove('active') // TODO: through global style?

                // Didn't drop on folder, so reset
                if (state && !state.dropped) {
                    state.origin.parentElement.insertBefore(this, state.origin)
                }
            }

            drag.ondragenter = (ev, state) => {
                const dragging = state.bookmark
                if (dragging && dragging !== bookmark && !bookmark.isTab) {
                    if (dragging.folderId === folder.id && folder.sortOrder !== 0) {
                        return // Cannot reorder non-manual folder
                    }

                    var target = !dragging.favourite ? this : this.parentElement.querySelectorAll('bookmark:first-of-type')[0]
                    if (target !== state.element) {
                        const startIndex = Array.prototype.indexOf.call(target.parentElement.children, state.element)
                        const targetIndex = Array.prototype.indexOf.call(target.parentElement.children, target)
                        if (startIndex < 0 || startIndex > targetIndex) {
                            target.parentElement.insertBefore(state.element, target)
                        } else {
                            target.insertAdjacentElement('afterend', state.element)
                        }
                    }
                }
            }
        } else {
            drag.ondragstart = (ev) => {
                ev.preventDefault()
            }
        }
    }
}
customElements.define('bs-bookmark', BookmarkElement);