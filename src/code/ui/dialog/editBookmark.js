import BaseDialog from './base.js'
import FontAwesome from '../../common/faHelpers.js'
import { FaconSelectorElement } from '../elements/faconSelector.js'
import { EmojiSelectorElement } from '../elements/emojiSelector.js'
import Emojis from '../../common/emojiHelpers.js'
import State from '../../models/state.js'

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

        const txtCustomIcon = create('input', { type: 'textbox' }, function () {
            this.onkeyup = () => {
                iconPreviewCustom.image(this.value)
            }
            this.value = !isFacon && !isEmoji ? (bookmark?.icon || '') : ''
            this.onkeyup()
        })

        const IT_FAVICON = '0', IT_EMOJI = '4', IT_FACON = '1', IT_CUSTOM = '3'
        const lstIconType = create('select', function () {
            add('option', 'Favicon', { value: IT_FAVICON })
            add('option', 'Emoji', { value: IT_EMOJI })
            add('option', 'Font Awesome', { value: IT_FACON })
            add('option', 'Custom', { value: IT_CUSTOM })

            this.value = !bookmark?.icon ? IT_FAVICON
                : isFacon ? IT_FACON
                    : isEmoji ? IT_EMOJI
                        : IT_CUSTOM
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
        add(iconPreviewDefault, { classes: 'spanRows2' }, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_FAVICON || value == IT_CUSTOM) })
        })
        add(iconPreviewFA, { classes: 'spanRows2' }, (me) => {
            lstIconType.on_change((value) => {
                if (me.show(value == IT_FACON)) {
                    me.update()
                }
            })
        })
        add(iconPreviewEmoji, { classes: 'spanRows2' }, (me) => {
            lstIconType.on_change((value) => {
                if (me.show(value == IT_EMOJI)) {
                    me.update()
                }
            })
        })
        add(iconPreviewCustom, { classes: 'spanRows2' }, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_CUSTOM) })
        })
        add(lstIconType, { classes: 'spanCols2' })
        add('div', { classes: 'spanCols2' }, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_FAVICON) })
        })
        add(faconSelector, { classes: 'spanCols2' }, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_FACON) })
        })
        add(emojiSelector, { classes: 'spanCols2' }, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_EMOJI) })
        })
        add(txtCustomIcon, { classes: 'spanCols2' }, (me) => {
            lstIconType.on_change((value) => {
                if (me.show(value == IT_CUSTOM)) {
                    me.onkeyup()
                }
            })
        })

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
                if (lstIconType.value == IT_FACON) {
                    newIcon = faconSelector.value
                    if (!newIcon?.includes('fa-')) {
                        elError.textContent = 'Font Awesome icon is required'
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

                // Create / update bookmark
                if (!bookmark) {
                    bookmark = await State.createBookmark(folder, txtTitle.value.trim(), txtURL.value.trim())
                } else {
                    bookmark.title = txtTitle.value
                    bookmark.url = txtURL.value
                }

                bookmark.notes = txtNotes.value
                bookmark.icon = newIcon

                await State.updateEntry(bookmark)
                await State.save()
                dialog.close()
            }
            add('button', { type: 'button' }, () => {
                add('i', { className: 'fa-fw far fa-circle-xmark' })
                add('span', ' Cancel')
            }).onclick = () => dialog.close()
        })
    }
}