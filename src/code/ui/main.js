
import './elements/TagElement.js'

import Dialogs from './dialogs.js'
import { FolderElement } from './elements/folder.js'
import { FolderAddElement } from './elements/folderAdd.js'
import { NoFoldersElement } from './elements/noFolders.js'
import { SiteListElement } from './elements/sites.js'
import { TabListElement } from './elements/TabListElement.js'
import State from '../models/state.js'
import TagElement from './elements/TagElement.js'
import TagsDialog from './dialog/TagsDialog.js'

export default class MainView {
    static elLayout
    static elEditLock = document.getElementById('editLock')
    static elTrash = document.getElementById('trash')

    static async init() {
        await State.init()
        MainView.setTheme()

        document.getElementById('tagEdit').display((el) => {
            el.onclick = async () => {
                await new TagsDialog().show()
                el.layout()
                MainView.fullRefresh()
            }

            el.clearChildren()
            add('i', { className: 'fa-fw fas fa-tags', title: 'Manage tags' })
            if (!State.options.tags?.length) {
                add('span', ' No tags')
            } else {
                for (const tag of State.options.tags.sort((a, b) => a.name.localeCompare(b.name))) {
                    add(new TagElement(tag))
                }
            }
        })
        document.getElementById('info')
            .onclick = () => Dialogs.info()

        document.getElementById('options')
            .onclick = () => Dialogs.options() // TODO: .then(() => State.options.reload()
                .then(MainView.fullRefresh)

        MainView.elEditLock.onclick = () => {
            State.options.allowEdits = !State.options.allowEdits
            State.save()
            MainView.fullRefresh()

            document.getElementsByTagName(customElements.getName(FolderAddElement))[0]
                .style.visibility = !State.options.allowEdits ? 'hidden' : null
        }
    }

    static #count = 100
    static setTheme(accentColour = null, element = null) {
        element ??= document.documentElement

        if (element == document.documentElement) {
            element.style.setProperty('--layout-columns', State.options.columns == -1 ? '100%' : State.options.columns + 'px')
            if (document.getElementsByTagName('layout')[0]) {
                document.getElementsByTagName('layout')[0].style.zoom = (State.options.scale && State.options.scale != 100) ? `${State.options.scale}%` : ''
            }

            if (State.options.backgroundImage == 'daily') {
                const bg = State.options.getDailyBackground()
                if (!bg) {
                    State.options.resolveDailyBackground()
                        .then(() => {
                            if (--MainView.#count > 0) {
                                this.setTheme(accentColour, element)
                            }
                        })
                } else {
                    document.body.style.backgroundImage = `url(${bg.url})`
                    accentColour = bg.accentColour
                }
            } else {
                document.body.style.backgroundImage = State.options.backgroundImage ? `url(${State.options.backgroundImage})` : null
            }
            accentColour ??= State.options.accentColour
        }

        if (accentColour) {
            element.style.setProperty('--accent-colour', accentColour)
            element.style.setProperty('--accent-colour-r', parseInt(accentColour.substring(1, 3), 16))
            element.style.setProperty('--accent-colour-g', parseInt(accentColour.substring(3, 5), 16))
            element.style.setProperty('--accent-colour-b', parseInt(accentColour.substring(5, 7), 16))
            // element.style.setProperty('--accent-colour-hue', State.options.themeAccent[0])
            // element.style.setProperty('--accent-colour-saturation', `${State.options.themeAccent[1]}%`)
            // element.style.setProperty('--accent-colour-lightness', '24%')
            element.style.setProperty('--theme-colour-shade', 'rgb(calc(var(--accent-colour-r) * 0.585), calc(var(--accent-colour-g) * 0.585), calc(var(--accent-colour-b) * 0.585), 0.5)')
            element.style.setProperty('--theme-colour-darkest', 'rgb(calc(var(--accent-colour-r) * 0.585), calc(var(--accent-colour-g) * 0.585), calc(var(--accent-colour-b) * 0.585))')
            element.style.setProperty('--theme-colour-lighter', 'rgb(calc(var(--accent-colour-r) * 1.5), calc(var(--accent-colour-g) * 1.5), calc(var(--accent-colour-b) * 1.5))')

            // TODO: tidier
            function calculateRelativeLuminance(r, g, b) {
                const R = r / 255;
                const G = g / 255;
                const B = b / 255;

                const rLinear = R <= 0.03928 ? R / 12.92 : Math.pow((R + 0.055) / 1.055, 2.4);
                const gLinear = G <= 0.03928 ? G / 12.92 : Math.pow((G + 0.055) / 1.055, 2.4);
                const bLinear = B <= 0.03928 ? B / 12.92 : Math.pow((B + 0.055) / 1.055, 2.4);

                return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
            }
            const lum = calculateRelativeLuminance(parseInt(accentColour.substring(1, 3), 16), parseInt(accentColour.substring(3, 5), 16), parseInt(accentColour.substring(5, 7), 16))
            element.style.setProperty('--text-colour', lum > 0.4 ? 'black' : 'white')
            element.style.setProperty('--text-shadow-colour', lum <= 0.4 ? 'black' : 'white')
        }
        else {
            element.style.setProperty('--accent-colour', null)
            element.style.setProperty('--accent-colour-r', null)
            element.style.setProperty('--accent-colour-g', null)
            element.style.setProperty('--accent-colour-b', null)
            element.style.setProperty('--theme-colour-darkest', null)
            element.style.setProperty('--theme-colour-lighter', null)
        }
    }

    static async fullRefresh() {
        MainView.elTrash.style.visibility = State.options.allowEdits ? null : 'hidden'
        MainView.elEditLock.classList.toggle('fa-lock', !State.options.allowEdits)
        MainView.elEditLock.classList.toggle('fa-unlock', State.options.allowEdits)
        MainView.elEditLock.title = State.options.allowEdits ? 'Lock for edits' : 'Allow edits'

        document.body.display(() => {
            MainView.elLayout = add('layout', function () {
                if (!State.folderCount) {
                    this.appendChild(new NoFoldersElement())
                }
                for (const folder of Object.values(State.folders).sort((a, b) => a.index - b.index)) {
                    this.appendChild(new FolderElement(folder))
                }
            })

            // Swap
            document.getElementsByTagName('layout')[0].replaceWith(MainView.elLayout)
        })

        MainView.setTheme()

        SiteListElement.instance.refresh()
        TabListElement.instance.refresh()
    }
}

globalThis.MainView = MainView // TODO: drop