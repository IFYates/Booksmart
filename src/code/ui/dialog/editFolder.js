import BaseDialog from './base.js'
import FontAwesome from '../../common/faHelpers.js'
import { FaconSelectorElement } from '../elements/faconSelector.js'
import { EmojiSelectorElement } from '../elements/emojiSelector.js'
import Emojis from '../../common/emojiHelpers.js'
import State from '../../models/state.js'
import Folder from '../../models/folder.js'
import ImportBookmarkDialog from './importBookmark.js'

export default class EditFolderDialog extends BaseDialog {
    constructor(title) {
        super('fas fa-book', title)
    }

    async _display(dialog, folder) {
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

        // Icon
        const iconPreviewDefault = create('i', { className: 'fa-fw fa-6x centred' })
        const iconPreviewCustom = create('img', { className: 'iconPreview centred' }, function () {
            this.image = (url) => {
                if (!url || (!url?.startsWith('data:image/') && !url?.includes('://'))) {
                    this.style.display = 'none'
                    iconPreviewDefault.style.display = ''
                    return
                }

                if (url && this.src != url) {
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

        const isFacon = FontAwesome.isFacon(folder.icon)
        const faconSelector = new FaconSelectorElement(folder.icon)
        const iconPreviewFA = create('i', { className: 'fa-fw fa-6x centred' }, function () {
            var _lastValue = []
            this.update = () => {
                iconPreviewFA.classList.remove(..._lastValue)
                if (faconSelector.value) {
                    _lastValue = faconSelector.value?.split(' ') || []
                    iconPreviewFA.classList.add(..._lastValue)
                }
            }
        })
        faconSelector.addEventListener('change', iconPreviewFA.update)

        const isEmoji = Emojis.isEmoji(folder.icon)
        const emojiSelector = new EmojiSelectorElement(isEmoji ? folder.icon : '')
        const iconPreviewEmoji = create('i', { className: 'emoji fa-6x centred' }, function () {
            this.update = () => {
                iconPreviewEmoji.innerText = emojiSelector.value || ''
            }
        })
        emojiSelector.addEventListener('change', iconPreviewEmoji.update)

        const bookmarkIcon = !isEmoji && !isFacon ? folder.bookmarks?.find(b => b.icon && b.icon == folder.icon) : null
        const lstBookmarkIcons = create('select', function () {
            folder.bookmarks.forEach(b => {
                add('option', b.title, { value: b.icon || '(none)' }, function () {
                    this.selected = bookmarkIcon === b
                    this.disabled = !b.icon?.startsWith('data:image/') && !b.icon?.includes('://')
                    if (this.disabled) {
                        this.textContent = "[No icon] " + this.textContent
                    }
                })
            })
            this.onchange = () => {
                iconPreviewCustom.image(this.value)
            }
            this.value = folder.icon
            this.onchange()
        })

        const txtCustomIcon = create('input', { type: 'text' }, function () {
            this.onkeyup = () => {
                iconPreviewCustom.image(this.value)
            }
            this.value = folder.icon && !isFacon && !isEmoji ? folder.icon : ''
            this.onkeyup()
        })

        const IT_NONE = '0', IT_EMOJI = '4', IT_FACON = '1', IT_BOOKMARK = '2', IT_CUSTOM = '3'
        const lstIconType = create('select', function () {
            add('option', 'None', { value: IT_NONE })
            add('option', 'Emoji', { value: IT_EMOJI })
            add('option', 'Font Awesome', { value: IT_FACON })
            if (folder.bookmarks.length) {
                add('option', 'From bookmark', { value: IT_BOOKMARK })
            }
            add('option', 'Custom', { value: IT_CUSTOM })

            this.value = !folder.icon ? IT_NONE
                : isFacon ? IT_FACON
                    : bookmarkIcon ? IT_BOOKMARK
                        : isEmoji ? IT_EMOJI
                            : IT_CUSTOM
        })

        add('label', 'Title')
        add(txtTitle, { classes: 'spanCols3' })

        add('label', 'Sort')
        add(lstSort, { classes: 'spanCols2' })
        add(chkSortAsc)

        add('label', 'Icon')
        add(lstIconType)
        add('div', { classes: ['spanCols2', 'spanRows2'] }, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_NONE) })
        })
        add(faconSelector, { classes: ['spanCols2', 'spanRows2'] }, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_FACON) })
        })
        add(emojiSelector, { classes: ['spanCols2', 'spanRows2'] }, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_EMOJI) })
        })
        add(lstBookmarkIcons, { classes: ['spanCols2', 'spanRows2'] }, (me) => {
            lstIconType.on_change((value) => {
                if (me.show(value == IT_BOOKMARK)) {
                    me.onchange()
                }
            })
        })
        add(txtCustomIcon, { classes: ['spanCols2', 'spanRows2'] }, (me) => {
            lstIconType.on_change((value) => {
                if (me.show(value == IT_CUSTOM)) {
                    me.onkeyup()
                }
            })
        })
        add('div')
        add(iconPreviewCustom, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_BOOKMARK) })
        })
        add(iconPreviewDefault, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_NONE || value == IT_CUSTOM) })
        })
        add(iconPreviewFA, (me) => {
            lstIconType.on_change((value) => {
                if (me.show(value == IT_FACON)) {
                    me.update()
                }
            })
        })
        add(iconPreviewEmoji, (me) => {
            lstIconType.on_change((value) => {
                if (me.show(value == IT_EMOJI)) {
                    me.update()
                }
            })
        })

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

                var newIcon = null
                if (lstIconType.value == IT_FACON) {
                    newIcon = faconSelector.value
                    if (!newIcon?.includes('fa-')) {
                        elError.textContent = 'Font Awesome icon is required'
                        return
                    }
                } else if (lstIconType.value == IT_BOOKMARK) {
                    newIcon = lstBookmarkIcons.value
                    if (!newIcon) {
                        elError.textContent = 'Bookmark selection is required'
                        return
                    }
                } else if (lstIconType.value == IT_CUSTOM) {
                    newIcon = txtCustomIcon.value
                    if (!newIcon) {
                        elError.textContent = 'Custom icon is required'
                        return
                    }
                } else if (lstIconType.value == IT_EMOJI) {
                    newIcon = emojiSelector.value
                    if (!newIcon) {
                        elError.textContent = 'Emoji selection is required'
                        return
                    }
                }

                // Create / update folder
                if (!folder.id) {
                    folder = await State.createFolder(txtTitle.value.trim())
                } else {
                    folder.title = txtTitle.value
                }

                folder.sortOrder = num(lstSort.value) * (chkSortAsc.checked ? 1 : -1)
                folder.icon = newIcon
                folder.accentColour = defaultAccent ? null : accountColourPicker.value
                folder.scale = scaleInput.value * 10

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