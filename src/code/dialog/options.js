import BaseDialog from './base.js'

export default class OptionsDialog extends BaseDialog {
    constructor() {
        super('fas fa-gear', 'Options')
    }

    _display(dialog, layout) {
        // Column count
        add('div', { classes: 'spanCols4' }, () => {
            const columnCount = add('label', 'Columns ').add('span', `(${layout.columns})`)
            add('input', { type: 'range', min: 1, max: 6, value: layout.columns }, function () {
                this.oninput = () => {
                    layout.columns = parseInt(this.value)
                    layout.onchange()
                    columnCount.innerText = `(${layout.columns})`
                }
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
                layout.onchange()
            }

        // Open in new tab
        add('label', 'Open in new tab', { style: 'text-align:right' })
        add('input', { type: 'checkbox', checked: layout.openNewTab })
            .onclick = function () {
                layout.openNewTab = this.checked
                layout.onchange()
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
            add('label', 'Theme', { classes: 'spanCols4' })
            const accent = layout.themeAccent
            const rangeInputs = []
            function updateRangeInputs() {
                for (const input of rangeInputs) {
                    input.style.accentColor = `hsl(${accent[0]}, ${accent[1]}%, 50%)`
                }
            }

            add('label', 'Colour', { style: 'text-align:right' })
            add('input', { classes: 'spanCols3', type: 'range', min: 0, max: 360, value: accent[0] }, function () {
                rangeInputs.push(this)
                this.oninput = () => {
                    accent[0] = this.value
                    updateRangeInputs()
                }
                this.onchange = () => {
                    layout.themeAccent = accent
                    layout.onchange()
                }
                this.oninput()
            })
            add('label', 'Saturation', { style: 'text-align:right' })
            add('input', { classes: 'spanCols3', type: 'range', min: 0, max: 100, value: accent[1] }, function () {
                rangeInputs.push(this)
                this.oninput = () => {
                    accent[1] = this.value
                    updateRangeInputs()
                }
                this.onchange = () => {
                    layout.themeAccent = accent
                    layout.onchange()
                }
                this.oninput()
            })

            add('label', 'Background image URL', { style: 'text-align:right' })
            const bgImage = create('img', { style: 'max-width:100%;max-height:100%', src: layout.backgroundImage || '' }, function () {
                this.onload = () => {
                    layout.onchange()
                }
            })
            add('textarea', { classes: 'spanCols2', style: 'width:100%;height:100%;resize:none', value: layout.backgroundImage || '' }, function () {
                this.onkeyup = () => {
                    bgImage.src = this.value
                    layout.backgroundImage = this.value
                    if (!this.value) {
                        layout.onchange()
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

                this.onclick = async function () {
                    const data = JSON.stringify(layout.export(), null, '  ')
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
                await chrome.bookmarks.removeTree(layout.id)
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