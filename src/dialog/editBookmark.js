import Dialog from './base.js'

Dialog.editBookmark = (bookmark, collection) => {
    return Dialog.show(bookmark ? 'Edit bookmark' : 'Add bookmark',
        (dialog) => {
            const txtTitle = document.createElement('input')
            const txtURL = document.createElement('input')
            const txtNotes = document.createElement('textarea')
            const elError = document.createElement('div')

            add('div', { style: 'display: grid; grid-row-gap: 1em; grid-template-columns: 1fr 2fr 2fr' }, () => {
                add('label', 'Title')
                add(txtTitle, {
                    autofocus: true,
                    type: 'textbox',
                    value: bookmark?.title || 'New collection',
                    style: 'grid-column: span 2'
                })

                add('label', 'URL')
                add(txtURL, {
                    type: 'textbox',
                    value: bookmark?.url || '',
                    style: 'grid-column: span 2'
                })

                add('label', 'Notes', { style: 'grid-row: span 2'})
                add(txtNotes, {
                    value: bookmark?.notes || '',
                    style: 'grid-column: span 2; grid-row: span 2'
                })
            })

            add('p')

            if (bookmark) {
                add('button', {
                    type: 'button',
                    onclick: async () => {
                        await bookmark.delete()
                        dialog.close()
                    }
                }, () => add('i', { className: 'fa-fw fas fa-trash danger', title: 'Delete bookmark' }))
            }

            add('div', { className: 'actions' }, () => {
                add('button', 'Save', {
                    onclick: async () => {
                        if (!txtTitle.value.trim()) {
                            elError.textContent = 'Title is required'
                            return
                        }
                        if (!txtURL.value.trim() || !isURL(txtURL.value.trim())) {
                            elError.textContent = 'Invalid URL'
                            return
                        }

                        elError.textContent = ''

                        // Create / update bookmark
                        if (!bookmark) {
                            bookmark = await collection.bookmarks.create(txtTitle.value.trim(), txtURL.value.trim())
                        } else {
                            bookmark.title = txtTitle.value
                            bookmark.url = txtURL.value
                            bookmark.notes = txtNotes.value
                        }
                        await bookmark.save()

                        dialog.close()
                    }
                })
                add('button', 'Cancel', { type: 'button', onclick: () => dialog.close() })
            })

            elError.classList.add('error')
            add(elError)
        })
}