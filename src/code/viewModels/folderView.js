/*
View model for Folder.
*/
export default class FolderView {
    static display(layout, folder, isFirst, isLast, refreshList) {
        return add('folder', { className: folder.collapsed ? 'collapsed' : '' }, function () {
            const elFolder = this
            if (layout.allowEdits && !folder.immobile) {
                this.ondragenter = () => {
                    if (MainView.dragInfo?.folder && this !== MainView.dragInfo.element) {
                        const startIndex = Array.prototype.indexOf.call(this.parentElement.children, MainView.dragInfo.element)
                        const targetIndex = Array.prototype.indexOf.call(this.parentElement.children, this)
                        if (startIndex < 0 || startIndex > targetIndex) {
                            this.parentElement.insertBefore(MainView.dragInfo.element, this)
                        } else {
                            this.insertAdjacentElement('afterend', MainView.dragInfo.element)
                        }
                    }
                }
                this.ondragover = (ev) => {
                    const bookmark = MainView.dragInfo?.bookmark
                    if (bookmark) {
                        if (bookmark.folderId === folder.id && folder.sortOrder !== 0) {
                            return // Cannot reorder non-manual folder
                        }
                        
                        ev.preventDefault() // Can drop here
                        ev.dataTransfer.dropEffect = bookmark.folderId !== folder.id && (bookmark.isTab || ev.ctrlKey) ? 'copy' : 'move'
                    }
                }
                this.ondrop = async (ev) => {
                    if (!MainView.dragInfo) return
                    MainView.dragInfo.dropped = true

                    var bookmark = MainView.dragInfo.bookmark
                    if (!bookmark) {
                        return
                    }
                    const element = MainView.dragInfo.element

                    // Copy tab here
                    if (bookmark.isTab) {
                        const originalIcon = MainView.dragInfo.bookmark.icon
                        bookmark = await folder.bookmarks.create(bookmark.title, bookmark.url)
                        bookmark.icon = originalIcon
                        await bookmark.save()
                    }
                    else if (bookmark.folderId !== folder.id) {
                        // Copy bookmark
                        if (ev.ctrlKey) {
                            bookmark = await bookmark.duplicate()
                        }

                        // Move bookmark here
                        await bookmark.moveTo(folder)
                    }

                    // Position
                    const siblings = [...element.parentElement.querySelectorAll('bookmark')]
                    const position = siblings.indexOf(element)
                    if (position === 0) {
                        await bookmark.setIndex(0)
                    } else if (position > 0) {
                        const index = num(siblings[position - 1].getAttribute('data-index'))
                        await bookmark.setIndex(index + 1)
                    }
                    await refreshList()
                }
            }

            add('title', { draggable: layout.allowEdits && !folder.immobile }, function () {
                this.onclick = () => {
                    if (!folder.fixed) {
                        folder.collapsed = !folder.collapsed
                        folder.save().then(refreshList)
                    }
                }

                if (layout.allowEdits && !folder.immobile) {
                    this.ondragstart = (ev) => {
                        if (!layout.allowEdits) {
                            ev.preventDefault()
                            return
                        }

                        ev.stopPropagation()
                        ev.dataTransfer.effectAllowed = 'move'
                        MainView.dragInfo = { folder: folder, element: elFolder, origin: elFolder.nextSibling }
                        this.style.opacity = 0.5
                        MainView.elTrash.classList.add('active')
                    }
                    this.ondragend = () => {
                        if (MainView.dragInfo && !MainView.dragInfo.dropped) {
                            MainView.dragInfo.origin.parentElement.insertBefore(elFolder, MainView.dragInfo.origin)
                        }
                        this.style.opacity = null
                        MainView.elTrash.classList.remove('active')
                        MainView.dragInfo = null
                    }
                }

                if (!folder.fixed) {
                    add('i', { classes: ['showHide', 'fa-fw', 'fas', folder.collapsed ? 'fa-chevron-down' : 'fa-chevron-up'] })
                }

                var faIcon = add('i', { className: 'icon fa-fw' })
                if (folder.icon?.includes('fa-')) {
                    faIcon.classList.add(...folder.icon.split(' '))
                } else {
                    faIcon.classList.add('fas', 'fa-book')

                    if (folder.icon && !folder.icon.startsWith('chrome:')) {
                        var imgIcon = add('img', { src: folder.icon, className: 'icon', style: 'display:none' })
                        imgIcon.onload = () => {
                            faIcon.replaceWith(imgIcon)
                            imgIcon.style.display = ''
                        }
                    }
                }

                add('span', folder.title)

                // Folder actions
                if (layout.allowEdits) {
                    add('div', { className: 'actions' }, () => {
                        if (!isFirst && !folder.immobile) {
                            iconButton('fas fa-arrow-up', 'Move up', () => folder.setIndex(folder.index - 1).then(refreshList))
                        }
                        if (!isLast && !folder.immobile) {
                            iconButton('fas fa-arrow-down', 'Move down', () => folder.setIndex(folder.index + 1).then(refreshList))
                        }
                        if (!folder.readonly) {
                            iconButton('fas fa-pen', 'Edit folder', () => Dialogs.editFolder(folder).then(refreshList))
                        }
                    })
                }

                if (folder.isFolder) {
                    add('a', () => {
                        add('i', { className: 'action fa-fw fas fa-folder', title: 'This is a folder from your browser bookmarks' })
                    }).onclick = (ev) => {
                        ev.stopPropagation()
                        Dialogs.importBookmarks(layout).then(refreshList)
                    }
                }
            })

            // Bookmarks
            if (!folder.collapsed) {
                const bookmarks = folder.bookmarks.list()
                for (var i = 0; i < bookmarks.length; ++i) {
                    BookmarkView.display(layout, folder, bookmarks[i], i == 0, i == bookmarks.length - 1, refreshList)
                }

                if (layout.allowEdits && !folder.readonly && (!folder.isExternal || folder.isFolder)) {
                    add('bookmark', {
                        className: 'add',
                        title: 'Add bookmark',
                        onclick: () => Dialogs.newBookmark(folder).then(refreshList),
                        ondragenter: function () {
                            const bookmark = MainView.dragInfo?.bookmark
                            if (bookmark && (bookmark.folderId !== folder.id || folder.sortOrder === 0)) {
                                this.parentElement.insertBefore(MainView.dragInfo.element, this)
                            }
                        }
                    }, () => add('i', { className: 'fa-fw fas fa-plus', title: 'Add bookmark' }))
                }
            }
        })
    }
}

import BookmarkView from './bookmarkView.js'
import Dialogs from '../dialogs.js'
import MainView from "./main.js"