import './display.js'

import Layout from './models/layout.js'

var _layout = await Layout.load()
if (!_layout) {
    _layout = new Layout()
    await _layout.save()
}

async function refreshList() {
    const elLayout = document.getElementsByTagName('layout')[0]
    while (elLayout.firstChild) {
        elLayout.removeChild(elLayout.firstChild)
    }

    var collections = await _layout.collections.list()
    elLayout.display(() => {
        for (var col = 0; col < _layout.columns; ++col) {
            child('column', () => {
                child('div', { className: 'collections' }, () => {
                    for (var i = col; i < collections.length; i += _layout.columns) {
                        displayCollection(collections[i], i == 0, i == collections.length - 1)
                    }
                })
            })
        }
    })
}
function displayCollection(collection, isFirst, isLast) {
    child('collection', () => {
        child('title', collection.title)

        child('div', { className: 'bookmarks' }, () => {
            const bookmarks = collection.bookmarks.list()
            for (var i = 0; i < bookmarks.length; ++i) {
                displayBookmark(collection, bookmarks[i], i == 0, i == bookmarks.length - 1)
            }

            child('bookmark', {
                className: 'add',
                title: 'Add bookmark',
                onclick: async () => {
                    const id = _layout.nextBookmarkId()
                    await collection.bookmarks.create(`Bookmark ${id}`, `https://google.com/search?q=${id}`)
                    refreshList()
                }
            })
                .append('i', { className: 'fa-fw fas fa-plus', title: 'Add bookmark' })
        })

        // Collection actions
        child('div', { className: 'actions' }, () => {
            if (!isFirst) {
                child('button', { onclick: () => { collection.setIndex(collection.index - 1).then(refreshList) } })
                    .append('i', { className: 'fa-fw fas fa-arrow-up', title: 'Move up' })
            }
            if (!isLast) {
                child('button', { onclick: () => { collection.setIndex(collection.index + 1).then(refreshList) } })
                    .append('i', { className: 'fa-fw fas fa-arrow-down', title: 'Move down' })
            }

            child('button', { onclick: () => { editCollection(collection) } })
                .append('i', { className: 'fa-fw fas fa-pen', title: 'Edit collection' })
            child('button', { onclick: () => { collection.delete().then(refreshList) } })
                .append('i', { className: 'fa-fw fas fa-trash', title: 'Delete collection' })
        })
    })
}
function displayBookmark(collection, bookmark, isFirst, isLast) {
    child('bookmark', { className: bookmark.favourite ? 'favourite' : '' }, () => {
        child('a', { href: bookmark.url, onclick: () => bookmark.click() }, () => {
            child('i', { className: 'fa-fw fas fa-bookmark', style: 'padding-right:1em' })
            child('span', `${bookmark.id}: ${bookmark.title} (${bookmark.index})`)
            child('span', bookmark.clicks)
        })

        child('div', { className: 'actions' }, () => {
            if (!bookmark.favourite) {
                child('button', { onclick: () => { bookmark.setFavourite(true).then(refreshList) } })
                    .append('i', { className: 'fa-fw far fa-star', title: 'Set favourite' })
            } else {
                child('button', { onclick: () => { bookmark.setFavourite(false).then(refreshList) } })
                    .append('i', { className: 'fa-fw fas fa-star', title: 'Unset favourite' })
            }

            if (collection.sortOrder === 0) {
                if (!isFirst) {
                    child('button', { onclick: () => { bookmark.setIndex(bookmark.index - 1).then(refreshList) } })
                        .append('i', { className: 'fa-fw fas fa-arrow-up', title: 'Move up' })
                }
                if (!isLast) {
                    child('button', { onclick: () => { bookmark.setIndex(bookmark.index + 1).then(refreshList) } })
                        .append('i', { className: 'fa-fw fas fa-arrow-down', title: 'Move down' })
                }
            }

            child('button', { onclick: () => { refreshList() } })
                .append('i', { className: 'fa-fw fas fa-pen', title: 'Edit bookmark' })
            child('button', { onclick: () => { bookmark.delete().then(refreshList) } })
                .append('i', { className: 'fa-fw fas fa-trash', title: 'Delete bookmark' })
        })
    })
}

document.getElementById('btnAddCollection').onclick = async () => {
    const id = _layout.nextCollectionId()
    const collection = await _layout.collections.create(`Collection ${id}`)
    await collection.save()
    refreshList()
}

document.getElementById('btnExport').onclick = async () => {
    const data = JSON.stringify(await _layout.export(), null, '  ')
    const dataUrl = URL.createObjectURL(new Blob([data], { type: 'application/octet-binary' }));
    chrome.downloads.download({ url: dataUrl, filename: 'booksmart_export.json', conflictAction: 'overwrite', saveAs: true });
}

await refreshList()

function editCollection(collection) {
    const dialog = document.querySelector('dialog#dlgEditCollection')
    dialog.clearChildren()
    dialog.display(() => {
        child('form', () => {
            var txtTitle = child('input', { autofocus: true, type: 'textbox', value: collection.title })
            child('br')
            child('button', 'Save', {
                onclick: async () => {
                    if (txtTitle.value) {
                        await collection.setTitle(txtTitle.value.trim())
                        await collection.save()
                        refreshList()
                        dialog.close()
                    }
                }
            })
            child('button', 'Cancel', { onclick: () => dialog.close() })
        })
    })
    dialog.showModal()
}