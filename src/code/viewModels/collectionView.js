/*
View model for Collection.
*/
export default class CollectionView {
    static display(collection, isFirst, isLast, refreshList) {
        const layout = collection.layout
        const elCollection = add('collection', { className: collection.collapsed ? 'collapsed' : '' }, function () {
            if (layout.allowEdits && !collection.immobile) {
                this.ondragenter = () => {
                    if (MainView.dragInfo?.collection && elCollection !== MainView.dragInfo.element) {
                        const startIndex = Array.prototype.indexOf.call(elCollection.parentElement.children, MainView.dragInfo.element)
                        const targetIndex = Array.prototype.indexOf.call(elCollection.parentElement.children, elCollection)
                        if (startIndex < 0 || startIndex > targetIndex) {
                            elCollection.parentElement.insertBefore(MainView.dragInfo.element, elCollection)
                        } else {
                            elCollection.insertAdjacentElement('afterend', MainView.dragInfo.element)
                        }
                    }
                }
                this.ondragover = (ev) => {
                    const bookmark = MainView.dragInfo?.bookmark
                    if (bookmark) {
                        ev.preventDefault() // Can drop here
                        ev.dataTransfer.dropEffect = bookmark.collection.id !== collection.id && (bookmark.isTab || ev.ctrlKey) ? 'copy' : 'move'
                    }
                }
                this.ondrop = async (ev) => {
                    if (!MainView.dragInfo) return
                    MainView.dragInfo.dropped = true

                    var bookmark = MainView.dragInfo?.bookmark
                    if (!bookmark) {
                        return
                    }
                    const element = MainView.dragInfo.element

                    // Copy tab here
                    if (bookmark.isTab) {
                        bookmark = await collection.bookmarks.create(bookmark.title, bookmark.url)
                        bookmark.icon = MainView.dragInfo.bookmark.icon
                        await bookmark.save()
                    }
                    else if (bookmark.collection.id !== collection.id) {
                        // Copy bookmark
                        if (ev.ctrlKey) {
                            bookmark = await bookmark.duplicate()
                        }

                        // Move bookmark here
                        await bookmark.moveTo(collection)
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

            add('title', { draggable: layout.allowEdits && !collection.immobile }, function () {
                this.onclick = () => {
                    if (!collection.fixed) {
                        collection.collapsed = !collection.collapsed
                        collection.save().then(refreshList)
                    }
                }

                if (layout.allowEdits && !collection.immobile) {
                    this.ondragstart = (ev) => {
                        if (!layout.allowEdits) {
                            ev.preventDefault()
                            return
                        }

                        ev.stopPropagation()
                        ev.dataTransfer.effectAllowed = 'move'
                        MainView.dragInfo = { collection: collection, element: elCollection, origin: elCollection.nextSibling }
                        elCollection.style.opacity = 0.5
                        MainView.elTrash.classList.add('active')
                    }
                    this.ondragend = () => {
                        if (MainView.dragInfo && !MainView.dragInfo.dropped) {
                            MainView.dragInfo.origin.parentElement.insertBefore(elCollection, MainView.dragInfo.origin)
                        }
                        elCollection.style.opacity = null
                        MainView.elTrash.classList.remove('active')
                        MainView.dragInfo = null
                    }
                }

                if (!collection.fixed) {
                    add('i', { classes: ['showHide', 'fa-fw', 'fas', collection.collapsed ? 'fa-chevron-down' : 'fa-chevron-up'] })
                }

                var faIcon = add('i', { className: 'icon fa-fw' })
                if (collection.icon?.includes('fa-')) {
                    faIcon.classList.add(...collection.icon.split(' '))
                } else {
                    faIcon.classList.add('fas', 'fa-book')

                    if (collection.icon && !collection.icon.startsWith('chrome:')) {
                        var imgIcon = add('img', { src: collection.icon, className: 'icon', style: 'display:none' })
                        imgIcon.onload = () => {
                            faIcon.replaceWith(imgIcon)
                            imgIcon.style.display = ''
                        }
                    }
                }

                add('span', collection.title)

                // Collection actions
                if (layout.allowEdits) {
                    add('div', { className: 'actions' }, () => {
                        if (!isFirst && !collection.immobile) {
                            iconButton('fas fa-arrow-up', 'Move up', () => collection.setIndex(collection.index - 1).then(refreshList))
                        }
                        if (!isLast && !collection.immobile) {
                            iconButton('fas fa-arrow-down', 'Move down', () => collection.setIndex(collection.index + 1).then(refreshList))
                        }
                        if (!collection.readonly) {
                            iconButton('fas fa-pen', 'Edit collection', () => Dialogs.editCollection(collection).then(refreshList))
                        }
                    })
                }

                if (collection.isFolder) {
                    add('a', () => {
                        add('i', { className: 'action fa-fw fas fa-folder', title: 'This is a folder from your browser bookmarks' })
                    }).onclick = (ev) => {
                        ev.stopPropagation()
                        Dialogs.importBookmarks(layout).then(refreshList)
                    }
                }
            })

            // Bookmarks
            if (!collection.collapsed) {
                const bookmarks = collection.bookmarks.list()
                for (var i = 0; i < bookmarks.length; ++i) {
                    BookmarkView.display(bookmarks[i], i == 0, i == bookmarks.length - 1, refreshList)
                }

                if (layout.allowEdits && !collection.readonly && (!collection.isExternal || collection.isFolder)) {
                    add('bookmark', {
                        className: 'add',
                        title: 'Add bookmark',
                        onclick: () => Dialogs.newBookmark(collection).then(refreshList),
                        ondragenter: function () {
                            if (MainView.dragInfo?.bookmark) {
                                this.parentElement.insertBefore(MainView.dragInfo.element, this)
                            }
                        }
                    }, () => add('i', { className: 'fa-fw fas fa-plus', title: 'Add bookmark' }))
                }
            }
        })
        return elCollection
    }
}

import BookmarkView from './bookmarkView.js'
import Dialogs from '../dialogs.js'
import MainView from "./main.js"