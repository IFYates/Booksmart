import BaseDialog from './base.js'
import FontAwesome from '../../common/faHelpers.js'
import { FaconSelectorElement } from '../elements/faconSelector.js'
import { EmojiSelectorElement } from '../elements/emojiSelector.js'
import Emojis from '../../common/emojiHelpers.js'
import State from '../../models/state.js'

const IT_DEFAULT = '0', IT_EMOJI = '4', IT_FACON = '1', IT_CUSTOM = '3'

export default class EditBookmarkDialog extends BaseDialog {
    constructor(title) {
        super('fas fa-bookmark', title)
    }

    async _display(dialog, bookmark, folder) {
        const txtTitle = create('input', {
            autofocus: true,
            type: 'text',
            value: bookmark?.title || 'New bookmark'
        })
        const txtURL = create('input', {
            type: 'text',
            value: bookmark?.url || 'https://',
        })
        const txtNotes = document.createElement('textarea')

        add('div', { classes: 'spanCols4' }, () => {
            add('strong', 'Details')
            // TODO: collapsible
        })
        add('div', { classes: ['grid', 'spanCols4'] }, () => {
            add('label', 'Title')
            add(txtTitle, { classes: 'spanCols3' })

            add('label', 'URL')
            add(txtURL, { classes: 'spanCols3' })

            add('label', 'Notes')
            add(txtNotes, {
                value: bookmark?.notes || '',
                classes: 'spanCols3'
            })
        })

        const form = {
            iconType: null,
            icon: bookmark?.icon,
            overlayType: null,
            overlay: bookmark?.overlay
        }

        add('div', { classes: 'spanCols4' }, () => {
            add('strong', 'Icon')
            // TODO: collapsible
        })
        add('div', { classes: ['grid', 'spanCols4'] }, () => {
            this._displayIconSelector(form)
            this._displayOverlaySelector(form)
        })

        add('div', { classes: ['spanCols4'] }) // Gap
        const elError = add('div', { classes: ['error', 'spanCols4'] })

        add('div', { classes: ['actions', 'spanCols2'], style: 'white-space:nowrap' }, () => {
            if (bookmark) {
                add('button', { type: 'button', className: 'danger' }, () => {
                    add('i', { className: 'fa-fw fas fa-trash-can', title: 'Delete bookmark' })
                    add('span', ' Delete')
                }).onclick = async () => {
                    await State.deleteBookmark(bookmark)
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

                if (form.iconType == IT_FACON) {
                    if (!form.icon?.includes('fa-')) {
                        elError.textContent = 'Font Awesome icon is required'
                        return
                    }
                } else if (form.iconType == IT_CUSTOM) {
                    if (!form.icon) {
                        elError.textContent = 'Custom icon is required'
                        return
                    }
                } else if (form.iconType == IT_EMOJI) {
                    if (!form.icon) {
                        elError.textContent = 'Emoji selection is required'
                        return
                    }
                } else {
                    form.icon = ''
                }
                if (form.overlayType == IT_FACON) {
                    if (!form.overlay?.includes('fa-')) {
                        elError.textContent = 'Font Awesome icon is required'
                        return
                    }
                } else if (form.overlayType == IT_EMOJI) {
                    if (!form.overlay) {
                        elError.textContent = 'Emoji selection is required'
                        return
                    }
                } else {
                    form.overlay = ''
                }

                // Create / update bookmark
                if (!bookmark) {
                    bookmark = await State.createBookmark(folder, txtTitle.value.trim(), txtURL.value.trim())
                } else {
                    bookmark.title = txtTitle.value
                    bookmark.url = txtURL.value
                }

                bookmark.notes = txtNotes.value
                bookmark.icon = form.icon
                bookmark.overlay = form.overlay

                await State.updateEntry(bookmark)
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

    _displayIconSelector(form) {
        const iconPreviewDefault = create('i', { className: 'fa-fw fa-6x far fa-bookmark centred' })
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

        const isFacon = FontAwesome.isFacon(form?.icon)
        const faconSelector = new FaconSelectorElement(form?.icon || '')
        const iconPreviewFA = create('i', { className: 'fa-fw fa-6x far fa-bookmark centred' }, function () {
            var _lastValue = ['far', 'fa-bookmark']
            this.update = () => {
                iconPreviewFA.classList.remove(..._lastValue)
                if (faconSelector.value) {
                    if (form.iconType == IT_FACON) {
                        form.icon = faconSelector.value || ''
                    }
                    _lastValue = faconSelector.value?.split(' ') || []
                    iconPreviewFA.classList.add(..._lastValue)
                }
            }
        })
        faconSelector.addEventListener('change', iconPreviewFA.update)

        const isEmoji = Emojis.isEmoji(form?.icon)
        const emojiSelector = new EmojiSelectorElement(isEmoji ? form?.icon : '')
        const iconPreviewEmoji = create('i', { className: 'emoji fa-6x centred' }, function () {
            this.update = () => {
                if (form.iconType == IT_EMOJI) {
                    form.icon = emojiSelector.value || ''
                }
                iconPreviewEmoji.innerText = emojiSelector.value || ''
            }
        })
        emojiSelector.addEventListener('change', iconPreviewEmoji.update)

        const txtCustomIcon = create('input', { type: 'text' }, function () {
            this.onkeyup = () => {
                if (form.iconType == IT_CUSTOM) {
                    form.icon = this.value
                }
                iconPreviewCustom.image(this.value)
            }
            this.value = !isFacon && !isEmoji ? (form?.icon || '') : ''
            this.onkeyup()
        })


        const lstIconType = create('select', function () {
            add('option', 'Favicon', { value: IT_DEFAULT })
            add('option', 'Emoji', { value: IT_EMOJI })
            add('option', 'Font Awesome', { value: IT_FACON })
            add('option', 'Custom', { value: IT_CUSTOM })

            form.iconType = isFacon ? IT_FACON
                : isEmoji ? IT_EMOJI
                    : form?.icon ? IT_CUSTOM
                        : IT_DEFAULT
            this.value = form.iconType
        })
        lstIconType.on_change(value => { form.iconType = value })

        add(lstIconType)
        add('div', { classes: ['spanCols3', 'spanRows2'] }, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_DEFAULT) })
        })
        add(faconSelector, { classes: ['spanCols3', 'spanRows2'] }, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_FACON) })
        })
        add(emojiSelector, { classes: ['spanCols3', 'spanRows2'] }, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_EMOJI) })
        })
        add(txtCustomIcon, { classes: ['spanCols3', 'spanRows2'] }, (me) => {
            lstIconType.on_change((value) => {
                if (me.show(value == IT_CUSTOM)) {
                    me.onkeyup()
                }
            })
        })
        add(iconPreviewDefault, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_DEFAULT || value == IT_CUSTOM) })
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
        add(iconPreviewCustom, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_CUSTOM) })
        })
    }

    _displayOverlaySelector(form) {
        const isFacon = FontAwesome.isFacon(form?.overlay)
        const faconSelector = new FaconSelectorElement(form?.overlay || '')
        const iconPreviewFA = create('i', { className: 'fa-fw fa-6x far fa-bookmark centred' }, function () {
            var _lastValue = ['far', 'fa-bookmark']
            this.update = () => {
                iconPreviewFA.classList.remove(..._lastValue)
                if (faconSelector.value) {
                    if (form.iconType == IT_FACON) {
                        form.overlay = faconSelector.value || ''
                    }
                    _lastValue = faconSelector.value?.split(' ') || []
                    iconPreviewFA.classList.add(..._lastValue)
                }
            }
        })
        faconSelector.addEventListener('change', iconPreviewFA.update)

        const isEmoji = Emojis.isEmoji(form?.overlay)
        const emojiSelector = new EmojiSelectorElement(isEmoji ? form?.overlay : '')
        const iconPreviewEmoji = create('i', { className: 'emoji fa-6x centred' }, function () {
            this.update = () => {
                if (form.iconType == IT_EMOJI) {
                    form.overlay = emojiSelector.value || ''
                }
                iconPreviewEmoji.innerText = emojiSelector.value || ''
            }
        })
        emojiSelector.addEventListener('change', iconPreviewEmoji.update)

        const lstIconType = create('select', function () {
            add('option', 'None', { value: IT_DEFAULT })
            add('option', 'Emoji', { value: IT_EMOJI })
            add('option', 'Font Awesome', { value: IT_FACON })

            form.overlayType = isFacon ? IT_FACON
                : isEmoji ? IT_EMOJI
                    : IT_DEFAULT
            this.value = form.overlayType
        })
        lstIconType.on_change(value => { form.overlayType = value })

        add(lstIconType)
        add(faconSelector, { classes: ['spanCols3', 'spanRows2'] }, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_FACON) })
        })
        add(emojiSelector, { classes: ['spanCols3', 'spanRows2'] }, (me) => {
            lstIconType.on_change(value => { me.show(value == IT_EMOJI) })
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
    }
}