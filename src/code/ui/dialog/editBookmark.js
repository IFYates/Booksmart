import BaseDialog from './base.js'
import { IconSelectorElement } from '../elements/IconSelector.js'
import State from '../../models/state.js'

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
        const iconSelector = new IconSelectorElement(bookmark?.icon || '', bookmark?.domain)
        const overlaySelector = new IconSelectorElement(bookmark?.overlay || '')
        add('div', { classes: ['spanCols4'] }, () => {
            add(iconSelector)
            add(overlaySelector)
        })

        add('div', { classes: ['spanCols4'] }) // Gapc
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

                bookmark.icon = iconSelector.value
                bookmark.overlay = overlaySelector.value
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
}