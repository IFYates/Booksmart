/*
View model for Folder.
*/
// TODO: obsolete
export default class FolderView {
    static create(folder) {
        const layout = MainView.layout
        const isFirst = folder.isFirst
        const isLast = folder.isLast

        return new FolderElement(folder)

        //     if (layout.allowEdits && !folder.immobile) {
        //         this.ondrop = async (ev) => {
        //             if (!MainView.dragInfo) return
        //             MainView.dragInfo.dropped = true

        //             var bookmark = MainView.dragInfo.bookmark
        //             if (!bookmark) {
        //                 return
        //             }
        //             const element = MainView.dragInfo.element

        //             // Copy tab here
        //             if (bookmark.isTab) {
        //                 const originalIcon = MainView.dragInfo.bookmark.icon
        //                 bookmark = await folder.bookmarks.create(bookmark.title, bookmark.url)
        //                 bookmark.icon = originalIcon
        //                 await bookmark.save()
        //             }
        //             else if (bookmark.folderId !== folder.id) {
        //                 // Copy bookmark
        //                 if (ev.ctrlKey) {
        //                     bookmark = await bookmark.duplicate()
        //                 }

        //                 // Move bookmark here
        //                 await bookmark.moveTo(folder)
        //             }

        //             // Position
        //             const siblings = [...element.parentElement.querySelectorAll('bookmark')]
        //             const position = siblings.indexOf(element)
        //             if (position === 0) {
        //                 await bookmark.setIndex(0)
        //             } else if (position > 0) {
        //                 const index = num(siblings[position - 1].getAttribute('data-index'))
        //                 await bookmark.setIndex(index + 1)
        //             }
        //             MainView.fullRefresh()
        //         }
        //     }

        //         if (layout.allowEdits && !folder.immobile) {
        //         }

        //     })
        // })
    }

    static display(folder) {
        return add(this.create(folder))
    }

    static displayEmpty() {
        add('bookmark', 'You don\'t have any folders; create one now', {
            id: 'folder-empty',
            className: 'empty',
            onclick: () => MainView.btnAddFolder.click()
        })
    }

    static update(folder) {
        const oldView = document.getElementById('folder-' + folder.id)
        const view = FolderView.create(folder)
        if (oldView) {
            oldView.replaceWith(view)
        } else {
            MainView.elLayout.add(view)
        }
        return view
    }
}

import { BookmarkElement } from './bookmarkView.js'
import Dialogs from '../ui/dialogs.js'
import MainView from "../ui/main.js"

import { BaseHTMLElement, DropHandler, DragDropHandler } from "../common/html.js"

const template = document.createElement('template')
template.innerHTML = `
<h1>
    <i class="showHide fa-fw fas fa-chevron-down" title="Show"></i>
    <i class="showHide fa-fw fas fa-chevron-up" title="Hide"></i>
    <i class="icon fa-fw fas fa-book"></i>
    <img class="icon" style="display:none" />

    <span class="title"></span>

    <div class="actions">
        <i class="fa-fw fas fa-arrow-up" title="Move up"></i>
        <i class="fa-fw fas fa-arrow-down" title="Move down"></i>
        <i class="fa-fw fas fa-pen" title="Edit folder"></i>
    </div>

    <i class="action fa-fw fas fa-folder" title="This is a folder from your browser bookmarks" style="display:none"></i>
</h1>
<!-- Bookmarks -->
`
class FolderElement extends BaseHTMLElement {
    #folder
    get folder() { return this.#folder }

    constructor(folder) {
        super(template, ['/code/ui/common.css', '/code/styles/folder.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
        this.#folder = folder
        this.id = 'folder-' + folder.id
    }

    async _ondisplay(root, host) {
        const folder = this.#folder

        // Show/hide
        this._apply('i.showHide', function () {
            this.style.display = !folder.fixed && this.classList.contains('fa-chevron-down') === folder.collapsed ? '' : 'none'
        })
        root.querySelector('h1').onclick = () => {
            folder.collapsed = !folder.collapsed
            folder.save().then(() => this.refresh())
        }
        this.classList.toggle('collapsed', folder.collapsed)
        this.classList.toggle('collapsable', !folder.fixed)

        // Icon
        const faIcon = root.querySelector('i.icon')
        if (folder.icon?.includes('fa-')) {
            faIcon.classList.remove('fas', 'fa-book')
            faIcon.classList.add(...folder.icon.split(' '))
        } else if (folder.icon && !folder.icon.startsWith('chrome:')) {
            this._apply('img.icon', function () {
                this.onload = () => {
                    faIcon.replaceWith(this)
                    this.style.display = ''
                }
                this.src = folder.icon
            })
        }

        // Title
        this._apply('.title', function () {
            this.innerText = folder.title
        })

        // Move
        this._apply('.actions>i[title="Move up"]', function () {
            this.style.display = folder.isFirst ? 'none' : ''
            this.onclick = (ev) => {
                ev.stopPropagation()
                const other = folder.previous

                const oldIndex = folder.index
                folder.index = other.index, other.index = oldIndex
                other.next = folder.next, folder.next = other
                folder.previous = other.previous, other.previous = folder

                host.refresh()
                host.previousSibling.refresh()
                host.parentElement.insertBefore(host, host.previousSibling)
                folder.save().then(() => other.save())
            }
        })
        this._apply('.actions>i[title="Move down"]', function () {
            this.style.display = folder?.isLast ? 'none' : ''
            this.onclick = (ev) => {
                ev.stopPropagation()
                const other = folder.next

                const oldIndex = folder.index
                folder.index = other.index, other.index = oldIndex
                other.previous = folder.previous, folder.previous = other
                folder.next = other.next, other.next = folder

                host.refresh()
                host.nextSibling.refresh()
                host.parentElement.insertBefore(host.nextSibling, host)
                folder.save().then(() => other.save())
            }
        })

        // Edit
        this._apply('i.fa-pen', function () {
            this.onclick = (ev) => {
                ev.stopPropagation()
                Dialogs.editFolder(folder).then(MainView.fullRefresh)
            }
        })
        if (!folder.isOwned) {
            this._apply('i.fa-folder', function () {
                this.style.display = ''
                this.onclick = (ev) => {
                    ev.stopPropagation()
                    Dialogs.importBookmarks(MainView.layout).then(MainView.fullRefresh)
                }
            })
        }

        // Bookmarks
        if (!folder.collapsed) {
            for (const bookmark of folder.bookmarks.list()) {
                root.appendChild(new BookmarkElement(bookmark))
            }

            if (MainView.layout.allowEdits && !folder.readonly) {
                // TODO
                root.appendChild(createElement('bookmark', {
                    className: 'add',
                    title: 'Add bookmark',
                    onclick: () => Dialogs.newBookmark(folder).then(MainView.fullRefresh),
                    // ondragenter: function () {
                    //     const bookmark = MainView.dragInfo?.bookmark
                    //     if (bookmark && (bookmark.folderId !== folder.id || folder.sortOrder === 0)) {
                    //         this.parentElement.insertBefore(MainView.dragInfo.element, this)
                    //     }
                    // }
                }, () => add('i', { className: 'fa-fw fas fa-plus', title: 'Add bookmark' })))
            }
        }

        // Collection dragging
        const drag = new DragDropHandler(root.querySelector('h1'))
        if (MainView.layout.allowEdits && !folder.immobile) {
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
        } else {
            drag.ondragstart = (ev) => {
                ev.preventDefault()
            }
        }

        // Bookmark dropping
        if (MainView.layout.allowEdits) {
            const drop = new DropHandler(host)

            drop.ondragover = (ev, state) => {
                const bookmark = state?.bookmark
                console.log('ondragover', ev, state)
                if (bookmark) {
                    if (bookmark.folderId === folder.id && folder.sortOrder !== 0) return // Cannot reorder non-manual folder
                    ev.preventDefault() // Can drop here
                    ev.dataTransfer.dropEffect = bookmark.folderId !== folder.id && (bookmark.isTab || ev.ctrlKey) ? 'copy' : 'move' // Can copy to another collection
                }
            }
            // TODO: index
            drop.ondrop = async (ev, state) => {
                if (state?.bookmark) {
                    await state.bookmark.moveTo(folder)
                    state.bookmark.save().then(() => MainView.fullRefresh())
                    // TODO: refresh only affected folders
                }
            }
        }
    }
}
customElements.define('bs-folder', FolderElement);