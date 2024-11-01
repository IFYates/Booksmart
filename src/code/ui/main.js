/*
View model for the main window.
*/
export default class MainView {
    static dragInfo = null
    static layout

    static tabFolder = {
        id: 'tabs',
        isOwned: true,
        immobile: true,
        readonly: true,
        fullWidth: true,
        sortOrder: 0,
        icon: 'fas fa-window-restore',
        title: 'Open tabs',
        layout: null,
        bookmarks: [],
        collapsed: null,
        save: async () => {
            MainView.layout.showTabList = !MainView.tabFolder.collapsed
            await MainView.layout.save()
        }
    }
    static tabs = [] // TODO: fold in to tabFolder.bookmarks
    static sitesFolder = {
        id: 'topSites',
        isOwned: true,
        fixed: true,
        immobile: true,
        readonly: true,
        fullWidth: true,
        sortOrder: 0,
        icon: 'fas fa-signal fa-rotate-270',
        title: 'Most visited sites',
        layout: null,
        bookmarks: []
    }

    static btnAddFolder = document.getElementById('btnAddFolder')
    static elLayout
    static elEditLock = document.getElementById('editLock')
    static elTrash = document.getElementById('trash')

    static async init() {
        const layout = MainView.layout
        layout.onchange = () => MainView.fullRefresh()

        MainView.elTrash.display(function () {
            const drag = new DropHandler(this)
            drag.ondragover = (ev, state) => {
                const bookmark = state?.bookmark
                const folder = state?.folder
                if ((bookmark && !bookmark.isTab) || folder) {
                    ev.preventDefault()
                    ev.dataTransfer.dropEffect = 'move'
                    this.classList.replace('fa-dumpster', 'fa-dumpster-fire')
                }
            }
            drag.ondragleave = () => {
                this.classList.replace('fa-dumpster-fire', 'fa-dumpster')
            }
            drag.ondrop = (ev, state) => {
                drag.ondragleave()

                const bookmark = state?.bookmark
                if (bookmark && !bookmark.isTab) {
                    return bookmark.delete().then(MainView.fullRefresh)
                }

                const folder = state?.folder
                if (folder) {
                    return folder.delete().then(MainView.fullRefresh)
                }
            }
        })

        document.getElementById('info')
            .onclick = () => Dialogs.info()

        document.getElementById('options')
            .onclick = () => Dialogs.options(layout).then(() => layout.reload().then(MainView.fullRefresh))

        MainView.btnAddFolder.onclick = () => Dialogs.newFolder(layout).then(MainView.fullRefresh)

        MainView.elEditLock.onclick = () => {
            layout.allowEdits = !layout.allowEdits
            layout.save().then(MainView.fullRefresh)
        }

        MainView.sitesFolder.layout = layout
        MainView.sitesFolder.bookmarks.list = () => MainView.sitesFolder.bookmarks
        if (layout.showTopSites) {
            chrome.topSites.get((sites) => {
                for (const site of sites.filter(s => s.url !== document.location.href)) {
                    MainView.sitesFolder.bookmarks.push(Tabs.asBookmark({
                        id: site.id,
                        title: site.title,
                        url: site.url
                    }, MainView.sitesFolder))
                }
            })
        }

        MainView.tabFolder.layout = layout
        MainView.tabFolder.collapsed = !layout.showTabList
        MainView.tabFolder.bookmarks.list = () => MainView.tabFolder.bookmarks
        MainView.tabs = await Tabs.list()
        Tabs.subscribe(async () => {
            MainView.tabs = await Tabs.list()
            if (!MainView.tabFolder.collapsed) {
                MainView.updateTabsList()
            }
        })
    }

    static setTheme() {
        document.documentElement.style.setProperty('--accent-colour-hue', MainView.layout.themeAccent[0])
        document.documentElement.style.setProperty('--accent-colour-saturation', `${MainView.layout.themeAccent[1]}%`)
        document.documentElement.style.setProperty('--accent-colour-lightness', '24%')
        document.documentElement.style.setProperty('--text-colour', '#eee')
        document.documentElement.style.setProperty('--layout-columns', MainView.layout.columns === -1 ? '100%' : MainView.layout.columns + 'px')
        document.body.style.backgroundImage = MainView.layout.backgroundImage ? `url(${MainView.layout.backgroundImage})` : null
    }

    static async fullRefresh() {
        MainView.setTheme()

        MainView.elTrash.style.visibility = MainView.layout.allowEdits ? null : 'hidden'
        MainView.btnAddFolder.style.visibility = MainView.layout.allowEdits ? null : 'hidden'
        MainView.elEditLock.classList.toggle('fa-lock', !MainView.layout.allowEdits)
        MainView.elEditLock.classList.toggle('fa-unlock', !!MainView.layout.allowEdits)
        MainView.elEditLock.title = MainView.layout.allowEdits ? 'Lock for edits' : 'Allow edits'

        const folders = await MainView.layout.folders.entries()

        document.body.display(() => {
            add('layout', function () {
                MainView.elLayout = this
                if (!folders.length) {
                    this.appendChild(new NoFoldersElement())
                }
                for (const folder of folders) {
                    add(new FolderElement(folder))
                }
                if (MainView.layout.showTopSites) {
                    FolderView.display(MainView.sitesFolder)
                    MainView.updateTopSitesList()
                }
                MainView.updateTabsList(false)
                this.classList.toggle('editable', !!MainView.layout.allowEdits)
            })

            // Swap
            const oldLayout = document.getElementsByTagName('layout')[0]
            oldLayout.replaceWith(MainView.elLayout)
        })

        const drag = new DropHandler(MainView.elLayout)
        drag.ondragover = (ev, state) => {
            const folder = state?.folder
            if (folder) {
                ev.preventDefault() // Can drop here
                ev.dataTransfer.dropEffect = 'move'
            }
        }
        drag.ondrop = async (ev, state) => {
            const folder = state?.folder
            if (!folder) {
                return
            }
            state.dropped = true

            // Place folder
            if (folder.previous) folder.previous.next = folder.next
            if (folder.next) folder.next.previous = folder.previous
            folder.previous = state.element.previousSibling?.folder
            if (folder.previous) folder.previous.next = folder
            folder.next = state.element.nextSibling?.folder
            if (folder.next) folder.next.previous = folder
            await folder.reindexAll()
            MainView.fullRefresh()
        }
    }

    static updateTopSitesList() {
        chrome.topSites.get((sites) => {
            MainView.sitesFolder.bookmarks.splice(0, MainView.sitesFolder.bookmarks.length)
            for (const site of sites.filter(s => s.url !== document.location.href)) {
                MainView.sitesFolder.bookmarks.push(new Bookmark(null, {
                    title: site.title,
                    url: site.url
                }, {}))
            }
        })
    }

    static updateTabsList(inplace = true) {
        // Rebuild list
        MainView.tabFolder.bookmarks.splice(0, MainView.tabFolder.bookmarks.length)
        var lastWindowId = 0
        for (const tab of MainView.tabs.sort((a, b) => (a.windowId - b.windowId) || (a.index - b.index))) {
            // TODO
            // if (lastWindowId && lastWindowId !== tab.windowId) {
            //     MainView.tabFolder.bookmarks.push({ type: 'separator' })
            // }
            //lastWindowId = tab.windowId
            MainView.tabFolder.bookmarks.push(Tabs.asBookmark(tab, MainView.tabFolder))
        }

        const el = document.getElementById('folder-' + MainView.tabFolder.id)
        if (el && inplace) {
            el.replaceWith(new FolderElement(MainView.tabFolder))
        } else {
            el?.remove()
            MainView.elLayout.appendChild(new FolderElement(MainView.tabFolder))
        }
    }
}

import Bookmark from '../models/bookmark.js'
import Dialogs from './dialogs.js'
import { FolderElement, FolderView } from '../viewModels/folderView.js'
import Tabs from '../models/tabs.js'
import { DropHandler } from '../common/html.js'
import { NoFoldersElement } from '../viewModels/bookmarkView.js'
globalThis.MainView = MainView