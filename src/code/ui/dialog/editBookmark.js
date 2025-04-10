import BaseDialog from './base.js'
import { IconSelectorElement } from '../elements/IconSelector.js'
import State from '../../models/state.js'

const IT_DEFAULT = '0', IT_BOXICONS = '2', IT_EMOJI = '4', IT_FACON = '1', IT_CUSTOM = '3'

export default class EditBookmarkDialog extends BaseDialog {
    constructor(title) {
        super('fas fa-bookmark', title)
    }

    async _ondisplay(dialog, bookmark, folder) {
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

        add('div', { classes: 'spanCols4' }, () => {
            add('strong', 'Icon')
            // TODO: collapsible
        })
        add('div', { classes: ['spanCols4'] }, () => {
            const iconSelector = new IconSelectorElement(bookmark?.icon || '', bookmark?.domain)
            iconSelector.addEventListener('change', () => {
                bookmark.icon = iconSelector.value
            })
            add(iconSelector)

            const overlaySelector = new IconSelectorElement(bookmark?.overlay || '', bookmark?.domain)
            overlaySelector.addEventListener('change', () => {
                bookmark.overlay = overlaySelector.value
            })
            add(overlaySelector)
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

                // Create / update bookmark
                if (!bookmark) {
                    bookmark = await State.createBookmark(folder, txtTitle.value.trim(), txtURL.value.trim())
                } else {
                    bookmark.title = txtTitle.value
                    bookmark.url = txtURL.value
                }

                bookmark.notes = txtNotes.value

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

    #displayIconSelector(form) {
        const iconSelector = new IconSelectorElement(form.icon || '', form?.favicon)
        iconSelector.addEventListener('change', () => {
            console.log('change', iconSelector.value)
        })
        add(iconSelector)
    }

    #displayOverlaySelector(form) {
        const iconSelector = new IconSelectorElement(form?.overlay || '')
        
        const iconPreviewCustom = create('img', { className: 'iconPreview centred' }, function () {
            this.image = (url) => {
                if (!url || (!url?.startsWith('data:image/') && !url?.includes('://'))) {
                    this.src = ''
                } else if (url && this.src != url) {
                    this.style.display = 'none'
                    this.src = url
                } else {
                    this.onload()
                }
            }
            this.onload = () => {
                this.style.display = ''
            }
        })

        add(iconSelector, { classes: ['spanCols4', 'spanRows2'] }, (me) => {
        })

        add(txtCustomIcon, { classes: ['spanCols3', 'spanRows2'] }, (me) => {
            // lstIconType.on_change((value) => {
            //     if (me.show(value == IT_CUSTOM)) {
            //         me.onkeyup()
            //     }
            // })
        })
        add(iconPreviewCustom, (me) => {
            //lstIconType.on_change(value => { me.show(value == IT_CUSTOM) })
        })

        // add('div', { classes: ['spanCols4'] }, (me) => {
        //     me.style = 'display: grid; grid-template-columns: auto 1fr'
        //     lstIconType.on_change(value => { me.show(value != IT_DEFAULT) })

        //     add('input', { type: 'checkbox' })
        //         .onchange = function () {
        //         }
        //     add('span', 'Solid background')
        // })
    }
}