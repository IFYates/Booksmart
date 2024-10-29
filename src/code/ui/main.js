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
            this.ondragover = (ev) => {
                const bookmark = MainView.dragInfo?.bookmark
                const folder = MainView.dragInfo?.folder
                if ((bookmark && !bookmark.isTab) || folder) {
                    ev.preventDefault()
                    ev.dataTransfer.dropEffect = 'move'
                    this.classList.replace('fa-dumpster', 'fa-dumpster-fire')
                }
            }
            this.ondragleave = () => {
                this.classList.replace('fa-dumpster-fire', 'fa-dumpster')
            }
            this.ondrop = () => {
                this.ondragleave()

                const bookmark = MainView.dragInfo?.bookmark
                if (bookmark && !bookmark.isTab) {
                    return bookmark.delete().then(MainView.fullRefresh)
                }

                const folder = MainView.dragInfo?.folder
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
                MainView.displayAllTabs()
            }
        })
    }

    static setTheme() {
        document.documentElement.style.setProperty('--accent-colour-hue', MainView.layout.themeAccent[0])
        document.documentElement.style.setProperty('--accent-colour-saturation', `${MainView.layout.themeAccent[1]}%`)
        document.documentElement.style.setProperty('--accent-colour-lightness', '24%')
        document.documentElement.style.setProperty('--text-colour', '#eee')
        document.documentElement.style.setProperty('--layout-columns', MainView.layout.columns)
        document.body.style.backgroundImage = MainView.layout.backgroundImage ? `url(${MainView.layout.backgroundImage})` : null
    }

    static async fullRefresh() {
        MainView.setTheme()

        MainView.elTrash.style.visibility = MainView.layout.allowEdits ? null : 'hidden'
        MainView.btnAddFolder.style.visibility = MainView.layout.allowEdits ? null : 'hidden'
        MainView.elEditLock.classList.toggle('fa-lock', !MainView.layout.allowEdits)
        MainView.elEditLock.classList.toggle('fa-unlock', MainView.layout.allowEdits)
        MainView.elEditLock.title = MainView.layout.allowEdits ? 'Lock for edits' : 'Allow edits'

        const folders = await MainView.layout.folders.entries()

        document.body.display(() => {
            add('layout', function () {
                MainView.elLayout = this

                this.ondragover = (ev) => {
                    const folder = MainView.dragInfo?.folder
                    if (folder) {
                        ev.preventDefault() // Can drop here
                        ev.dataTransfer.dropEffect = 'move'
                    }
                }
                this.ondrop = async () => {
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
                        await folder.setIndex(index).then(MainView.displayAllTabs)
                    }
                }

                if (!folders.length) {
                    FolderView.displayEmpty()
                }
                for (const folder of folders) {
                    FolderView.display(folder)
                }
                if (MainView.layout.showTopSites) {
                    MainView.displayTopSites()
                }
                MainView.displayAllTabs()
                this.classList.toggle('editable', MainView.layout.allowEdits)
            })

            // Swap
            const oldLayout = document.getElementsByTagName('layout')[0]
            oldLayout.replaceWith(MainView.elLayout)
        })
    }

    static refreshFolder(folder) {
        if (folder.id === 'tabs') {
            MainView.displayAllTabs()
            return
        }

        MainView.elLayout.display(() => {
            const folderOld = document.getElementById('folder-' + folder.id)
            const folderNew = FolderView.create(folder)
            folderOld?.replaceWith(folderNew)
        })
    }

    static displayTopSites() {
        const tabList = FolderView.display(MainView.sitesFolder)
        tabList.style.gridColumn = `span ${MainView.layout.columns}`

        chrome.topSites.get((sites) => {
            MainView.sitesFolder.bookmarks.splice(0, MainView.sitesFolder.bookmarks.length)
            for (const site of sites.filter(s => s.url !== document.location.href)) {
                MainView.sitesFolder.bookmarks.push(new Bookmark(null, {
                    title: site.title,
                    url: site.url
                }, {}))
            }

            const tabList = FolderView.update(MainView.sitesFolder)
            tabList.style.gridColumn = `span ${MainView.layout.columns}`
        })
    }

    static displayAllTabs() {
        // Rebuild list
        MainView.tabFolder.bookmarks.splice(0, MainView.tabFolder.bookmarks.length)
        var lastWindowId = 0
        for (const tab of MainView.tabs) {
            if (lastWindowId && lastWindowId !== tab.windowId) {
                MainView.tabFolder.bookmarks.push({ type: 'separator' })
            }
            lastWindowId = tab.windowId
            MainView.tabFolder.bookmarks.push(Tabs.asBookmark(tab, MainView.tabFolder))
        }

        // Rebuild view
        MainView.elLayout.display(() => {
            const tabListOld = document.getElementById('folder-tabs')

            const tabList = FolderView.display(MainView.tabFolder)
            tabList.style.gridColumn = `span ${MainView.layout.columns}`

            tabListOld?.remove()
        })
    }
}

import Bookmark from '../models/bookmark.js'
import Dialogs from './dialogs.js'
import FolderView from '../viewModels/folderView.js'
import Tabs from '../models/tabs.js'
