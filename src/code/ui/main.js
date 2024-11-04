// TODO: obsolete / reduce
export default class MainView {
    static layoutX

    static elLayout
    static elEditLock = document.getElementById('editLock')
    static elTrash = document.getElementById('trash')

    static async init() {
        MainView.setTheme()        
        const layout = MainView.layoutX
        layout.onchange = () => MainView.fullRefresh()

        MainView.elTrash.display(function () {
            const drag = new DropHandler(this)
            drag.ondragover = (ev, state) => {
                const bookmark = state?.bookmark
                const folder = state?.folder
                if ((bookmark && !bookmark.readonly) || folder) {
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
                state.dropped = true

                const bookmark = state?.bookmark
                if (bookmark && !bookmark.readonly) {
                    state.element.remove()
                    return State.deleteBookmark(bookmark)
                }

                const folder = state?.folder
                if (folder) {
                    state.element.remove()
                    return State.deleteFolder(folder)
                }
            }
        })

        document.getElementById('info')
            .onclick = () => Dialogs.info()

        document.getElementById('options')
            .onclick = () => Dialogs.options(layout).then(() => layout.reload().then(MainView.fullRefresh))

        MainView.elEditLock.onclick = () => {
            State.options.allowEdits = !State.options.allowEdits
            State.save()
            MainView.fullRefresh()

            document.getElementsByTagName(customElements.getName(FolderAddElement))[0].style.visibility = !layout.allowEdits ? 'hidden' : null
        }
    }

    static setTheme(accentColour = null) {
        accentColour ??= State.options.accentColour
        document.documentElement.style.setProperty('--accent-colour', accentColour)
        document.documentElement.style.setProperty('--accent-colour-r', accentColour.substring(1, 3).fromHex())
        document.documentElement.style.setProperty('--accent-colour-g', accentColour.substring(3, 5).fromHex())
        document.documentElement.style.setProperty('--accent-colour-b', accentColour.substring(5, 7).fromHex())
        // document.documentElement.style.setProperty('--accent-colour-hue', State.options.themeAccent[0])
        // document.documentElement.style.setProperty('--accent-colour-saturation', `${State.options.themeAccent[1]}%`)
        // document.documentElement.style.setProperty('--accent-colour-lightness', '24%')
        document.documentElement.style.setProperty('--text-colour', '#eee') // TODO
        document.documentElement.style.setProperty('--layout-columns', State.options.columns === -1 ? '100%' : State.options.columns + 'px')
        document.body.style.backgroundImage = State.options.backgroundImage ? `url(${State.options.backgroundImage})` : null

        if (State.options.scale && State.options.scale != 100) {
            document.getElementsByTagName('layout')[0].style.zoom = `${State.options.scale}%`
        }
    }

    static async fullRefresh() {
        MainView.elTrash.style.visibility = State.options.allowEdits ? null : 'hidden'
        MainView.elEditLock.classList.toggle('fa-lock', !State.options.allowEdits)
        MainView.elEditLock.classList.toggle('fa-unlock', State.options.allowEdits)
        MainView.elEditLock.title = State.options.allowEdits ? 'Lock for edits' : 'Allow edits'

        document.body.display(() => {
            add('layout', function () {
                MainView.elLayout = this
                if (!State.folderCount) {
                    this.appendChild(new NoFoldersElement())
                }
                for (const folder of Object.values(State.folders).sort((a, b) => a.index - b.index)) {
                    this.appendChild(new FolderElement(folder))
                }
                if (State.options.showTopSites) {
                    this.appendChild(SiteListElement.instance)
                }
                this.appendChild(TabListElement.instance)
                this.classList.toggle('editable', State.options.allowEdits)
            })

            // Swap
            const oldLayout = document.getElementsByTagName('layout')[0]
            oldLayout.replaceWith(MainView.elLayout)
        })

        MainView.setTheme()

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

            const folderEl = document.getElementsByTagName(customElements.getName(FolderElement))[0]
            await folderEl.reindexSiblings()
            await State.save()
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
import { TabListElement } from './elements/TabListElement.js'
import State from '../models/state.js'
globalThis.MainView = MainView // TODO: drop