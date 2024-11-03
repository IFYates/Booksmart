import BaseDialog from './base.js'
import FontAwesome from '../../common/faHelpers.js'
import { FaconSelectorElement } from '../elements/faconSelector.js'
import { EmojiSelectorElement } from '../elements/emojiSelector.js'
import Emojis from '../../common/emojiHelpers.js'

export default class EditBookmarkDialog extends BaseDialog {
    constructor(title) {
        super('fas fa-bookmark', title)
    }

    async _display(dialog, bookmark, folder) {
        const txtTitle = create('input', {
            autofocus: true,
            type: 'textbox',
            value: bookmark?.title || 'New bookmark'
        })
        const txtURL = create('input', {
            type: 'textbox',
            value: bookmark?.url || 'https://',
        })
        const txtNotes = document.createElement('textarea')

        const iconPreviewDefault = create('i', { className: 'fa-fw fa-3x far fa-bookmark centred' })
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

        const isFacon = FontAwesome.isFacon(bookmark?.icon)
        const faconSelector = new FaconSelectorElement(bookmark?.icon || '')
        const iconPreviewFA = create('i', { className: 'fa-fw fa-3x far fa-bookmark centred' }, function () {
            var _lastValue = ['far', 'fa-bookmark']
            this.update = () => {
                iconPreviewFA.classList.remove(..._lastValue)
                if (faconSelector.value) {
                    _lastValue = faconSelector.value?.split(' ') || []
                    iconPreviewFA.classList.add(..._lastValue)
                }
            }
        })
        faconSelector.addEventListener('change', iconPreviewFA.update)

        const isEmoji = Emojis.isEmoji(bookmark?.icon)
        const emojiSelector = new EmojiSelectorElement(bookmark?.icon || '')
        const iconPreviewEmoji = create('i', { className: 'fa-fw fa-3x centred' }, function () {
            this.update = () => {
                iconPreviewEmoji.innerText = emojiSelector.value || ''
            }
        })
        emojiSelector.addEventListener('change', iconPreviewEmoji.update)

        const txtCustomIcon = create('input', {
            type: 'textbox',
            value: !bookmark?.icon?.includes('fa-') ? bookmark?.icon || '' : ''
        }, function () {
            this.onkeyup = () => {
                iconPreviewCustom.show(this.value)
            }
            this.value = !isFacon && !isEmoji ? bookmark?.icon : ''
            this.onkeyup()
        })

        const lstIconType = create('select', function () {
            add('option', 'Favicon', { value: 0 })
            add('option', 'Emoji', { value: 4 })
            add('option', 'Font Awesome', { value: 1 })
            add('option', 'Custom', { value: 3 })
            this.onchange = () => {
                iconPreviewDefault.style.display = '03'.includes(this.value) ? '' : 'none'
                iconPreviewFA.style.display = this.value === '1' ? '' : 'none'
                faconSelector.style.display = this.value === '1' ? '' : 'none'
                iconPreviewCustom.style.display = this.value === '2' ? '' : 'none'
                iconPreviewEmoji.style.display = this.value === '4' ? '' : 'none'
                emojiSelector.style.display = this.value === '4' ? '' : 'none'
                txtCustomIcon.style.display = this.value === '3' ? '' : 'none'

                switch (this.value) {
                    case '1':
                        iconPreviewFA.update()
                        break
                    case '3':
                        txtCustomIcon.onkeyup()
                        break
                    case '4':
                        iconPreviewEmoji.update()
                        break
                    default:
                        iconPreviewCustom.show(bookmark?.domain ? `${bookmark?.domain}/favicon.ico` : null)
                        break
                }
            }

            this.value = !folder?.icon ? '0'
                : isFacon ? '1'
                    : isBookmarkIcon ? '2'
                        : isEmoji ? '4'
                            : '3'
        })
        faconSelector.addEventListener('change', iconPreviewFA.update)

        add('label', 'Title')
        add(txtTitle, { classes: 'spanCols3' })

        add('label', 'URL')
        add(txtURL, { classes: 'spanCols3' })

        add('label', 'Notes')
        add(txtNotes, {
            value: bookmark?.notes || '',
            classes: 'spanCols3'
        })

        add('label', 'Icon')
        add(iconPreviewDefault, { classes: 'spanRows2' })
        add(iconPreviewFA, { classes: 'spanRows2' })
        add(iconPreviewEmoji, { classes: 'spanRows2' })
        add(iconPreviewCustom, { classes: 'spanRows2' })
        add(lstIconType, { classes: 'spanCols2' })
        add('div')
        add(faconSelector, { classes: 'spanCols2' })
        add(emojiSelector, { classes: 'spanCols2' })
        add(txtCustomIcon, { classes: 'spanCols2' })
        lstIconType.onchange()

        const elError = add('div', { classes: ['error', 'spanCols4'] })

        add('div', { classes: 'spanCols2', style: 'white-space:nowrap' }, () => {
            if (bookmark) {
                add('button', { type: 'button' }, () => {
                    add('i', { className: 'fa-fw fas fa-trash-can danger', title: 'Delete bookmark' })
                    add('span', ' Delete')
                }).onclick = async () => {
                    await bookmark.delete()
                    dialog.close()
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
                if (!txtURL.value.trim() || !isURL(txtURL.value.trim())) {
                    elError.textContent = 'Invalid URL'
                    return
                }

                var newIcon = null
                if (lstIconType.value === '1') {
                    newIcon = faconSelector.value
                    if (!newIcon?.includes('fa-')) {
                        elError.textContent = 'Font Awesome icon is required'
                        return
                    }
                } else if (lstIconType.value === '3') {
                    newIcon = txtCustomIcon.value
                    if (!newIcon) {
                        elError.textContent = 'Custom icon is required'
                        return
                    }
                } else if (lstIconType.value === '4') {
                    newIcon = emojiSelector.value
                    if (!newIcon) {
                        elError.textContent = 'Emoji selection is required'
                        return
                    }
                }

                // Create / update bookmark
                if (!bookmark) {
                    bookmark = await folder.bookmarks.create(txtTitle.value.trim(), txtURL.value.trim())
                } else {
                    bookmark.title = txtTitle.value
                    bookmark.url = txtURL.value
                }

                bookmark.notes = txtNotes.value
                bookmark.icon = newIcon

                await bookmark.save()
                dialog.close()
            }
            add('button', { type: 'button' }, () => {
                add('i', { className: 'fa-fw far fa-circle-xmark' })
                add('span', ' Cancel')
            }).onclick = () => dialog.close()
        })
    }
}