import Dialog from './base.js'

Dialog.editCollection = (collection, layout) => {
    return Dialog.show(collection ? 'Edit collection' : 'New collection',
        (dialog) => {
            const txtTitle = document.createElement('input')
            const lstSort = document.createElement('select')
            const chkSortAsc = document.createElement('input')
            const lstIconType = document.createElement('select')
            const lstFontAwesomeIcons = document.createElement('select')
            const lstBookmarkIcons = document.createElement('select')
            const elError = document.createElement('div')

            add('div', { style: 'display: grid; grid-row-gap: 1em; grid-template-columns: 1fr 2fr 2fr' }, () => {
                add('label', 'Title')
                add(txtTitle, {
                    autofocus: true,
                    type: 'textbox',
                    value: collection?.title || 'New collection',
                    style: 'grid-column: span 2'
                })

                add('label', 'Sort')
                add(lstSort, () => {
                    add('option', 'Manual', { value: 0 })
                    add('option', 'Alphabetic', { value: 1 })
                    add('option', 'Creation date', { value: 2 })
                    add('option', 'Clicks', { value: 3 })
                    add('option', 'Last click', { value: 4 })
                }).value = Math.abs(num(collection?.sortOrder))
                add(chkSortAsc, { type: 'checkbox', checked: collection?.sortOrder >= 0 })

                add('label', 'Icon')
                const iconPreview = add('i', { className: 'fa-fw fas fa-book', style: 'grid-row: span 2; width: 100%' })
                add(lstIconType, () => {
                    add('option', 'Default', { value: 0 })
                    add('option', 'Font Awesome', { value: 1 })
                    add('option', 'Custom', { value: 2 })
                }).onchange = () => {
                    lstFontAwesomeIcons.style.display = lstIconType.value === '1' ? '' : 'none'
                    lstBookmarkIcons.style.display = lstIconType.value === '2' ? '' : 'none'
                }
                lstIconType.value = !collection?.icon ? '0' : collection?.icon.startsWith('fa-') ? '1' : '2'
                add('div')
                add(lstFontAwesomeIcons, { style: 'display: none' }, () => {
                    add('option', 'Book', { value: 'fa-book' })
                    add('option', 'Bookmark', { value: 'fa-bookmark' })
                }).onchange = () => {
                    if (lstFontAwesomeIcons.lastValue) {
                        iconPreview.classList.remove(lstFontAwesomeIcons.value)
                    } else {
                        iconPreview.classList.remove('fa-book')
                    }
                    iconPreview.classList.add(lstFontAwesomeIcons.value)
                    lstFontAwesomeIcons.lastValue = lstFontAwesomeIcons.value
                }
                add(lstBookmarkIcons, { style: 'display: none' }, () => {
                    // TODO
                })
            })

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

                        collection.sortOrder = num(lstSort.value) * (chkSortAsc.checked ? 1 : -1)

                        if (lstIconType.value === '0') {
                            collection.icon = null
                        }
                        if (lstIconType.value === '1') {
                            if (!lstFontAwesomeIcons.value) {
                                elError.textContent = 'Font Awesome icon is required'
                                return
                            }
                            collection.icon = lstFontAwesomeIcons.value
                        }
                        if (lstIconType.value === '2') {
                            if (!lstBookmarkIcons.value) {
                                elError.textContent = 'Custom icon is required'
                                return
                            }
                            collection.icon = lstBookmarkIcons.value
                        }

                        await collection.save()
                        dialog.close()
                    }
                })
                add('button', 'Cancel', { type: 'button', onclick: () => dialog.close() })
            })

            elError.classList.add('error')
            add(elError)
        })
}