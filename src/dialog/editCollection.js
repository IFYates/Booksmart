import Dialog from './base.js'
import FontAwesome from '../faHelpers.js'

Dialog.editCollection = (collection, layout) => {
    return Dialog.show(collection ? 'Edit collection' : 'New collection',
        (dialog) => {
            const txtTitle = create('input', {
                autofocus: true,
                type: 'textbox',
                value: collection?.title || 'New collection'
            })

            const chkSortAsc = create('button', {}, function () {
                this.value = collection?.sortOrder >= 0 ? '1' : '0'
                this.onclick = (ev) => {
                    if (ev) {
                        this.value = this.value === '1' ? '0' : '1'
                    }
                    this.innerText = this.value === '0' ? '▼ Descending' : '▲ Ascending'
                }
                this.onclick()
            })
            const lstSort = create('select', function () {
                add('option', 'Manual', { value: 0 })
                add('option', 'Alphabetic', { value: 1 })
                add('option', 'Creation date', { value: 2 })
                add('option', 'Clicks', { value: 3 })
                add('option', 'Last click', { value: 4 })
                this.onchange = () => {
                    chkSortAsc.disabled = this.value === '0'
                }
                this.value = Math.abs(num(collection?.sortOrder))
                this.onchange()
            })

            const iconPreviewDefault = create('i', { className: 'fa-fw fa-3x fas fa-book centred' })
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

            const lstFontAwesomeIcons = FontAwesome.getSelectionList(collection.icon)
            lstFontAwesomeIcons.classList.add('faIconList')
            const iconPreviewFA = create('i', { className: 'fa-fw fa-3x fas fa-book centred' }, function () {
                var _lastValue = 'fas fa-book'
                this.update = (icon) => {
                    if (lstIconType.value === '1' && icon.includes('fa-')) {
                        iconPreviewFA.classList.remove(..._lastValue.split(' '))
                        iconPreviewFA.classList.add(...icon.split(' '))
                        _lastValue = icon
                    }
                }
            })

            const lstBookmarkIcons = create('select', function () {
                const elCurrent = collection.icon?.startsWith('data:image/') || collection.icon?.includes('://')
                    ? add('option', collection.icon, { value: collection.icon }) : null
                collection.bookmarks.list().forEach(b => {
                    if (b.icon?.startsWith('data:image/') || b.icon?.includes('://')) {
                        add('option', b.title, { value: b.icon })
                        if (b.icon === collection.icon) {
                            elCurrent?.parentElement.removeChild(elCurrent)
                        }
                    }
                })
                this.onchange = () => {
                    iconPreviewCustom.show(this.value)
                }
                this.value = collection.icon
                this.onchange()
            })
            const txtCustomIcon = create('input', {
                type: 'textbox',
                value: !collection?.icon?.includes('fa-') ? collection?.icon || '' : ''
            }, function () {
                this.onkeyup = () => {
                    iconPreviewCustom.show(this.value)
                }
                this.value = collection.icon && !collection?.icon.includes('fa-') ? collection.icon : ''
                this.onkeyup()
            })

            const lstIconType = create('select', function () {
                add('option', 'Default', { value: 0 })
                add('option', 'Font Awesome', { value: 1 })
                add('option', 'From bookmark', { value: 2 })
                add('option', 'Custom', { value: 3 })
                this.onchange = () => {
                    iconPreviewDefault.style.display = 'none'
                    iconPreviewFA.style.display = 'none'
                    iconPreviewCustom.style.display = 'none'
                    lstFontAwesomeIcons.style.display = 'none'
                    lstBookmarkIcons.style.display = 'none'
                    txtCustomIcon.style.display = 'none'

                    switch (this.value) {
                        case '1':
                            lstFontAwesomeIcons.style.display = ''
                            iconPreviewFA.style.display = ''
                            iconPreviewFA.update(lstFontAwesomeIcons.value())
                            break;
                        case '2':
                            lstBookmarkIcons.style.display = ''
                            iconPreviewCustom.style.display = ''
                            lstBookmarkIcons.onchange()
                            break;
                        case '3':
                            txtCustomIcon.style.display = ''
                            iconPreviewDefault.style.display = ''
                            txtCustomIcon.onkeyup()
                            break;
                        default:
                            iconPreviewDefault.style.display = ''
                            break;
                    }
                }
                this.value = !collection?.icon ? '0' : collection?.icon.includes('fa-') ? '1' : '2'
            })
            lstFontAwesomeIcons.subscribe(iconPreviewFA.update)

            add('div', { style: 'display: grid; grid-row-gap: 1em; grid-template-columns: 1fr 1fr 2fr 2fr' }, () => {
                add('label', 'Title')
                add(txtTitle, { classes: 'spanCols3' })

                add('label', 'Sort')
                add(lstSort)
                add(chkSortAsc, { type: 'checkbox', checked: collection?.sortOrder >= 0, style: 'width: auto' })
                add('div')

                add('label', 'Icon')
                add(iconPreviewDefault, { classes: 'spanRows2' })
                add(iconPreviewFA, { classes: 'spanRows2' })
                add(iconPreviewCustom, { classes: 'spanRows2' })
                add(lstIconType, { classes: 'spanCols2' })
                add('div')
                add(lstFontAwesomeIcons, { classes: 'spanCols2' })
                add(lstBookmarkIcons, { classes: 'spanCols2' })
                add(txtCustomIcon, { classes: 'spanCols2' })
                lstIconType.onchange()
            })

            add('p')

            if (collection) {
                var confirmedDelete = false
                add('button', {
                    type: 'button'
                }, function () {
                    this.onclick = async () => {
                        if (!confirmedDelete) {
                            confirmedDelete = true
                            this.add('span', 'Press again to confirm')
                            this.classList.add('danger')
                            return
                        }

                        await collection.delete()
                        dialog.close()
                    }
                    add('i', { className: 'fa-fw fas fa-trash', title: 'Delete collection' })
                })
            }

            const elError = create('div', { className: 'error' })
            add('div', { className: 'actions' }, () => {
                add('button', 'Save', {
                    onclick: async () => {
                        if (!txtTitle.value.trim()) {
                            elError.textContent = 'Title is required'
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
                            if (!lstBookmarkIcons.value) {
                                elError.textContent = 'Bookmark selection is required'
                                return
                            }
                            newIcon = lstBookmarkIcons.value
                        } else if (lstIconType.value === '3') {
                            if (!txtCustomIcon.value) {
                                elError.textContent = 'Custom icon is required'
                                return
                            }
                            newIcon = txtCustomIcon.value
                        }

                        elError.textContent = ''
                        if (collection) {
                            collection.title = txtTitle.value
                        } else {
                            collection = await layout.collections.create(txtTitle.value)
                        }

                        collection.sortOrder = num(lstSort.value) * (chkSortAsc.checked ? 1 : -1)
                        collection.icon = newIcon

                        await collection.save()
                        dialog.close()
                    }
                })
                add('button', 'Cancel', { type: 'button', onclick: () => dialog.close() })
            })

            add(elError)
        })
}