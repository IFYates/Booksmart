// TODO: obsolete / reduce
export default class MainView {
    static layout

    static elLayout
    static elEditLock = document.getElementById('editLock')
    static elTrash = document.getElementById('trash')

    static async init() {
        MainView.setTheme()        
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

        MainView.elEditLock.onclick = () => {
            layout.allowEdits = !layout.allowEdits
            layout.save().then(MainView.fullRefresh)

            document.getElementsByTagName(customElements.getName(FolderAddElement))[0].style.visibility = !layout.allowEdits ? 'hidden' : null
        }
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
                    this.appendChild(new FolderElement(folder))
                }
                if (MainView.layout.showTopSites) {
                    this.appendChild(SiteListElement.instance)
                }
                this.appendChild(TabListElement.instance)
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

    static updateTabsList(inplace = true) {
        // Rebuild list
        MainView.tabFolder.bookmarks.splice(0, MainView.tabFolder.bookmarks.length)
        var lastWindowId = 0
        for (const tab of MainView.tabs) {
            // TODO
            // if (lastWindowId && lastWindowId !== tab.windowId) {
            //     MainView.tabFolder.bookmarks.push({ type: 'separator' })
            // }
            //lastWindowId = tab.windowId
            MainView.tabFolder.bookmarks.push(tab)
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

import Dialogs from './dialogs.js'
import { DropHandler } from '../common/html.js'
import { FolderElement } from './elements/folder.js'
import { FolderAddElement } from './elements/folderAdd.js'
import { NoFoldersElement } from './elements/noFolders.js'
import { SiteListElement } from './elements/sites.js'
import { TabListElement } from './elements/tabs.js'
globalThis.MainView = MainView // TODO: drop