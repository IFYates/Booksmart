import BaseDialog from './base.js'
import State from '../../models/state.js'
import Folder from '../../models/folder.js'
import ImportBookmarkDialog from './importBookmark.js'
import { IconSelectorElement } from '../elements/IconSelector.js'

export default class EditFolderDialog extends BaseDialog {
    constructor(title) {
        super('fas fa-book', title)
    }

    async _ondisplay(dialog, folder) {
        folder ??= new Folder()

        // Title
        const txtTitle = create('input', {
            autofocus: true,
            type: 'text',
            value: folder.title || 'New folder'
        })

        // Sort
        const ASC = '1', DESC = '0'
        const chkSortAsc = create('button', { type: 'button' }, function () {
            this.value = folder.sortOrder < 0 ? DESC : ASC
            this.onclick = (ev) => {
                if (ev) {
                    this.value = this.value == ASC ? DESC : ASC
                }
                this.innerText = this.value == DESC ? '▼ Descending' : '▲ Ascending'
            }
            this.onclick()
        })
        const lstSort = create('select', function () {
            add('option', 'Manual', { value: 0 })
            add('option', 'Alphabetic', { value: 1 })
            add('option', 'Creation date', { value: 2 })
            add('option', 'Clicks', { value: 3 })
            add('option', 'Last click', { value: 4 })
            this.onchange = () => {
                chkSortAsc.disabled = this.value == '0'
            }
            this.value = Math.abs(num(folder.sortOrder))
            this.onchange()
        })

        const iconSelector = new IconSelectorElement(folder.icon || '')

        add('label', 'Title')
        add(txtTitle, { classes: 'spanCols3' })

        add('label', 'Sort')
        add(lstSort, { classes: 'spanCols2' })
        add(chkSortAsc)

        add('label', 'Icon')
        add(iconSelector, { classes: ['spanCols3', 'spanRows3'] })

        // Scale
        const lblScale = add('label', 'Scale')
        const scaleInput = add('input', { classes: 'spanCols3', type: 'range', min: 5, max: 50, value: folder.scale / 10 }, function () {
            this.oninput = () => {
                if (folder.scale && folder.scale != this.value * 10) {
                    folder.scale = this.value * 10
                    document.getElementById(`folder-${folder.id}`)?.refresh()
                }
                lblScale.innerText = `Scale (${folder.scale}%)`
            }
            this.oninput()
        })

        // Span
        add('label', 'Size')
        add('div', { className: 'spanCols3', style: 'display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 6fr;' }, (me) => {
            super._addCheckbox('Wide', folder.width > 1, (v) => {
                folder.width = !!v ? 2 : 1
                document.getElementById(`folder-${folder.id}`)?.refresh()
            })

            super._addCheckbox('Tall', folder.height > 1, (v) => {
                folder.height = !!v ? 2 : 1
                document.getElementById(`folder-${folder.id}`)?.refresh()
            })
        })

        // Colour
        var defaultAccent = !folder.accentColour
        add('label', 'Accent colour')
        const accountColourPicker = add('input', { type: 'color', classes: 'spanCols2', value: !defaultAccent ? folder.accentColour : State.options.accentColour }, function () {
            this.addEventListener('change', () => {
                defaultAccent = false
                BaseDialog.setTheme(this.value)
            })
        })
        add('button', { type: 'button' }, () => {
            add('i', { className: 'fa-fw fas fa-xmark' })
            add('span', ' Clear')
        }).onclick = async () => {
            accountColourPicker.value = State.options.accentColour
            defaultAccent = true
            BaseDialog.setTheme(null)
        }
        BaseDialog.setTheme(folder.accentColour)

        // Background
        add('label', 'Background image URL')
        const bgImage = create('img', { style: 'max-width:100%;max-height:100%', src: folder.backgroundImage || '' })
        add('textarea', { classes: 'spanCols2', style: 'width:100%;height:100%;resize:none', value: folder.backgroundImage || '' }, function () {
            this.onkeyup = () => {
                bgImage.src = this.value
                folder.backgroundImage = this.value
                if (!this.value) {
                    BaseDialog.setTheme(folder.accentColour)
                }
            }
        })
        add(bgImage)

        const elError = add('div', { classes: ['error', 'spanCols4'] })

        add('div', { classes: 'spanCols2', style: 'white-space:nowrap' }, () => {
            if (folder.id) {
                if (folder.isOwned) {
                    var confirmedDelete = false
                    const span = create('span', ' Delete')
                    add('button', { type: 'button' }, () => {
                        add('i', { className: 'fa-fw fas fa-trash-can', title: 'Delete folder' })
                        add(span)
                    }).onclick = async function () {
                        if (!confirmedDelete) {
                            confirmedDelete = true
                            span.innerText = ' Press again to confirm'
                            this.classList.add('danger')
                            return
                        }

                        await State.removeFolder(folder, true)
                        dialog.close()
                    }
                } else {
                    add('button', { type: 'button' }, () => {
                        add('i', { className: 'fa-fw fas fa-folder-minus', title: 'Remove folder' })
                        add('span', ' Remove')
                    }).onclick = async function () {
                        await State.removeFolder(folder, false)
                        dialog.close()
                    }
                }

                add('button', { type: 'button' }, () => {
                    add('i', { className: 'fa-fw fas fa-upload' })
                    add('span', ' Export')
                }).onclick = async () => {
                    const data = JSON.stringify(folder.export(true, true), null, '  ')
                    const dataUrl = URL.createObjectURL(new Blob([data], { type: 'application/octet-binary' }))
                    chrome.downloads.download({ url: dataUrl, filename: 'booksmart_export.json', conflictAction: 'overwrite', saveAs: true })
                }
            } else {
                add('button', { type: 'button' }, () => {
                    add('span', { className: 'fa-stack fa-xs' }, () => {
                        add('i', { className: 'fas fa-bookmark fa-stack-2x' })
                        add('i', { className: 'fas fa-arrow-right fa-stack-1x fa-inverse' })
                    })
                    add('span', ' Add from browser bookmarks')
                }).onclick = async () => {
                    const result = await new ImportBookmarkDialog().show()
                    if (result) {
                        dialog.close()
                    }
                }
            }
        })

        add('div', { classes: ['actions', 'spanCols2'] }, () => {
            add('button', () => {
                add('i', { className: 'fa-fw fas fa-save' })
                add('span', ' Save')
            }).onclick = async () => {
                elError.textContent = ''
                if (!txtTitle.value.trim()) {
                    elError.textContent = 'Title is required'
                    return
                }

                // Create / update folder
                if (!folder.id) {
                    folder = await State.createFolder(txtTitle.value.trim())
                } else {
                    folder.title = txtTitle.value
                }

                folder.accentColour = defaultAccent ? null : accountColourPicker.value
                folder.icon = iconSelector.value
                folder.scale = scaleInput.value * 10
                folder.sortOrder = num(lstSort.value) * (chkSortAsc.checked ? 1 : -1)

                await State.updateEntry(folder)
                MainView.setTheme()
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