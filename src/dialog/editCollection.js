import Dialog from './base.js'

Dialog.editCollection = (collection, layout) => {
    return Dialog.show(collection ? 'Edit collection' : 'New collection',
        (dialog) => {
            add('div', 'Title')
            const txtTitle = add('input', { autofocus: true, type: 'textbox', value: collection?.title || 'New collection' })

            const elError = document.createElement('div')
            elError.className = 'error'

            add('p')

            if (collection) {
                var confirmedDelete = false
                var btnDelete = add('button', {
                    type: 'button',
                    onclick: async () => {
                        if (!confirmedDelete) {
                            confirmedDelete = true
                            btnDelete.append('span', 'Press again to confirm')
                            btnDelete.classList.add('danger')
                            return
                        }

                        await collection.delete()
                        dialog.close()
                    }
                })
                btnDelete.append('i', { className: 'fa-fw fas fa-trash', title: 'Delete collection' })
            }

            add('div', { className: 'actions' }, () => {
                add('button', 'Save', {
                    onclick: async () => {
                        if (!txtTitle.value.trim()) {
                            elError.textContent = 'Title is required'
                            return
                        }

                        elError.textContent = ''
                        if (collection) {
                            collection.title = txtTitle.value
                        } else {
                            collection = await layout.collections.create(txtTitle.value)
                        }

                        await collection.save()
                        dialog.close()
                    }
                })
                add('button', 'Cancel', { type: 'button', onclick: () => dialog.close() })
            })

            add(elError)
        })
}