import Dialog from './base.js'

Dialog.showOptions = (layout) => {
    return Dialog.show('Options', (dialog) => {
        // Column count
        add('div', () => {
            add('label', 'Columns')
            add('input', { type: 'range', min: 1, max: 6, value: layout.columns })
                .onclick = async (ev) => {
                    layout.columns = parseInt(ev.target.value)
                    layout.onchange()
                }
        })

        // Show favicons
        add('div', () => {
            add('label', 'Show favicons')
            add('input', { type: 'checkbox', checked: layout.showFavicons })
                .onclick = async (ev) => {
                    layout.showFavicons = ev.target.checked
                    layout.onchange()
                }
        })

        // Use existing tabs
        add('div', () => {
            add('label', 'Switch to tab, if open')
            add('input', { type: 'checkbox', checked: layout.openExistingTab })
                .onclick = async (ev) => {
                    layout.openExistingTab = ev.target.checked
                    layout.onchange()
                }
        })

        // Open in new tab
        add('div', () => {
            add('label', 'Open in new tab')
            add('input', { type: 'checkbox', checked: layout.openNewTab })
                .onclick = async (ev) => {
                    layout.openNewTab = ev.target.checked
                    layout.onchange()
                }
        })

        // theme / colour
        // set as homepage?

        add('div', { style: 'margin-top:1em; text-align:center' }, () => {
            add('button', {
                onclick: async function () {
                    const data = JSON.stringify(layout.export(), null, '  ')
                    const dataUrl = URL.createObjectURL(new Blob([data], { type: 'application/octet-binary' }));
                    chrome.downloads.download({ url: dataUrl, filename: 'booksmart_export.json', conflictAction: 'overwrite', saveAs: true });
                }
            }, function () {
                add('i', { className: 'fa-fw fas fa-upload' })
                add('span', ' Export')
            })

            add('button', {
                disabled: true,
                onclick: function () {
                }
            }, function () {
                add('i', { className: 'fa-fw fas fa-download' })
                add('span', ' Import')
            })

            var confirmed = false
            add('button', {
                title: 'Reset Booksmart to original state',
                onclick: async function () {
                    if (!confirmed) {
                        confirmed = true
                        this.classList = 'danger'
                        this.children[0].classList.replace('fa-eraser', 'fa-warning')
                        this.disabled = true
                        var count = 1
                        this.children[1].textContent = `Wait (${count--})`
                        var interval = setInterval(() => {
                            this.children[1].textContent = `Wait (${count--})`
                            if (count < 0) {
                                clearInterval(interval)
                                this.disabled = false
                                this.children[1].textContent = 'Confirm reset'
                            }
                        }, 1000)
                        return
                    }

                    // Full delete
                    await chrome.bookmarks.removeTree(layout.id)
                    document.location.reload()
                }
            }, function () {
                add('i', { className: 'fa-fw fas fa-eraser' })
                add('span', ' Reset')
            })
        })

        add('div', { style: 'margin-top:1em; text-align:center' }, () => {
            add('button', 'Done').onclick = () => dialog.close()
        })
    })
}