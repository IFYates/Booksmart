import BaseDialog from './base.js'
import FontAwesome from '../faHelpers.js'
import Dialogs from '../dialogs.js'

export default class EditFolderDialog extends BaseDialog {
    constructor(title) {
        super('fas fa-book', title)
    }

    async _display(dialog, folder, layout) {
        const txtTitle = create('input', {
            autofocus: true,
            type: 'textbox',
            value: folder?.title || 'New folder'
        })

        const chkSortAsc = create('button', { type: 'button' }, function () {
            this.value = folder?.sortOrder >= 0 ? '1' : '0'
            this.onclick = (ev) => {
                if (ev) {
                    this.value = this.value === '1' ? '0' : '1'
                }
                this.innerText = this.value === '0' ? '▼ Descending' : '▲ Ascending'
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
                chkSortAsc.disabled = this.value === '0'
            }
            this.value = Math.abs(num(folder?.sortOrder))
            this.onchange()
        })

        const iconPreviewDefault = create('i', { className: 'fa-fw fa-3x centred' })
        const iconPreviewCustom = create('img', { className: 'iconPreview centred' }, function () {
            this.show = (url) => {
                if (!url || (!url?.startsWith('data:image/') && !url?.includes('://'))) {
                    this.style.display = 'none'
                    iconPreviewDefault.style.display = ''
                    return
                }

                if (url && this.src !== url) {
                    this.style.display = 'none'
                    iconPreviewDefault.style.display = ''
                    this.src = url
                } else {
                    this.onload()
                }
            }
            this.onload = () => {
                this.style.display = ''
                iconPreviewDefault.style.display = 'none'
            }
        })

        const lstFontAwesomeIcons = FontAwesome.getSelectionList(folder?.icon || '')
        lstFontAwesomeIcons.classList.add('faIconList')
        const iconPreviewFA = create('i', { className: 'fa-fw fa-3x centred' }, function () {
            var _lastValue = ''
            this.update = (icon) => {
                if (lstIconType.value === '1' && icon?.includes('fa-')) {
                    if (_lastValue) iconPreviewFA.classList.remove(..._lastValue.split(' '))
                    iconPreviewFA.classList.add(...icon.split(' '))
                    _lastValue = icon
                }
            }
        })

        const isFontAwesomeIcon = folder?.icon?.includes('fa-') && !folder.icon.startsWith('data:image/') && !folder.icon.includes('://')
        const bookmarkIcon = !isFontAwesomeIcon ? folder?.bookmarks?.list().find(b => b.icon && b.icon === folder.icon) : null
        const lstBookmarkIcons = create('select', function () {
            folder?.bookmarks.list().forEach(b => {
                add('option', b.title, { value: b.icon || '(none)' }, function () {
                    this.selected = bookmarkIcon === b
                    this.disabled = !b.icon?.startsWith('data:image/') && !b.icon?.includes('://')
                })
            })
            this.onchange = () => {
                iconPreviewCustom.show(this.value)
            }
            this.value = folder?.icon
            this.onchange()
        })
        const txtCustomIcon = create('input', {
            type: 'textbox',
            value: !folder?.icon?.includes('fa-') ? folder?.icon || '' : ''
        }, function () {
            this.onkeyup = () => {
                iconPreviewCustom.show(this.value)
            }
            this.value = folder?.icon && !folder?.icon.includes('fa-') ? folder?.icon : ''
            this.onkeyup()
        })

        const lstIconType = create('select', function () {
            add('option', 'None', { value: 0 })
            add('option', 'Font Awesome', { value: 1 })
            if (folder?.bookmarks?.count() > 0) {
                add('option', 'From bookmark', { value: 2 })
            }
            add('option', 'Custom', { value: 3 })
            this.onchange = () => {
                iconPreviewDefault.style.display = 'none'
                iconPreviewFA.style.display = 'none'
                iconPreviewCustom.style.display = 'none'
                lstFontAwesomeIcons.style.display = 'none'
                lstBookmarkIcons.style.display = 'none'
                txtCustomIcon.style.display = 'none'

                switch (this.value) {
                    case '1':
                        lstFontAwesomeIcons.style.display = ''
                        iconPreviewFA.style.display = ''
                        iconPreviewFA.update(lstFontAwesomeIcons.value())
                        break
                    case '2':
                        lstBookmarkIcons.style.display = ''
                        iconPreviewCustom.style.display = ''
                        lstBookmarkIcons.onchange()
                        break
                    case '3':
                        txtCustomIcon.style.display = ''
                        iconPreviewDefault.style.display = ''
                        txtCustomIcon.onkeyup()
                        break
                    default:
                        iconPreviewDefault.style.display = ''
                        break
                }
            }

            this.value = !folder?.icon ? '0' : '1'
            if (!isFontAwesomeIcon && folder?.icon) {
                txtCustomIcon.value = folder.icon
                this.value = bookmarkIcon ? '2' : '3'
            }
        })
        lstFontAwesomeIcons.subscribe(iconPreviewFA.update)

        add('label', 'Title')
        add(txtTitle, { classes: 'spanCols3' })

        add('label', 'Sort')
        add(lstSort)
        add(chkSortAsc)
        add('div')

        add('label', 'Icon')
        add(iconPreviewDefault, { classes: 'spanRows2' })
        add(iconPreviewFA, { classes: 'spanRows2' })
        add(iconPreviewCustom, { classes: 'spanRows2' })
        add(lstIconType, { classes: 'spanCols2' })
        add('div')
        add(lstFontAwesomeIcons, { classes: 'spanCols2' })
        add(lstBookmarkIcons, { classes: 'spanCols2' })
        add(txtCustomIcon, { classes: 'spanCols2' })
        lstIconType.onchange()

        const elError = add('div', { classes: ['error', 'spanCols4'] })

        add('div', { classes: 'spanCols2', style: 'white-space:nowrap' }, () => {
            if (folder) {
                var confirmedDelete = false
                add('button', { type: 'button' }, () => {
                    add('i', { className: 'fa-fw fas fa-trash-can', title: 'Delete folder' })
                    add('span', ' Delete')
                }).onclick = async function () {
                    if (!confirmedDelete) {
                        confirmedDelete = true
                        this.add('span', 'Press again to confirm')
                        this.classList.add('danger')
                        return
                    }

                    await folder.delete()
                    dialog.close()
                }

                if (!folder.isOwned) {
                    add('button', { type: 'button' }, () => {
                        add('i', { className: 'fa-fw fas fa-folder-minus', title: 'Remove folder' })
                        add('span', ' Remove')
                    }).onclick = async function () {
                        await folder.remove()
                        dialog.close()
                    }
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

                var newIcon = null
                if (lstIconType.value === '1') {
                    if (!lstFontAwesomeIcons.value()?.includes('fa-')) {
                        elError.textContent = 'Font Awesome icon is required'
                        return
                    }
                    newIcon = lstFontAwesomeIcons.value()
                } else if (lstIconType.value === '2') {
                    if (!lstBookmarkIcons.value) {
                        elError.textContent = 'Bookmark selection is required'
                        return
                    }
                    newIcon = lstBookmarkIcons.value
                } else if (lstIconType.value === '3') {
                    if (!txtCustomIcon.value) {
                        elError.textContent = 'Custom icon is required'
                        return
                    }
                    newIcon = txtCustomIcon.value
                }

                // Create / update folder
                if (!folder) {
                    folder = await layout.folders.create(txtTitle.value)
                } else {
                    folder.title = txtTitle.value
                }

                folder.sortOrder = num(lstSort.value) * (chkSortAsc.checked ? 1 : -1)
                folder.icon = newIcon

                await folder.save()
                dialog.close()
            }
            add('button', { type: 'button' }, () => {
                add('i', { className: 'fa-fw far fa-circle-xmark' })
                add('span', ' Cancel')
            }).onclick = () => dialog.close()
        })

        if (!folder) {
            add('p', { className: 'spanCols4 centred' }, () => {
                add('button', { type: 'button' }, () => {
                    add('span', { className: 'fa-stack fa-xs' }, () => {
                        add('i', { className: 'fas fa-bookmark fa-stack-2x' })
                        add('i', { className: 'fas fa-arrow-right fa-stack-1x fa-inverse' })
                    })
                    add('span', ' Add from browser bookmarks')
                }).onclick = async () => {
                    await Dialogs.importBookmarks(layout)
                    dialog.close()
                }
            })
        }
    }
}