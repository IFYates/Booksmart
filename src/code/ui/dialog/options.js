//import MainView from '../main.js'
import BaseDialog from './base.js'

export default class OptionsDialog extends BaseDialog {
    constructor() {
        super('fas fa-gear', 'Options')
    }

    _display(dialog, layout) {
        // Column count
        add('div', { classes: 'spanCols4' }, () => {
            const sizes = { '200': 'Tiny', '350': 'Narrow', '500': 'Medium', '750': 'Wide', '-1': 'Full' }
            const values = Object.keys(sizes)
            if (!sizes.hasOwnProperty(layout.columns)) {
                layout.columns = 500
            }

            const columnCount = add('label', 'Columns ').add('span')
            add('input', { type: 'range', min: 0, max: values.length - 1, value: values.indexOf('' + layout.columns) }, function () {
                this.oninput = () => {
                    layout.columns = values[this.value]
                    layout.onchange() // MainView.setTheme() doesn't work for changing grid column
                    columnCount.innerText = `(${sizes[layout.columns]})`
                }
                this.oninput()
            })
        })

        // Show favicons
        add('label', 'Show favicons', { style: 'text-align:right' })
        add('input', { type: 'checkbox', checked: layout.showFavicons })
            .onclick = function () {
                layout.showFavicons = this.checked
                layout.onchange()
            }

        // Use existing tabs
        add('label', 'Switch to tab, if open', { style: 'text-align:right' })
        add('input', { type: 'checkbox', checked: layout.openExistingTab })
            .onclick = function () {
                layout.openExistingTab = this.checked
            }

        // Open in new tab
        add('label', 'Open in new tab', { style: 'text-align:right' })
        add('input', { type: 'checkbox', checked: layout.openNewTab })
            .onclick = function () {
                layout.openNewTab = this.checked
            }

        // Show topSites
        add('label', 'Show most visited sites', { style: 'text-align:right' })
        add('input', { type: 'checkbox', checked: layout.showTopSites })
            .onclick = function () {
                layout.showTopSites = this.checked
                layout.onchange()
            }

        // Wrap bookmark titles
        add('label', 'Wrap long bookmark titles', { style: 'text-align:right' })
        add('input', { type: 'checkbox', checked: layout.wrapTitles })
            .onclick = function () {
                layout.wrapTitles = this.checked
                layout.onchange()
            }

        // Theme
        add('div', { classes: 'spanCols4', style: 'display: grid; grid-column-gap: 1em; grid-template-columns: 1fr 1fr 1fr 1fr' }, () => {
            add('div', { className: 'spanCols4', style: 'height: 1em' })

            add('label', 'Accent colour', { style: 'text-align:right' })
            add('input', { type: 'color', classes: 'spanCols3', value: layout.accentColour }, function () { // TODO
                this.onchange = () => {
                    layout.accentColour = this.value
                    MainView.setTheme()
                }
            })

            add('label', 'Background image URL', { style: 'text-align:right' })
            const bgImage = create('img', { style: 'max-width:100%;max-height:100%', src: layout.backgroundImage || '' }, function () {
                this.onload = () => {
                    MainView.setTheme()
                }
            })
            add('textarea', { classes: 'spanCols2', style: 'width:100%;height:100%;resize:none', value: layout.backgroundImage || '' }, function () {
                this.onkeyup = () => {
                    bgImage.src = this.value
                    layout.backgroundImage = this.value
                    if (!this.value) {
                        MainView.setTheme()
                    }
                }
            })
            add(bgImage)
        })

        add('p', { classes: 'spanCols4' })

        add('div', { classes: 'actions-left-3' }, () => {
            add('button', { type: 'button' }, function () {
                add('i', { className: 'fa-fw fas fa-upload' })
                add('span', ' Export')

                this.onclick = async () => {
                    const data = JSON.stringify(await layout.export(), null, '  ')
                    const dataUrl = URL.createObjectURL(new Blob([data], { type: 'application/octet-binary' }));
                    chrome.downloads.download({ url: dataUrl, filename: 'booksmart_export.json', conflictAction: 'overwrite', saveAs: true });
                }
            })

            add('button', { type: 'button' }, function () {
                const uploader = add('input', { type: 'file', accept: '.json', style: 'display:none' })
                this.onclick = () => {
                    uploader.click()
                }
                uploader.addEventListener('change', () => {
                    const file = uploader.files[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = async function () {
                        const data = JSON.parse(this.result)
                        await layout.import(data)
                    }
                    reader.readAsText(file)
                })

                add('i', { className: 'fa-fw fas fa-download' })
                add('span', ' Import')
            })

            var confirmed = false
            add('button', { type: 'button', title: 'Reset Booksmart to original state' }, () => {
                add('i', { className: 'fa-fw fas fa-eraser' })
                add('span', ' Reset')
            }).onclick = async function () {
                if (!confirmed) {
                    confirmed = true
                    this.classList = 'danger'
                    this.children[0].classList.replace('fa-eraser', 'fa-warning')
                    this.disabled = true

                    var count = 2
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
                await chrome.bookmarks.removeTree(layout.dataId)
                document.location.reload()
            }
        })

        add('div', { classes: ['actions', 'spanCols2'] }, () => {
            add('button', () => {
                add('i', { className: 'fa-fw fas fa-save' })
                add('span', ' Save')
            }).onclick = async () => {
                layout.save()
                dialog.close()
            }
            add('button', { type: 'button' }, () => {
                add('i', { className: 'fa-fw far fa-circle-xmark' })
                add('span', ' Cancel')
            }).onclick = () => dialog.close()
        })
    }
}