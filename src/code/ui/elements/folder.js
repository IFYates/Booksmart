import { BaseHTMLElement, DropHandler, DragDropHandler } from "../../common/html.js"
import { BookmarkAddElement } from './bookmarkAdd.js'
import { BookmarkElement, } from './bookmark.js'
import Dialogs from '../dialogs.js'
import FontAwesome from "../../common/faHelpers.js"
import Emojis from "../../common/emojiHelpers.js"

const template = document.createElement('template')
template.innerHTML = `
<h1>
    <i class="showHide fa-fw far fa-square-caret-down" title="Show"></i>
    <i class="showHide fa-fw far fa-square-caret-up" title="Hide"></i>
    <i class="icon fa-fw"></i>
    <img class="icon" style="display:none" />

    <span class="title"><!--$ title $--></span>

    <div class="actions">
        <i class="fa-fw fas fa-arrow-up" title="Move up"></i>
        <i class="fa-fw fas fa-arrow-down" title="Move down"></i>
        <i class="fa-fw fas fa-pen" title="Edit folder"></i>
    </div>

    <i class="action fa-fw fas fa-folder" title="This is a folder from your browser bookmarks" style="display:none"></i>
</h1>
<!-- Bookmarks -->
`

export class FolderElement extends BaseHTMLElement {
    #folder
    get folder() { return this.#folder }

    get iconType() {
        return !this.#folder.icon || this.#folder.icon.startsWith('chrome:') ? 'none'
            : FontAwesome.isFacon(this.#folder.icon) ? 'facon'
                : Emojis.isEmoji(this.#folder.icon) ? 'emoji'
                    : 'custom'
    }

    constructor(folder) {
        super(template, ['/code/styles/common.css', '/code/styles/folder.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
        this.#folder = folder
        this.id = 'folder-' + folder.id
    }

    setTheme() {
        const accentColour = this.#folder.accentColour
        if (accentColour) {
            this.shadowRoot.host.style.setProperty('--accent-colour', accentColour)
            this.shadowRoot.host.style.setProperty('--accent-colour-r', accentColour.substring(1, 3).fromHex())
            this.shadowRoot.host.style.setProperty('--accent-colour-g', accentColour.substring(3, 5).fromHex())
            this.shadowRoot.host.style.setProperty('--accent-colour-b', accentColour.substring(5, 7).fromHex())
            // this.shadowRoot.host.style.setProperty('--accent-colour-hue', this.#folder.themeAccent[0])
            // this.shadowRoot.host.style.setProperty('--accent-colour-saturation', `${this.#folder.themeAccent[1]}%`)
            // this.shadowRoot.host.style.setProperty('--accent-colour-lightness', '24%')
            // this.shadowRoot.host.style.setProperty('--text-colour', '#eee') // TODO
            this.shadowRoot.host.style.backgroundImage = this.#folder.backgroundImage ? `url(${this.#folder.backgroundImage})` : null

            this.shadowRoot.host.style.setProperty('--theme-colour-darkest', 'rgb(calc(var(--accent-colour-r) * 0.585), calc(var(--accent-colour-g) * 0.585), calc(var(--accent-colour-b) * 0.585))')
            this.shadowRoot.host.style.setProperty('--theme-colour-lighter', 'rgb(calc(var(--accent-colour-r) * 1.5), calc(var(--accent-colour-g) * 1.5), calc(var(--accent-colour-b) * 1.5))')
            this.shadowRoot.host.style.backgroundColor = 'var(--theme-colour-darkest)'
        }
    }

    async _ondisplay(root, host) {
        const folder = this.#folder
        const readonly = !MainView.layout.allowEdits || folder.readonly
        const immobile = !MainView.layout.allowEdits || folder.immobile || readonly

        // Replace templates
        var m
        while (m = BaseHTMLElement.TemplateRE.exec(root.innerHTML)) {
            root.innerHTML = String(root.innerHTML).replaceAll(m[0], folder[m[1]])
        }
        this.setTheme()

        // Show/hide
        this._apply('i.showHide', function () {
            this.style.display = !folder.fixed && this.classList.contains('fa-square-caret-up') === folder.collapsed ? '' : 'none'
        })
        if (!folder.fixed) {
            root.querySelector('h1').onclick = () => {
                folder.collapsed = !folder.collapsed
                folder.save().then(() => this.refresh())
            }
            this.classList.toggle('collapsed', !!folder.collapsed)
            this.classList.add('collapsable')
        }

        // Icon
        const faIcon = root.querySelector('i.icon')
        switch (this.iconType) {
            case 'custom':
                this._apply('img.icon', function () {
                    this.onload = () => {
                        faIcon.replaceWith(this)
                        this.style.display = ''
                    }
                    this.src = folder.icon
                })
                break;
            case 'emoji':
                faIcon.innerText = folder.icon
                break;
            case 'facon':
                faIcon.classList.add(...folder.icon.split(' '))
                break;
        }

        // Move
        this._apply('.actions>i[title="Move up"]', function () {
            this.style.display = immobile || folder.isFirst ? 'none' : ''
            this.onclick = (ev) => {
                ev.stopPropagation()
                const other = folder.previous

                const oldIndex = folder.index
                folder.index = other.index, other.index = oldIndex
                other.next = folder.next, folder.next = other
                folder.previous = other.previous, other.previous = folder

                host.refresh()
                host.previousSibling.refresh()
                host.parentElement.insertBefore(host, host.previousSibling)
                folder.save().then(() => other.save())
            }
        })
        this._apply('.actions>i[title="Move down"]', function () {
            this.style.display = immobile || folder.isLast ? 'none' : ''
            this.onclick = (ev) => {
                ev.stopPropagation()
                const other = folder.next

                const oldIndex = folder.index
                folder.index = other.index, other.index = oldIndex
                other.previous = folder.previous, folder.previous = other
                folder.next = other.next, other.next = folder

                host.refresh()
                host.nextSibling.refresh()
                host.parentElement.insertBefore(host.nextSibling, host)
                folder.save().then(() => other.save())
            }
        })

        // Edit
        this._apply('i.fa-pen', function () {
            this.style.display = readonly ? 'none' : ''
            this.onclick = (ev) => {
                ev.stopPropagation()
                Dialogs.editFolder(folder).then(MainView.fullRefresh)
            }
        })
        if (!folder.isOwned) {
            root.querySelector('.actions').style.right = '25px'
            this._apply('i.fa-folder', function () {
                this.style.display = ''
                this.onclick = (ev) => {
                    ev.stopPropagation()
                    Dialogs.importBookmarks(MainView.layout).then(MainView.fullRefresh)
                }
            })
        }

        // Bookmarks
        if (!folder.collapsed) {
            for (const bookmark of folder.bookmarks.list()) {
                root.appendChild(bookmark instanceof BookmarkElement ? bookmark : new BookmarkElement(bookmark))
            }

            if (!readonly) {
                root.appendChild(new BookmarkAddElement(folder))
            }
        }

        // Collection dragging
        if (!immobile) {
            const drag = new DragDropHandler(root.querySelector('h1'))
            drag.ondragstart = (ev) => {
                ev.stopPropagation()
                ev.dataTransfer.effectAllowed = 'move'
                host.style.opacity = 0.5 // TODO: class
                MainView.elTrash.classList.add('active') // TODO: through global style?
                return { folder: folder, element: this, origin: this.nextSibling }
            }
            drag.ondragend = (ev, state) => {
                if (state && !state.dropped) {
                    state.origin.parentElement.insertBefore(this, state.origin)
                }
                host.style.opacity = null // TODO: class
                MainView.elTrash.classList.remove('active') // TODO: through global style?
            }
            drag.ondragenter = (ev, state) => {
                if (state?.folder && this !== state.element) {
                    const startIndex = Array.prototype.indexOf.call(this.parentElement.children, state.element)
                    const targetIndex = Array.prototype.indexOf.call(this.parentElement.children, this)
                    if (startIndex < 0 || startIndex > targetIndex) {
                        this.parentElement.insertBefore(state.element, this)
                    } else {
                        this.insertAdjacentElement('afterend', state.element)
                    }
                }
            }
        }

        // Bookmark dropping
        if (!readonly) {
            const drop = new DropHandler(host)
            drop.ondragover = (ev, state) => {
                const bookmark = state?.bookmark
                if (bookmark) {
                    if (bookmark.folderId === folder.id && folder.sortOrder !== 0) return // Cannot reorder non-manual folder
                    ev.preventDefault() // Can drop here
                    ev.dataTransfer.dropEffect = bookmark.folderId !== folder.id && (bookmark.readonly || ev.ctrlKey) ? 'copy' : 'move' // Can copy to another collection
                }
            }
            drop.ondrop = async (ev, state) => {
                var bookmark = state?.bookmark
                if (!bookmark) {
                    return
                }
                state.dropped = true

                // Copy tab here
                if (bookmark.readonly) {
                    const originalIcon = bookmark.icon
                    bookmark = await folder.bookmarks.create(bookmark.title, bookmark.url)
                    bookmark.icon = originalIcon
                    await bookmark.save()
                }
                else if (bookmark.folderId !== folder.id) {
                    // Copy bookmark
                    if (ev.ctrlKey) {
                        bookmark = await bookmark.duplicate()
                    }

                    // Move bookmark here
                    await bookmark.moveTo(folder)
                }

                // Place bookmark
                const index = state.element.previousSibling?.bookmark?.index + 1 || 0
                await folder.bookmarks.move(bookmark, index)
                this.refresh()
            }
        }
    }
}
customElements.define('bs-folder', FolderElement)