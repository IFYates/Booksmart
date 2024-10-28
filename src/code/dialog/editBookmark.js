import BaseDialog from './base.js'
import FontAwesome from '../faHelpers.js'

export default class EditBookmarkDialog extends BaseDialog {
    constructor(title) {
        super('fas fa-bookmark', title)
    }

    async _display(dialog, bookmark, collection) {
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

        const iconPreviewDefault = create('i', { className: 'fa-fw fa-3x fas fa-bookmark centred' })
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

        const lstFontAwesomeIcons = FontAwesome.getSelectionList(bookmark?.icon || 'fas fa-bookmark')
        lstFontAwesomeIcons.classList.add('faIconList')
        const iconPreviewFA = create('i', { className: 'fa-fw fa-3x fas fa-bookmark centred' }, function () {
            var _lastValue = 'fas fa-bookmark'
            this.update = (icon) => {
                if (lstIconType.value === '1' && icon?.includes('fa-')) {
                    iconPreviewFA.classList.remove(..._lastValue.split(' '))
                    iconPreviewFA.classList.add(...icon.split(' '))
                    _lastValue = icon
                }
            }
        })

        const txtCustomIcon = create('input', {
            type: 'textbox',
            value: !bookmark?.icon?.includes('fa-') ? bookmark?.icon || '' : ''
        }, function () {
            this.onkeyup = () => {
                iconPreviewCustom.show(this.value)
            }
            this.value = bookmark?.icon && !bookmark?.icon.includes('fa-') ? bookmark?.icon : ''
            this.onkeyup()
        })

        const lstIconType = create('select', function () {
            add('option', 'Favicon', { value: 0 })
            add('option', 'Font Awesome', { value: 1 })
            add('option', 'Custom', { value: 2 })
            this.onchange = () => {
                iconPreviewDefault.style.display = 'none'
                iconPreviewFA.style.display = 'none'
                iconPreviewCustom.style.display = 'none'
                lstFontAwesomeIcons.style.display = 'none'
                txtCustomIcon.style.display = 'none'

                switch (this.value) {
                    case '1':
                        lstFontAwesomeIcons.style.display = ''
                        iconPreviewFA.style.display = ''
                        iconPreviewFA.update(lstFontAwesomeIcons.value())
                        break;
                    case '2':
                        txtCustomIcon.style.display = ''
                        iconPreviewDefault.style.display = ''
                        txtCustomIcon.onkeyup()
                        break;
                    default:
                        iconPreviewCustom.show(bookmark?.domain ? `${bookmark?.domain}/favicon.ico` : null)
                        break;
                }
            }
            this.value = !bookmark?.icon ? '0' : bookmark?.icon.includes('fa-') ? '1' : '2'
        })
        lstFontAwesomeIcons.subscribe(iconPreviewFA.update)

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
        add(iconPreviewCustom, { classes: 'spanRows2' })
        add(lstIconType, { classes: 'spanCols2' })
        add('div')
        add(lstFontAwesomeIcons, { classes: 'spanCols2' })
        add(txtCustomIcon, { classes: 'spanCols2' })
        lstIconType.onchange()

        const elError = add('div', { classes: ['error', 'spanCols4'] })

        add('div', { classes: 'spanCols2', style: 'white-space:nowrap' }, () => {
            if (bookmark) {
                add('button', { type: 'button' }, () => {
                    add('i', { className: 'fa-fw fas fa-trash danger', title: 'Delete bookmark' })
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
                    if (!lstFontAwesomeIcons.value()?.includes('fa-')) {
                        elError.textContent = 'Font Awesome icon is required'
                        return
                    }
                    newIcon = lstFontAwesomeIcons.value()
                } else if (lstIconType.value === '2') {
                    if (!txtCustomIcon.value) {
                        elError.textContent = 'Custom icon is required'
                        return
                    }
                    newIcon = txtCustomIcon.value
                }

                // Create / update bookmark
                if (!bookmark) {
                    bookmark = await collection.bookmarks.create(txtTitle.value.trim(), txtURL.value.trim())
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