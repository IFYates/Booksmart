import Folder from '../../models/folder.js'
import State from '../../models/state.js'
import BaseDialog from './base.js'

export default class ImportBookmarkDialog extends BaseDialog {
    constructor() {
        super('fas fa-bookmark', 'Import bookmarks')
    }

    #tree
    #folders
    async _prepare() {
        this.#tree = (await chrome.bookmarks.getTree())[0].children[0]
        this.#folders = Object.values(State.folders)
    }

    _display(dialog) {
        const items = []
        function showFolder(folder, parentShowHide, depth = 0) {
            if (folder.id === State.booksmartRootId) {
                return // Hide Booksmart root
            }

            items.push(folder)
            const showHide = create('i', { className: 'icon fa-fw fas fa-chevron-down' })
            showHide.onclick = () => {
                showHide.value = !showHide.value
                showHide.classList.toggle('fa-chevron-down', !showHide.value)
                showHide.classList.toggle('fa-chevron-right', !!showHide.value)
            }
            showHide.hide = () => !!showHide.value || parentShowHide?.hide()

            var el = add('div', { className: 'folder', style: `margin-left: ${depth}px` }, () => {
                add(showHide)
                const id = 'folder-' + folder.id
                folder.showFolder = this.#folders.some(c => c.id === folder.id)
                add('input', { type: 'checkbox', id: id, checked: folder.showFolder }).onchange = function () {
                    folder.showFolder = this.checked
                }
                add('label', `${folder.title} (${folder.children.filter(c => c.url).length})`, { htmlFor: id })
            })

            const children = []
            for (const child of folder.children.sort((a, b) => a.title.localeCompare(b.title))) {
                if (!child.url) {
                    children.push(showFolder.call(this, child, showHide, depth + 20))
                }
            }

            el.update = () => {
                el.style.display = parentShowHide.hide() ? 'none' : ''
                for (const child of children) {
                    child.update()
                }
            }
            parentShowHide?.addEventListener('click', el.update)

            if (children.length === 0) {
                showHide.style.visibility = 'hidden'
            }
            return el
        }

        add('p', 'Choose the bookmark folders to include on your dashboard:')
        const folderList = add('div', { className: 'folderList' }, () => {
            showFolder.call(this, this.#tree)
        })
        setTimeout(() => {
            folderList.style.height = `${folderList.offsetHeight}px`
            folderList.style.columnFill = 'auto'
        }, 0)

        add('p')

        add('div', { classes: ['actions', 'spanCols2'] }, () => {
            add('button', () => {
                add('i', { className: 'fa-fw fas fa-save' })
                add('span', ' Save')
            }).onclick = async () => {
                for (const item of items) {
                    const folder = this.#folders.find(c => c.id === item.id)
                    if (item.showFolder) {
                        if (!folder) {
                            State.importFolder(item, { index: State.folderCount })
                        }
                    }
                    else if (folder) {
                        delete State.folders[folder.id]
                    }
                }
                await State.save()
                dialog.returnValue = true
                dialog.close()
            }

            add('button', { type: 'button' }, () => {
                add('i', { className: 'fa-fw far fa-circle-xmark' })
                add('span', ' Cancel')
            }).onclick = () => dialog.close()
        })
    }
}