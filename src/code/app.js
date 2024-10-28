import './html.js'
import './display.js'
import './utilities.js'

import Dialogs from './dialogs.js'
import Layout from './models/layout.js'
import Tabs from './tabs.js'
import MainView from "./viewModels/main.js"
import BookmarkView from './viewModels/bookmarkView.js'
import FolderView from './viewModels/folderView.js'

var _layout = await Layout.load()
_layout.onchange = () => refreshList()

const elTrash = document.getElementById('trash')
elTrash.ondragover = (ev) => {
    const bookmark = MainView.dragInfo?.bookmark
    const folder = MainView.dragInfo?.folder
    if ((bookmark && !bookmark.isTab) || folder) {
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

    const folder = MainView.dragInfo?.folder
    if (folder) {
        await folder.delete().then(refreshList)
        return
    }
}

const elInfo = document.getElementById('info')
elInfo.onclick = () => Dialogs.info()

document.getElementById('options').onclick = () => Dialogs.options(_layout).then(() => _layout.reload().then(refreshList))
const btnAddFolder = document.getElementById('btnAddFolder')
btnAddFolder.onclick = () => Dialogs.newFolder(_layout).then(refreshList)

var elEditLock = document.getElementById('editLock')
elEditLock.onclick = () => { _layout.allowEdits = !_layout.allowEdits; _layout.save().then(refreshList) }

const sitesFolder = {
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
sitesFolder.bookmarks.list = () => sitesFolder.bookmarks
if (_layout.showTopSites) {
    chrome.topSites.get((sites) => {
        for (const site of sites.filter(s => s.url !== document.location.href)) {
            sitesFolder.bookmarks.push(Tabs.asBookmark({
                id: site.id,
                title: site.title,
                url: site.url
            }, sitesFolder))
        }
    })
}
function displayTopSites() {
    const tabList = FolderView.display(_layout, sitesFolder, true, true, refreshList)
    tabList.id = 'topSites'
    tabList.style.gridColumn = `span ${_layout.columns}`
}

const tabFolder = {
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
        _layout.showTabList = !tabFolder.collapsed
        await _layout.save()
    }
}
tabFolder.bookmarks.list = () => tabFolder.bookmarks
function displayAllTabs(tabs) {
    tabFolder.bookmarks.splice(0, tabFolder.bookmarks.length)
    var lastWindowId = 0
    for (const tab of tabs) {
        if (lastWindowId && lastWindowId !== tab.windowId) {
            tabFolder.bookmarks.push({ type: 'separator' })
        }
        lastWindowId = tab.windowId
        tabFolder.bookmarks.push(Tabs.asBookmark(tab, tabFolder))
    }

    const tabList = FolderView.display(_layout, tabFolder, true, true, refreshList)
    tabList.id = 'tabs'
    tabList.style.gridColumn = `span ${_layout.columns}`
}
if (_layout.showTabList) {
    Tabs.subscribe((event, tabOrId) => {
        switch (event) {
            case 'updated':
                const bookmark = Tabs.asBookmark(tabOrId, tabFolder)
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
// await Dialogs.newBookmark(_layout.folders[0]); await refreshList()
// await Dialogs.editBookmark(_layout.folders[0].bookmarks.list()[0]); await refreshList()
// await Dialogs.newFolder(_layout); await refreshList()
// await Dialogs.editFolder(_layout.folders[0]); await refreshList()
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
    btnAddFolder.style.visibility = _layout.allowEdits ? null : 'hidden'
    elEditLock.classList.toggle('fa-lock', !_layout.allowEdits)
    elEditLock.classList.toggle('fa-unlock', _layout.allowEdits)
    elEditLock.title = _layout.allowEdits ? 'Lock for edits' : 'Allow edits'

    const oldLayout = document.getElementsByTagName('layout')[0]

    const folders = await _layout.folders.entries()
    const tabs = await tabsPromise

    document.body.display(() => {
        const elLayout = add('layout', {
            style: `grid-template-columns:repeat(${_layout.columns}, 1fr)`,
            ondragover: (ev) => {
                const folder = MainView.dragInfo?.folder
                if (folder) {
                    ev.preventDefault() // Can drop here
                    ev.dataTransfer.dropEffect = 'move'
                }
            },
            ondrop: async () => {
                if (!MainView.dragInfo) return
                MainView.dragInfo.dropped = true

                var folder = MainView.dragInfo?.folder
                if (!folder) {
                    return
                }
                const element = MainView.dragInfo.element

                // Position
                const siblings = [...element.parentElement.querySelectorAll('folder')]
                const index = siblings.indexOf(element)
                if (index >= 0) {
                    await folder.setIndex(index).then(refreshList)
                }
            }
        }, () => {
            for (const [i, folder] of folders.entries()) {
                FolderView.display(_layout, folder, i === 0, i === folders.length - 1, refreshList)
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
    [...document.querySelectorAll('bookmark span, folder title span')].forEach(n => n.classList.toggle('obfuscated', on))
}