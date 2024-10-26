/*
View model for Bookmark.
*/
export default class BookmarkView {
    static display(bookmark, isFirst, isLast, refreshList) {
        if (bookmark.type === 'separator') {
            return add('bookmark', { className: 'separator' })
        }

        const collection = bookmark.collection
        const layout = collection.layout
        return add('bookmark', {
            id: bookmark.id ? ((bookmark.isTab ? 'tab-' : 'bookmark-') + bookmark.id) : null,
            classes: [bookmark.favourite ? 'favourite' : '', bookmark.readonly ? 'tab' : ''],
            draggable: layout.allowEdits,
            ondragstart: function (ev) {
                if (!layout.allowEdits) {
                    ev.preventDefault()
                    return
                }

                ev.stopPropagation()
                ev.dataTransfer.effectAllowed = bookmark.isTab ? 'copy' : 'copyMove'
                MainView.dragInfo = { bookmark: bookmark, element: this, origin: this.nextSibling }
                this.style.opacity = 0.5
                if (!bookmark.isTab) {
                    MainView.elTrash.classList.add('active')
                }
            },
            ondragenter: function () {
                if (MainView.dragInfo?.bookmark && !bookmark.isTab && MainView.dragInfo.bookmark.collection.sortOrder === 0) {
                    var target = !MainView.dragInfo.bookmark.favourite ? this : this.parentElement.querySelectorAll('bookmark:first-of-type')[0]
                    if (target !== MainView.dragInfo.element) {
                        const startIndex = Array.prototype.indexOf.call(target.parentElement.children, MainView.dragInfo.element)
                        const targetIndex = Array.prototype.indexOf.call(target.parentElement.children, target)
                        if (startIndex < 0 || startIndex > targetIndex) {
                            target.parentElement.insertBefore(MainView.dragInfo.element, target)
                        } else {
                            target.insertAdjacentElement('afterend', MainView.dragInfo.element)
                        }
                    }
                }
            },
            ondragend: function () {
                if (MainView.dragInfo && !MainView.dragInfo.dropped) {
                    MainView.dragInfo.origin.parentElement.insertBefore(this, MainView.dragInfo.origin)
                }
                this.style.opacity = null
                MainView.elTrash.classList.remove('active')
                MainView.dragInfo = null
            }
        }, function () {
            if (bookmark.isTab) {
                this.classList.add('tab')
            }
            this.setAttribute('data-index', bookmark.index)

            add('a', {
                title: bookmark.url,
                href: bookmark.url,
                target: layout.openNewTab ? '_blank' : '',
                onclick: (ev) => bookmark.click(ev, layout.openExistingTab),
                onmouseenter: () => bookmark.hasOpenTab()
            }, () => {
                var faIcon = add('i', { className: 'icon fa-fw' })
                if (bookmark.icon?.includes('fa-')) {
                    faIcon.classList.add(...bookmark.icon.split(' '))
                } else if (bookmark.altIcon?.includes('fa-')) {
                    faIcon.classList.add('fas', bookmark.altIcon)
                } else {
                    faIcon.classList.add('fas', 'fa-bookmark')
                }

                const icon = bookmark.icon ? bookmark.icon : `${bookmark.domain}/favicon.ico`
                if (!icon.includes('fa-') && !icon.startsWith('chrome:') && layout.showFavicons) {
                    var imgIcon = add('img', { src: icon, className: 'icon', style: 'display:none' })
                    imgIcon.onload = () => {
                        faIcon.replaceWith(imgIcon)
                        imgIcon.style.display = ''
                    }
                }

                if (layout.allowEdits && !bookmark.readonly) {
                    add('div', { className: 'favourite' }, () => {
                        const btnFavourite = add('i', {
                            className: 'fa-fw',
                            title: bookmark.favourite ? 'Unpin' : 'Pin',
                            onclick: (ev) => {
                                ev.stopPropagation()
                                bookmark.favourite = !bookmark.favourite
                                bookmark.save().then(refreshList)
                                return false
                            }
                        })
                        btnFavourite.classList.toggle('far', !bookmark.favourite)
                        btnFavourite.classList.toggle('fa-square', !bookmark.favourite)
                        btnFavourite.classList.toggle('fas', bookmark.favourite)
                        btnFavourite.classList.toggle('fa-thumbtack', bookmark.favourite)
                    })
                }

                add('span', bookmark.title, { classes: ['title', layout.wrapTitles ? '' : 'nowrap'] })

                if (layout.allowEdits && !bookmark.readonly) {
                    add('div', { className: 'actions' }, () => {
                        if (collection.sortOrder === 0 && !bookmark.readonly) {
                            if (!isFirst) {
                                iconButton('fas fa-arrow-up', 'Move up', () => bookmark.setIndex(bookmark.index - 1).then(refreshList))
                            }
                            if (!isLast) {
                                iconButton('fas fa-arrow-down', 'Move down', () => bookmark.setIndex(bookmark.index + 1).then(refreshList))
                            }
                        }
                        iconButton('fas fa-pen', 'Edit bookmark', () => Dialogs.editBookmark(bookmark).then(refreshList))
                    })
                }
            })
        })
    }
}

import Dialogs from '../dialogs.js'
import MainView from "./main.js"