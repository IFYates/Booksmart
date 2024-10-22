import './display.js'
import './utilities.js'

import Dialog from './dialogs.js'
import Layout from './models/layout.js'
import Tabs from './tabs.js'

var _layout = await Layout.load()
if (!_layout) {
    _layout = new Layout()
    await _layout.save()
}

var _dragInfo = null

const elTrash = document.getElementById('trash')
elTrash.ondragover = function (ev) {
    ev.preventDefault()

    const bookmark = _dragInfo.bookmark
    const collection = _dragInfo.collection
    if ((bookmark && !bookmark.isTab) || collection) {
        ev.dataTransfer.dropEffect = 'move'
    }
}
elTrash.ondrop = async function () {
    const bookmark = _dragInfo.bookmark
    if (bookmark && !bookmark.isTab) {
        await bookmark.delete().then(refreshList)
        return
    }

    const collection = _dragInfo.collection
    if (collection) {
        await collection.delete().then(refreshList)
        return
    }
}

document.getElementById('options').onclick = async function () {
    await Dialog.showOptions(_layout)
    await _layout.save()
}

document.getElementById('btnAddCollection').onclick = async function () {
    await Dialog.editCollection(null, _layout).then(refreshList)
}

_layout.onchange = async function () {
    await refreshList()
}

await refreshList()

async function refreshList() {
    const collections = await _layout.collections.list()
    const tabs = await Tabs.list()

    const oldLayout = document.getElementsByTagName('layout')[0]

    document.body.display(function () {
        const elLayout = add('layout', {
            style: { gridTemplateColumns: `repeat(${_layout.columns}, 1fr)` },
            ondragover: function (ev) {
                const collection = _dragInfo.collection
                if (collection) {
                    ev.preventDefault() // Can drop here
                    ev.dataTransfer.dropEffect = 'move'
                }
            },
            ondrop: async function () {
                _dragInfo.dropped = true
                const element = _dragInfo.element

                var collection = _dragInfo.collection
                if (!collection) {
                    return
                }

                // Position
                const siblings = element.parentElement.querySelectorAll('collection')
                const index = Array.prototype.indexOf.call(siblings, element)
                if (index >= 0) {
                    await collection.setIndex(index).then(refreshList)
                }
            }
        }, function () {
            for (const [i, collection] of collections.entries()) {
                displayCollection(collection, i === 0, i === collections.length - 1)
            }
            displayAllTabs(tabs)
        })

        oldLayout.replaceWith(elLayout)
    })
}

function displayCollection(collection, isFirst, isLast) {
    const elCollection = add('collection', {
        className: collection.collapsed ? 'collapsed' : '',
        ondragenter: function () {
            if (_dragInfo.collection && elCollection !== _dragInfo.element) {
                elCollection.parentElement.insertBefore(_dragInfo.element, elCollection)
            }
        },
        ondragover: function (ev) {
            const bookmark = _dragInfo.bookmark
            if (bookmark) {
                ev.preventDefault() // Can drop here
                ev.dataTransfer.dropEffect = bookmark.collection.id !== collection.id && (bookmark.isTab || ev.ctrlKey) ? 'copy' : 'move'
            }
        },
        ondrop: async function (ev) {
            _dragInfo.dropped = true
            const element = _dragInfo.element

            var bookmark = _dragInfo.bookmark
            if (!bookmark) {
                return
            }

            // Copy tab here
            if (bookmark.isTab) {
                bookmark = await collection.bookmarks.create(bookmark.title, bookmark.url)
                bookmark.icon = _dragInfo.bookmark.icon
                await bookmark.save()
            }
            else if (bookmark.collection.id !== collection.id) {
                // Copy bookmark here
                if (ev.ctrlKey) {
                    bookmark = await bookmark.duplicate()
                    await bookmark.moveTo(collection)
                }
                // Move bookmark here
                else {
                    await bookmark.moveTo(collection)
                }
            }

            // Position
            const siblings = element.parentElement.querySelectorAll('bookmark')
            const index = Array.prototype.indexOf.call(siblings, element)
            if (index >= 0) {
                await bookmark.setIndex(index).then(refreshList)
            }
        }
    }, function () {
        add('title', {
            draggable: !collection.isTabs,
            onclick: function () {
                collection.collapsed = !collection.collapsed
                collection.save().then(refreshList)
            },
            ondragstart: function (ev) {
                ev.stopPropagation()
                ev.dataTransfer.effectAllowed = 'move'
                _dragInfo = { collection: collection, element: elCollection, origin: elCollection.nextSibling }
                elCollection.style.opacity = 0.5
                elTrash.style.opacity = 1
            },
            ondragend: function () {
                if (!_dragInfo.dropped) {
                    _dragInfo.origin.parentElement.insertBefore(elCollection, _dragInfo.origin)
                }
                elCollection.style.opacity = null
                elTrash.style.opacity = null
                _dragInfo = null
            }
        }, function () {
            add('i', { className: `showHide fa-fw fas ${collection.collapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`, style: 'padding-right:4px' })
            add('i', { className: `icon fa-fw fas ${collection.icon ? collection.icon : 'fa-book'}`, style: 'padding-right:4px' })
            add('span', collection.title)

            // Collection actions
            add('div', { className: 'actions' }, function () {
                if (!isFirst) {
                    add('button', { onclick: () => collection.setIndex(collection.index - 1).then(refreshList) })
                        .append('i', { className: 'fa-fw fas fa-arrow-up', title: 'Move up' })
                }
                if (!isLast) {
                    add('button', { onclick: () => collection.setIndex(collection.index + 1).then(refreshList) })
                        .append('i', { className: 'fa-fw fas fa-arrow-down', title: 'Move down' })
                }
    
                add('button', { onclick: () => Dialog.editCollection(collection).then(refreshList) })
                    .append('i', { className: 'fa-fw fas fa-pen', title: 'Edit collection' })
            })
        })

        // Bookmarks
        if (!collection.collapsed) {
            const bookmarks = collection.bookmarks.list()
            for (var i = 0; i < bookmarks.length; ++i) {
                displayBookmark(collection, bookmarks[i], i == 0, i == bookmarks.length - 1)
            }

            const btnAddBookmark = add('bookmark', {
                className: 'add',
                title: 'Add bookmark',
                onclick: async () => await Dialog.editBookmark(null, collection).then(refreshList),
                ondragenter: function () {
                    if (_dragInfo.bookmark) {
                        btnAddBookmark.parentElement.insertBefore(_dragInfo.element, btnAddBookmark)
                    }
                }
            })
            btnAddBookmark.append('i', { className: 'fa-fw fas fa-plus', title: 'Add bookmark' })
        }
    })
    return elCollection
}
function displayBookmark(collection, bookmark, isFirst, isLast) {
    return add('bookmark', {
        className: bookmark.favourite ? 'favourite' : '',
        draggable: true,
        ondragstart: function (ev) {
            ev.stopPropagation()
            ev.dataTransfer.effectAllowed = bookmark.isTab ? 'copy' : 'copyMove'
            console.log(this)
            _dragInfo = { bookmark: bookmark, element: this, origin: this.nextSibling }
            this.style.opacity = 0.5
            if (!bookmark.isTab) {
                elTrash.style.opacity = 1
            }
        },
        ondragenter: function (ev) {
            if (_dragInfo.bookmark && !bookmark.isTab) {
                var target = !_dragInfo.bookmark.favourite ? this : this.parentElement.querySelectorAll('bookmark:first-of-type')[0]
                if (target !== _dragInfo.element) {
                    target.parentElement.insertBefore(_dragInfo.element, target)
                }
            }
        },
        ondragend: function () {
            if (!_dragInfo.dropped) {
                _dragInfo.origin.parentElement.insertBefore(this, _dragInfo.origin)
            }
            this.style.opacity = null
            elTrash.style.opacity = null
            _dragInfo = null
        }
    }, function () {
        add('div', { className: 'actions' }, function () {
            if (collection.sortOrder === 0) {
                if (!isFirst) {
                    add('button', { onclick: () => bookmark.setIndex(bookmark.index - 1).then(refreshList) })
                        .append('i', { className: 'fa-fw fas fa-arrow-up', title: 'Move up' })
                }
                if (!isLast) {
                    add('button', { onclick: () => bookmark.setIndex(bookmark.index + 2).then(refreshList) })
                        .append('i', { className: 'fa-fw fas fa-arrow-down', title: 'Move down' })
                }
            }

            add('button', { onclick: () => Dialog.editBookmark(bookmark).then(refreshList) })
                .append('i', { className: 'fa-fw fas fa-pen', title: 'Edit bookmark' })
        })

        add('a', {
            title: bookmark.url,
            href: bookmark.url,
            target: _layout.openNewTab ? '_blank' : '',
            onclick: (ev) => bookmark.click(ev, _layout.openExistingTab),
            onmouseenter: () => bookmark.hasOpenTab()
        }, function () {
            var faIcon = add('i', { className: 'icon fa-fw fas' })
            if (bookmark.icon?.startsWith('fa-')) {
                faIcon.classList.add(bookmark.icon)
            } else if (bookmark.altIcon?.startsWith('fa-')) {
                faIcon.classList.add(bookmark.altIcon)
            } else {
                faIcon.classList.add('fa-bookmark')
            }

            const icon = bookmark.icon ? bookmark.icon : `${bookmark.domain}/favicon.ico`
            if (!icon.startsWith('fa-') && !icon.startsWith('chrome:') && _layout.showFavicons) {
                var imgIcon = add('img', { src: icon, className: 'icon' })
                imgIcon.style.display = 'none'
                imgIcon.onload = function () {
                    faIcon.replaceWith(imgIcon)
                    imgIcon.style.display = ''
                }
            }

            add('div', { className: 'favourite' }, function () {
                const btnFavourite = add('i', {
                    className: 'fa-fw',
                    title: bookmark.favourite ? 'Unpin' : 'Pin',
                    onclick: function (ev) {
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

            add('span', bookmark.title, { className: 'title' })
        })
    })
}
function displayAllTabs(tabs) {
    const collection = {
        isTabs: true,
        sortOrder: -1,
        icon: 'fa-window-restore',
        title: 'Active tabs',
        bookmarks: [],
        collapsed: !_layout.showTabList,
        save: async function () {
            _layout.showTabList = !collection.collapsed
            await _layout.save()
        }
    }
    collection.bookmarks.list = () => collection.bookmarks

    for (const tab of tabs) {
        const self = tab
        collection.bookmarks.push({
            isTab: true,
            favourite: false,
            icon: tab.favIconUrl,
            domain: new URL(tab.url).origin,
            altIcon: 'fa-window-maximize',
            url: tab.url,
            title: tab.title,
            hasOpenTab: () => true,
            click: async function (ev) {
                ev.preventDefault()
                await Tabs.focus(self)
            }
        })
    }

    var el = displayCollection(collection, true, true)
    el.classList.add('tabs')
    el.style.gridColumn = `span ${_layout.columns}`
}