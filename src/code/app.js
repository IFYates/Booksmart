import './html.js'
import './display.js'
import './utilities.js'

import Dialogs from './dialogs.js'
import Layout from './models/layout.js'
import Tabs from './tabs.js'
import MainView from "./viewModels/main.js"
import BookmarkView from './viewModels/bookmarkView.js'
import CollectionView from './viewModels/collectionView.js'

var _layout = await Layout.load()
_layout.onchange = () => refreshList()

const elTrash = document.getElementById('trash')
elTrash.ondragover = (ev) => {
    const bookmark = MainView.dragInfo?.bookmark
    const collection = MainView.dragInfo?.collection
    if ((bookmark && !bookmark.isTab) || collection) {
        ev.preventDefault()
        ev.dataTransfer.dropEffect = 'move'
        elTrash.classList.replace('fa-dumpster', 'fa-dumpster-fire')
    }
}
elTrash.ondragleave = () => {
    elTrash.classList.replace('fa-dumpster-fire', 'fa-dumpster')
}
elTrash.ondrop = async () => {
    elTrash.ondragleave()

    const bookmark = MainView.dragInfo?.bookmark
    if (bookmark && !bookmark.isTab) {
        await bookmark.delete().then(refreshList)
        return
    }

    const collection = MainView.dragInfo?.collection
    if (collection) {
        await collection.delete().then(refreshList)
        return
    }
}

const elInfo = document.getElementById('info')
elInfo.onclick = () => Dialogs.info()

document.getElementById('options').onclick = () => Dialogs.options(_layout).then(() => _layout.reload().then(refreshList))
const btnAddCollection = document.getElementById('btnAddCollection')
btnAddCollection.onclick = () => Dialogs.newCollection(_layout).then(refreshList)

var elEditLock = document.getElementById('editLock')
elEditLock.onclick = () => { _layout.allowEdits = !_layout.allowEdits; _layout.save().then(refreshList) }

const sitesCollection = {
    isExternal: true,
    fixed: true,
    immobile: true,
    readonly: true,
    sortOrder: 0,
    icon: 'fas fa-signal fa-rotate-270',
    title: 'Most visited sites',
    layout: _layout,
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
    const tabList = CollectionView.display(_layout, sitesCollection, true, true, refreshList)
    tabList.id = 'topSites'
    tabList.style.gridColumn = `span ${_layout.columns}`
}

const tabCollection = {
    isExternal: true,
    immobile: true,
    readonly: true,
    sortOrder: 0,
    icon: 'fas fa-window-restore',
    title: 'Open tabs',
    layout: _layout,
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
    var lastWindowId = 0
    for (const tab of tabs) {
        if (lastWindowId && lastWindowId !== tab.windowId) {
            tabCollection.bookmarks.push({ type: 'separator' })
        }
        lastWindowId = tab.windowId
        tabCollection.bookmarks.push(Tabs.asBookmark(tab, tabCollection))
    }

    const tabList = CollectionView.display(_layout, tabCollection, true, true, refreshList)
    tabList.id = 'tabs'
    tabList.style.gridColumn = `span ${_layout.columns}`
}
if (_layout.showTabList) {
    Tabs.subscribe((event, tabOrId) => {
        switch (event) {
            case 'updated':
                const bookmark = Tabs.asBookmark(tabOrId, tabCollection)
                const tabList = document.getElementById('tabs')
                
                const existingEl = document.getElementById('tab-' + bookmark.id)
                var newEl
                tabList?.display(() => {
                    newEl = BookmarkView.display(_layout, bookmark, true, true, refreshList)
                })
                if (existingEl) {
                    existingEl.parentElement.replaceChild(newEl, existingEl)
                }
                break
            case 'closed':
                const el = document.getElementById('tab-' + tabOrId)
                if (el) {
                    el.remove()
                }
                break
        }
    })
}

await refreshList()
// await Dialogs.newBookmark(_layout.collections[0]); await refreshList()
// await Dialogs.editBookmark(_layout.collections[0].bookmarks.list()[0]); await refreshList()
// await Dialogs.newCollection(_layout); await refreshList()
// await Dialogs.editCollection(_layout.collections[0]); await refreshList()
// await Dialogs.options(_layout); await refreshList()
// await Dialogs.info(_layout); await refreshList()
// await Dialogs.importBookmarks(_layout); await refreshList()

function setTheme(layout) {
    document.documentElement.style.setProperty('--accent-colour-hue', layout.themeAccent[0])
    document.documentElement.style.setProperty('--accent-colour-saturation', `${layout.themeAccent[1]}%`)
    document.documentElement.style.setProperty('--accent-colour-lightness', '24%')
    document.documentElement.style.setProperty('--text-colour', '#eee')
    document.body.style.backgroundImage = layout.backgroundImage ? `url(${layout.backgroundImage})` : null
}
async function refreshList() {
    const tabsPromise = Tabs.list()

    setTheme(_layout)

    elTrash.style.visibility = _layout.allowEdits ? null : 'hidden'
    btnAddCollection.style.visibility = _layout.allowEdits ? null : 'hidden'
    elEditLock.classList.toggle('fa-lock', !_layout.allowEdits)
    elEditLock.classList.toggle('fa-unlock', _layout.allowEdits)
    elEditLock.title = _layout.allowEdits ? 'Lock for edits' : 'Allow edits'

    const oldLayout = document.getElementsByTagName('layout')[0]

    const collections = await _layout.collections.entries()
    const tabs = await tabsPromise

    document.body.display(() => {
        const elLayout = add('layout', {
            style: `grid-template-columns:repeat(${_layout.columns}, 1fr)`,
            ondragover: (ev) => {
                const collection = MainView.dragInfo?.collection
                if (collection) {
                    ev.preventDefault() // Can drop here
                    ev.dataTransfer.dropEffect = 'move'
                }
            },
            ondrop: async () => {
                if (!MainView.dragInfo) return
                MainView.dragInfo.dropped = true

                var collection = MainView.dragInfo?.collection
                if (!collection) {
                    return
                }
                const element = MainView.dragInfo.element

                // Position
                const siblings = [...element.parentElement.querySelectorAll('collection')]
                const index = siblings.indexOf(element)
                if (index >= 0) {
                    await collection.setIndex(index).then(refreshList)
                }
            }
        }, () => {
            for (const [i, collection] of collections.entries()) {
                CollectionView.display(_layout, collection, i === 0, i === collections.length - 1, refreshList)
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

// Blur sensitive content
globalThis.obfuscate = (on = true) => {
    [...document.querySelectorAll('bookmark span, collection title span')].forEach(n => n.classList.toggle('obfuscated', on))
}