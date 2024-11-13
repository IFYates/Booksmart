import State from '../../models/state.js'
import { SiteListElement } from '../elements/sites.js'
import BaseDialog from './base.js'

export default class OptionsDialog extends BaseDialog {
    constructor() {
        super('fas fa-gear', 'Options')
    }

    _display(dialog) {
        function checkbox(labelText, getter, setter) {
            const id = `input-${(Math.random() * 1000) | 0}`
            const label = add('label', labelText, { htmlFor: id })

            var value = !!getter()
            add('i', { className: 'fa-fw fas fa-toggle-off', role: 'button' }, function () {
                this.onclick = () => {
                    value = !value
                    this.classList.toggle('fa-toggle-off', !value)
                    this.classList.toggle('fa-toggle-on', value)
                    setter(value, this, label)
                }
                this.classList.toggle('fa-toggle-off', !value)
                this.classList.toggle('fa-toggle-on', value)
            })
        }

        // Column count
        const sizes = { '200': 'Tiny', '350': 'Narrow', '500': 'Medium', '750': 'Wide', '-1': 'Full' }
        const values = Object.keys(sizes)
        if (!sizes.hasOwnProperty(State.options.columns)) {
            State.options.columns = 500
        }

        const columnCount = add('label', 'Columns ').add('span')
        add('input', { classes: 'spanCols5', type: 'range', min: 0, max: values.length - 1, value: values.indexOf('' + State.options.columns) }, function () {
            this.oninput = () => {
                if (State.options.columns != values[this.value]) {
                    State.options.columns = values[this.value]
                    MainView.fullRefresh() // MainView.setTheme() doesn't work for changing grid column
                }
                columnCount.innerText = `(${sizes[State.options.columns]})`
            }
            this.oninput()
        })

        // Options
        checkbox('Show favicons', () => State.options.showFavicons, (v) => {
            State.options.showFavicons = v
            MainView.fullRefresh() // TODO
        })
        checkbox('Switch to tab, if open', () => State.options.openExistingTab, (v) => State.options.openExistingTab = v)
        checkbox('Open in new tab', () => State.options.openNewTab, (v) => State.options.openNewTab = v)
        checkbox('Show most visited sites', () => State.options.showTopSites, (v) => {
            State.options.showTopSites = v
            SiteListElement.instance.refresh()
        })
        checkbox('Wrap long bookmark titles', () => State.options.wrapTitles, (v) => {
            State.options.wrapTitles = v
            MainView.fullRefresh() // TODO
        })

        add('div', { classes: 'spanCols2' })

        // Scale
        add('label', 'Scale', { style: 'text-align:right' })
        add('input', { classes: 'spanCols5', type: 'range', min: 5, max: 50, value: State.options.scale / 10 }, function () {
            this.oninput = () => {
                if (State.options.scale != this.value * 10) {
                    State.options.scale = this.value * 10
                    MainView.setTheme()
                }
                //label.innerText = `(${State.options.scale}%)`
            }
            this.oninput()
        })

        add('p', { classes: 'spanCols6' })

        // Theme
        add('label', 'Accent colour', { style: 'text-align:right' })
        add('input', { type: 'color', classes: 'spanCols5', value: State.options.accentColour }, function () {
            this.onchange = () => {
                State.options.accentColour = this.value
                MainView.setTheme()
            }
        })

        add('p', { classes: 'spanCols6' })

        add('label', 'Background image URL', { style: 'text-align:right; align-self:start' })
        const bgImage = create('img', { style: 'max-width:100%;max-height:100%', src: State.options.backgroundImage || '' }, function () {
            this.onload = () => {
                MainView.setTheme()
            }
        })
        const bgType = add('select', { classes: 'spanCols4', style: 'width:100%' }, (el) => {
            add('option', 'None', { selected: !State.options.backgroundImage })
            add('option', 'Custom', { selected: State.options.backgroundImage && State.options.backgroundImage != 'daily' })
            add('option', 'Daily', { selected: State.options.backgroundImage == 'daily' })
        })
        add(bgImage, { classes: 'spanRows2' })
        add('div')
        const bgCustom = add('textarea', { classes: 'spanCols4', style: 'width:100%;height:100%;resize:none', value: State.options.backgroundImage != 'daily' ? (State.options.backgroundImage || '') : '' }, function () {
            this.onkeyup = () => {
                bgImage.src = this.value
                State.options.backgroundImage = this.value
                if (!this.value) {
                    MainView.setTheme()
                }
            }
        })
        bgType.on_change(async (value) => {
            bgImage.show(value != 'None')
            bgCustom.show(value == 'Custom')

            if (value == 'Daily') {
                State.options.backgroundImage = 'daily'
                bgImage.src = await State.options.getDailyBackgroundUrl()
            } else if (value == 'Custom') {
                bgCustom.onkeyup()
            } else {
                State.options.backgroundImage = ''
            }

            MainView.setTheme()
        })

        add('p', { classes: 'spanCols6' })

        add('div', { classes: 'actions-left-3' }, () => {
            add('button', { type: 'button' }, function () {
                add('i', { className: 'fa-fw fas fa-upload' })
                add('span', ' Export')

                this.onclick = async () => {
                    const data = JSON.stringify(await State.export(), null, '  ')
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
                        State.import(data)
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
                await chrome.bookmarks.removeTree(State.stateId)
                document.location.reload()
            }
        })

        add('div', { classes: ['actions', 'spanCols3'] }, () => {
            add('button', () => {
                add('i', { className: 'fa-fw fas fa-save' })
                add('span', ' Save')
            }).onclick = async () => {
                State.save()
                dialog.close()
            }
            add('button', { type: 'button' }, () => {
                add('i', { className: 'fa-fw far fa-circle-xmark' })
                add('span', ' Cancel')
            }).onclick = () => dialog.close() // TODO: reapply options
        })
    }
}