
import './elements/TagElement.js'

import Dialogs from './dialogs.js'
import { FolderElement } from './elements/folder.js'
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

        document.body.addEventListener('dblclick', () => {
            document.body.classList.toggle('showBackground')
        })

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

        document.body.classList.toggle('readonly', !State.options.allowEdits)
        MainView.elEditLock.onclick = async () => {
            State.options.allowEdits = !State.options.allowEdits
            document.body.classList.toggle('readonly', !State.options.allowEdits)

            await State.save()
        }
    }

    static setTheme(accentColour = null, element = null, recursed = false) {
        element ??= document.documentElement

        if (element == document.documentElement) {
            element.style.setProperty('--layout-columns', State.options.columns == -1 ? '100%' : State.options.columns + 'px')
            if (document.getElementsByTagName('layout')[0]) {
                document.getElementsByTagName('layout')[0].style.zoom = (State.options.scale && State.options.scale != 100) ? `${State.options.scale}%` : ''
            }

            document.getElementById('imageDetail').innerHTML = ''
            if (State.options.backgroundImage == 'daily') {
                var didAwait = false
                State.options.resolveDailyBackground(bg => {
                    document.body.style.backgroundImage = `url(${bg.url})`
                    document.getElementById('imageDetail').innerHTML = bg.info
                    accentColour = bg.accentColour
                    if (didAwait && !recursed) {
                        this.setTheme(accentColour, element, true)
                    }
                })
                didAwait = true
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
            element.style.setProperty('--text-colour', null)
            element.style.setProperty('--text-shadow-colour', null)
        }
    }

    static async fullRefresh() {
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