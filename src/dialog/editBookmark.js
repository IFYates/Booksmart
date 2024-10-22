import Dialog from './base.js'

Dialog.editBookmark = (bookmark, collection) => {
    return Dialog.show(bookmark ? 'Edit bookmark' : 'Add bookmark',
        (dialog) => {
            add('div', 'Title')
            const txtTitle = add('input', { autofocus: true, type: 'textbox', value: bookmark?.title ?? 'New bookmark' })
            add('div', 'URL')
            const txtURL = add('input', { type: 'textbox', value: bookmark?.url ?? '' })

            const elError = document.createElement('div')
            elError.className = 'error'

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
                        }
                        await bookmark.save()

                        dialog.close()
                    }
                })
                add('button', 'Cancel', { type: 'button', onclick: () => dialog.close() })
            })

            add(elError)
        })
}