import './html.js'
import './display.js'
import './utilities.js'

import Dialog from './dialogs.js'
import Layout from './models/layout.js'
import Tabs from './tabs.js'

var _dragInfo = null

var _layout = await Layout.load()
if (!_layout) {
    _layout = new Layout()
    await _layout.save()
}
_layout.onchange = () => refreshList()

const elTrash = document.getElementById('trash')
elTrash.ondragover = (ev) => {
    const bookmark = _dragInfo?.bookmark
    const collection = _dragInfo?.collection
    if ((bookmark && !bookmark.isTab) || collection) {
        ev.preventDefault()
        ev.dataTransfer.dropEffect = 'move'
    }
}
elTrash.ondrop = async () => {
    const bookmark = _dragInfo?.bookmark
    if (bookmark && !bookmark.isTab) {
        await bookmark.delete().then(refreshList)
        return
    }

    const collection = _dragInfo?.collection
    if (collection) {
        await collection.delete().then(refreshList)
        return
    }
}

document.getElementById('options').onclick = () => Dialog.showOptions(_layout).then(() => _layout.save())
const btnAddCollection = document.getElementById('btnAddCollection')
btnAddCollection.onclick = () => Dialog.editCollection(null, _layout).then(refreshList)

var elEditLock = document.getElementById('editLock')
elEditLock.onclick = () => { _layout.allowEdits = !_layout.allowEdits; _layout.save().then(refreshList) }

const sitesCollection = {
    fixed: true,
    immobile: true,
    readonly: true,
    sortOrder: 0,
    icon: 'fas fa-signal fa-rotate-270',
    title: 'Most visited sites',
    bookmarks: []
}
sitesCollection.bookmarks.list = () => sitesCollection.bookmarks
if (_layout.showTopSites) {
    chrome.topSites.get((sites) => {
        for (const site of sites.filter(s => s.url !== document.location.href)) {
            sitesCollection.bookmarks.push(Tabs.asBookmark({
                id: site.id,
                title: site.title,
                url: site.url
            }, sitesCollection))
        }
    })
}
function displayTopSites() {
    const tabList = displayCollection(sitesCollection, true, true)
    tabList.id = 'topSites'
    tabList.style.gridColumn = `span ${_layout.columns}`
}

const tabCollection = {
    immobile: true,
    readonly: true,
    sortOrder: 0,
    icon: 'fas fa-window-restore',
    title: 'Active tabs',
    bookmarks: [],
    collapsed: !_layout.showTabList,
    save: async () => {
        _layout.showTabList = !tabCollection.collapsed
        await _layout.save()
    }
}
tabCollection.bookmarks.list = () => tabCollection.bookmarks
function displayAllTabs(tabs) {
    tabCollection.bookmarks.splice(0, tabCollection.bookmarks.length)
    for (const tab of tabs.sort((a, b) => a.title.localeCompare(b.title))) {
        tabCollection.bookmarks.push(Tabs.asBookmark(tab, tabCollection))
    }

    const tabList = displayCollection(tabCollection, true, true)
    tabList.id = 'tabs'
    tabList.style.gridColumn = `span ${_layout.columns}`
}
if (_layout.showTabList) {
    Tabs.subscribe((event, tabOrId) => {
        if (event === 'updated') {
            const bookmark = Tabs.asBookmark(tabOrId, tabCollection)
            const tabList = document.getElementById('tabs')

            const existingEl = document.getElementById('tab-' + bookmark.id)
            var newEl
            tabList?.display(() => {
                newEl = displayBookmark(tabCollection, bookmark, true, true)
            })
            if (existingEl) {
                existingEl.parentElement.replaceChild(newEl, existingEl)
            }
        }

        if (event === 'closed') {
            const el = document.getElementById('tab-' + tabOrId)
            if (el) {
                el.remove()
            }
        }
    })
}

await refreshList()
//await Dialog.editCollection((await _layout.collections.list())[0])
//await Dialog.editBookmark((await _layout.collections.list().then(l => l[0].bookmarks.list()))[0])

async function refreshList() {
    elTrash.style.display = _layout.allowEdits ? '' : 'none'
    btnAddCollection.style.display = _layout.allowEdits ? '' : 'none'
    elEditLock.classList.toggle('fa-lock', !_layout.allowEdits)
    elEditLock.classList.toggle('fa-unlock', _layout.allowEdits)
    elEditLock.title = _layout.allowEdits ? 'Lock for edits' : 'Allow edits'

    const collections = await _layout.collections.list()
    const tabs = await Tabs.list()

    const oldLayout = document.getElementsByTagName('layout')[0]

    document.body.display(() => {
        const elLayout = add('layout', {
            style: { gridTemplateColumns: `repeat(${_layout.columns}, 1fr)` },
            ondragover: (ev) => {
                const collection = _dragInfo?.collection
                if (collection) {
                    ev.preventDefault() // Can drop here
                    ev.dataTransfer.dropEffect = 'move'
                }
            },
            ondrop: async () => {
                if (!_dragInfo) return
                _dragInfo.dropped = true
                
                var collection = _dragInfo?.collection
                if (!collection) {
                    return
                }
                const element = _dragInfo.element

                // Position
                const siblings = element.parentElement.querySelectorAll('collection')
                const index = Array.prototype.indexOf.call(siblings, element)
                if (index >= 0) {
                    await collection.setIndex(index).then(refreshList)
                }
            }
        }, () => {
            for (const [i, collection] of collections.entries()) {
                displayCollection(collection, i === 0, i === collections.length - 1)
            }
            if (_layout.showTopSites) {
                displayTopSites()
            }
            displayAllTabs(tabs)
        })
        elLayout.classList.toggle('editable', _layout.allowEdits)

        oldLayout.replaceWith(elLayout)
    })
}
function displayCollection(collection, isFirst, isLast) {
    const elCollection = add('collection', { className: collection.collapsed ? 'collapsed' : '' }, function () {
        if (_layout.allowEdits && !collection.immobile) {
            this.ondragenter = () => {
                if (_dragInfo?.collection && elCollection !== _dragInfo.element) {
                    const startIndex = Array.prototype.indexOf.call(elCollection.parentElement.children, _dragInfo.element)
                    const targetIndex = Array.prototype.indexOf.call(elCollection.parentElement.children, elCollection)
                    if (startIndex < 0 || startIndex > targetIndex) {
                        elCollection.parentElement.insertBefore(_dragInfo.element, elCollection)
                    } else {
                        elCollection.insertAdjacentElement('afterend', _dragInfo.element)
                    }
                }
            }
            this.ondragover = (ev) => {
                const bookmark = _dragInfo?.bookmark
                if (bookmark) {
                    ev.preventDefault() // Can drop here
                    ev.dataTransfer.dropEffect = bookmark.collection.id !== collection.id && (bookmark.isTab || ev.ctrlKey) ? 'copy' : 'move'
                }
            }
            this.ondrop = async (ev) => {
                if (!_dragInfo) return
                _dragInfo.dropped = true

                var bookmark = _dragInfo?.bookmark
                if (!bookmark) {
                    return
                }
                const element = _dragInfo.element
                
                // Copy tab here
                if (bookmark.isTab) {
                    bookmark = await collection.bookmarks.create(bookmark.title, bookmark.url)
                    bookmark.icon = _dragInfo.bookmark.icon
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
                const siblings = element.parentElement.querySelectorAll('bookmark')
                const index = Array.prototype.indexOf.call(siblings, element)
                if (index >= 0) {
                    await bookmark.setIndex(index).then(refreshList)
                }
            }
        }

        add('title', { draggable: _layout.allowEdits && !collection.immobile }, function () {
            this.onclick = () => {
                if (!collection.fixed) {
                    collection.collapsed = !collection.collapsed
                    collection.save().then(refreshList)
                }
            }

            if (_layout.allowEdits && !collection.immobile) {
                this.ondragstart = (ev) => {
                    if (!_layout.allowEdits) {
                        ev.preventDefault()
                        return
                    }
    
                    ev.stopPropagation()
                    ev.dataTransfer.effectAllowed = 'move'
                    _dragInfo = { collection: collection, element: elCollection, origin: elCollection.nextSibling }
                    elCollection.style.opacity = 0.5
                    elTrash.classList.add('active')
                }
                this.ondragend = () => {
                    if (_dragInfo && !_dragInfo.dropped) {
                        _dragInfo.origin.parentElement.insertBefore(elCollection, _dragInfo.origin)
                    }
                    elCollection.style.opacity = null
                    elTrash.classList.remove('active')
                    _dragInfo = null
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
            if (_layout.allowEdits && !collection.readonly) {
                add('div', { className: 'actions' }, () => {
                    if (!isFirst) {
                        iconButton('fas fa-arrow-up', 'Move up', () => collection.setIndex(collection.index - 1).then(refreshList))
                    }
                    if (!isLast) {
                        iconButton('fas fa-arrow-down', 'Move down', () => collection.setIndex(collection.index + 1).then(refreshList))
                    }
                    iconButton('fas fa-pen', 'Edit collection', () => Dialog.editCollection(collection).then(refreshList))
                })
            }
        })

        // Bookmarks
        if (!collection.collapsed) {
            const bookmarks = collection.bookmarks.list()
            for (var i = 0; i < bookmarks.length; ++i) {
                displayBookmark(collection, bookmarks[i], i == 0, i == bookmarks.length - 1)
            }

            if (_layout.allowEdits && !collection.readonly) {
                add('bookmark', {
                    className: 'add',
                    title: 'Add bookmark',
                    onclick: () => Dialog.editBookmark(null, collection).then(refreshList),
                    ondragenter: function () {
                        if (_dragInfo?.bookmark) {
                            this.parentElement.insertBefore(_dragInfo.element, this)
                        }
                    }
                }, () => add('i', { className: 'fa-fw fas fa-plus', title: 'Add bookmark' }))
            }
        }
    })
    return elCollection
}
function displayBookmark(collection, bookmark, isFirst, isLast) {
    return add('bookmark', {
        id: (bookmark.isTab ? 'tab-' : 'bookmark-') + bookmark.id,
        className: bookmark.favourite ? 'favourite' : '',
        draggable: _layout.allowEdits,
        ondragstart: function (ev) {
            if (!_layout.allowEdits) {
                ev.preventDefault()
                return
            }

            ev.stopPropagation()
            ev.dataTransfer.effectAllowed = bookmark.isTab ? 'copy' : 'copyMove'
            _dragInfo = { bookmark: bookmark, element: this, origin: this.nextSibling }
            this.style.opacity = 0.5
            if (!bookmark.isTab) {
                elTrash.classList.add('active')
            }
        },
        ondragenter: function () {
            if (_dragInfo?.bookmark && !bookmark.isTab && _dragInfo.bookmark.collection.sortOrder === 0) {
                var target = !_dragInfo.bookmark.favourite ? this : this.parentElement.querySelectorAll('bookmark:first-of-type')[0]
                if (target !== _dragInfo.element && target !== _dragInfo.lastTarget) {
                    const startIndex = Array.prototype.indexOf.call(target.parentElement.children, _dragInfo.element)
                    const targetIndex = Array.prototype.indexOf.call(target.parentElement.children, target)
                    if (startIndex < 0 || startIndex > targetIndex) {
                        target.parentElement.insertBefore(_dragInfo.element, target)
                    } else {
                        target.insertAdjacentElement('afterend', _dragInfo.element)
                    }
                    _dragInfo.lastTarget = target
                }
            }
        },
        ondragend: function () {
            if (_dragInfo && !_dragInfo.dropped) {
                _dragInfo.origin.parentElement.insertBefore(this, _dragInfo.origin)
            }
            this.style.opacity = null
            elTrash.classList.remove('active')
            _dragInfo = null
        }
    }, function () {
        if (bookmark.isTab) {
            this.classList.add('tab')
        }

        add('a', {
            title: bookmark.url,
            href: bookmark.url,
            target: _layout.openNewTab ? '_blank' : '',
            onclick: (ev) => bookmark.click(ev, _layout.openExistingTab),
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
            if (!icon.includes('fa-') && !icon.startsWith('chrome:') && _layout.showFavicons) {
                var imgIcon = add('img', { src: icon, className: 'icon', style: 'display:none' })
                imgIcon.onload = () => {
                    faIcon.replaceWith(imgIcon)
                    imgIcon.style.display = ''
                }
            }

            if (_layout.allowEdits && !collection.readonly) {
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

            add('span', bookmark.title, { className: 'title' })

            if (_layout.allowEdits && !collection.readonly) {
                add('div', { className: 'actions' }, () => {
                    if (collection.sortOrder === 0) {
                        if (!isFirst) {
                            iconButton('fas fa-arrow-up', 'Move up', () => bookmark.setIndex(bookmark.index - 1).then(refreshList))
                        }
                        if (!isLast) {
                            iconButton('fas fa-arrow-down', 'Move down', () => bookmark.setIndex(bookmark.index + 1).then(refreshList))
                        }
                    }
                    iconButton('fas fa-pen', 'Edit bookmark', () => Dialog.editBookmark(bookmark).then(refreshList))
                })
            }
        })
    })
}