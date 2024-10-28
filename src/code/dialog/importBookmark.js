import BaseDialog from './base.js'

export default class ImportBookmarkDialog extends BaseDialog {
    constructor() {
        super('fas fa-bookmark', 'Import bookmarks')
    }

    #tree
    #collections
    async _prepare(layout) {
        this.#tree = (await chrome.bookmarks.getTree())[0].children[0]
        this.#collections = await layout.collections.entries()
    }

    _display(dialog, layout) {
        const folders = []
        function showFolder(folder, parentShowHide, depth = 0) {
            if (folder.id === layout.id) {
                return // Hide Booksmart root
            }

            folders.push(folder)
            const showHide = create('i', { className: 'icon fa-fw fas fa-chevron-down' })
            showHide.onclick = () => {
                showHide.value = !showHide.value
                showHide.classList.toggle('fa-chevron-down', !showHide.value)
                showHide.classList.toggle('fa-chevron-right', showHide.value)
            }
            showHide.hide = () => !!showHide.value || parentShowHide?.hide()

            var el = add('div', { className: 'folder', style: `margin-left: ${depth}px` }, () => {
                add(showHide)
                const id = 'folder-' + folder.id
                folder.showCollection = this.#collections.some(c => c.id === folder.id)
                add('input', { type: 'checkbox', id: id, checked: folder.showCollection }).onchange = function () {
                    folder.showCollection = this.checked
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
                for (const folder of folders) {
                    const collection = this.#collections.find(c => c.id === folder.id)
                    if (folder.showCollection) {
                        if (!collection) {
                            await layout.collections.add(folder)
                        }
                    } else if (collection) {
                        await layout.folders.remove(folder)
                    }
                }
                await layout.reload()
                dialog.close()
            }

            add('button', { type: 'button' }, () => {
                add('i', { className: 'fa-fw far fa-circle-xmark' })
                add('span', ' Cancel')
            }).onclick = () => dialog.close()
        })
    }
}