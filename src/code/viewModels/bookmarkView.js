/*
View model for Bookmark.
*/
export default class BookmarkView {
    static display(layout, folder, bookmark, isFirst, isLast) {
        if (bookmark.type === 'separator') {
            return add('bookmark', { className: 'separator' })
        }

        /*add('bookmark', {
            id: bookmark.id ? ((bookmark.isTab ? 'tab-' : 'bookmark-') + bookmark.id) : null,
            classes: [bookmark.favourite ? 'favourite' : '', bookmark.readonly ? 'tab' : ''],
            draggable: layout.allowEdits,
            ondragstart: function (ev) {
                if (!layout.allowEdits) {
                    ev.preventDefault()
                    return
                }

                ev.stopPropagation()
                ev.dataTransfer.effectAllowed = bookmark.isTab ? 'copy' : 'copyMove'
                MainView.dragInfo = { bookmark: bookmark, element: this, origin: this.nextSibling }
                this.style.opacity = 0.5
                if (!bookmark.isTab) {
                    MainView.elTrash.classList.add('active')
                }
            },
            ondragenter: function () {
                const dragging = MainView.dragInfo?.bookmark
                if (dragging && !bookmark.isTab) {
                    if (dragging.folderId === folder.id && folder.sortOrder !== 0) {
                        return // Cannot reorder non-manual folder
                    }

                    var target = !dragging.favourite ? this : this.parentElement.querySelectorAll('bookmark:first-of-type')[0]
                    if (target !== MainView.dragInfo.element) {
                        const startIndex = Array.prototype.indexOf.call(target.parentElement.children, MainView.dragInfo.element)
                        const targetIndex = Array.prototype.indexOf.call(target.parentElement.children, target)
                        if (startIndex < 0 || startIndex > targetIndex) {
                            target.parentElement.insertBefore(MainView.dragInfo.element, target)
                        } else {
                            target.insertAdjacentElement('afterend', MainView.dragInfo.element)
                        }
                    }
                }
            },
            ondragend: function () {
                if (MainView.dragInfo && !MainView.dragInfo.dropped) {
                    MainView.dragInfo.origin.parentElement.insertBefore(this, MainView.dragInfo.origin)
                }
                this.style.opacity = null
                MainView.elTrash.classList.remove('active')
                MainView.dragInfo = null
            }
        }, function () {
            if (bookmark.isTab) {
                this.classList.add('tab')
            }
            this.setAttribute('data-index', bookmark.index)

            add('a', {
                title: bookmark.url,
                href: bookmark.url,
                target: layout.openNewTab ? '_blank' : '',
                onclick: (ev) => bookmark.click(ev, layout.openExistingTab, layout.openNewTab),
                onmouseenter: () => bookmark.hasOpenTab()
            }, () => {
                var faIcon = add('i', { className: 'icon fa-fw' })
                if (bookmark.icon?.includes('fa-')) {
                    faIcon.classList.add(...bookmark.icon.split(' '))
                } else if (bookmark.altIcon?.includes('fa-')) {
                    faIcon.classList.add('fas', bookmark.altIcon)
                } else {
                    faIcon.classList.add('fas', 'fa-bookmark')
                }

                const icon = bookmark.icon ? bookmark.icon : `${bookmark.domain}/favicon.ico`
                if (!icon.includes('fa-') && !icon.startsWith('chrome:') && layout.showFavicons) {
                    var imgIcon = add('img', { src: icon, className: 'icon', style: 'display:none' })
                    imgIcon.onload = () => {
                        faIcon.replaceWith(imgIcon)
                        imgIcon.style.display = ''
                    }
                }

                add('span', bookmark.title, { classes: ['title', layout.wrapTitles ? '' : 'nowrap'] })

                if (layout.allowEdits && !bookmark.readonly) {
                    add('div', { className: 'actions' }, () => {
                        if (folder.sortOrder === 0 && !bookmark.readonly) {
                            if (!isFirst) {
                                iconButton('fas fa-arrow-up', 'Move up', () => bookmark.setIndex(bookmark.index - 1).then(() => MainView.refreshFolder(folder)))
                            }
                            if (!isLast) {
                                iconButton('fas fa-arrow-down', 'Move down', () => bookmark.setIndex(bookmark.index + 1).then(() => MainView.refreshFolder(folder)))
                            }
                        }
                        iconButton('fas fa-pen', 'Edit bookmark', () => Dialogs.editBookmark(bookmark, folder).then(() => MainView.refreshFolder(folder)))
                    })
                }
            })
        })/**/
        return add('bs-bookmark', {
            $bookmark: `${folder.id}#${bookmark.id}`
        })
    }
}

import Dialogs from '../ui/dialogs.js'
import MainView from "../ui/main.js"

class Styles {
    static #cache = {}
    static #work = []

    static get(url) {
        if (!Styles.#cache[url]) {
            Styles.#cache[url] = new CSSStyleSheet()
            Styles.#work.push(fetch(url)
                .then(response => response.text())
                .then(css => Styles.#cache[url].replaceSync(css)))
        }
        return Styles.#cache[url]
    }

    static root() {
        if (!Styles.#cache['.root']) {
            Styles.#cache['.root'] = new CSSStyleSheet()
            for (const rule of [...document.querySelectorAll('link[rel=stylesheet]')].flatMap(s => [...s.sheet.rules])) {
                Styles.#cache['.root'].insertRule(rule.cssText)
            }
        }
        return Styles.#cache['.root']
    }

    static async wait() { return await Promise.allSettled(Styles.#work) }
}

class BaseHTMLElement extends HTMLElement {
    #template
    #styles

    constructor(template, styles) {
        super()
        this.attachShadow({ mode: 'open' })

        this.#template = template
        this.#styles = styles
        this.reset()
    }

    reset() {
        this.shadowRoot.innerHTML = ''
        this.shadowRoot.appendChild(this.#template.content.cloneNode(true))

        if (!this.#styles) {
            // Apply main CSS to shadow
            this.shadowRoot.adoptedStyleSheets.push(Styles.root())
        } else {
            for (const style of this.#styles) {
                this.shadowRoot.adoptedStyleSheets.push(Styles.get(style))
            }
        }
    }

    #displayed = false
    async connectedCallback() {
        if (this.#displayed) return
        this.#displayed = true
        const self = this

        this.shadowRoot.host.style.display = 'none'
        await this.ondisplay()
        await Styles.wait()
        this.shadowRoot.host.style.display = null

        if (this.onclick) {
            this.shadowRoot.host.addEventListener('click', (ev) => this.onclick.call(self, ev))
        }
    }

    // Called whenever element customisation should occur
    async ondisplay() { }

    //onclick() // optional

    // Apply changes to matching elements
    _apply(selector, logic) {
        for (const el of this.shadowRoot.querySelectorAll(selector)) {
            logic.call(el, el)
        }
    }
}

const template = document.createElement('template')
template.innerHTML = `
<a>
    <i class="icon fa-fw fas fa-bookmark"></i>
    <img class="icon" style="display:none" />
    <div class="favourite">
        <i class="fa-fw far fa-square" title="Pin"></i>
        <i class="fa-fw fas fa-thumbtack" title="Unpin"></i>
    </div>
    <span class="title"></span>
    <div class="actions">
        <i class="fa-fw fas fa-arrow-up" title="Move up"></i>
        <i class="fa-fw fas fa-arrow-down" title="Move down"></i>
        <i class="fa-fw fas fa-pen" title="Edit bookmark"></i>
    </div>
</a>
`
class BookmarkElement extends BaseHTMLElement {
    #bookmark

    constructor() {
        super(template, ['/code/ui/common.css', '/code/ui/bookmark.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
    }

    async ondisplay() {
        super.reset()
        const self = this

        // Find source data
        const bookmarkRef = this.getAttribute('bookmark')?.split('#')
        const folder = bookmarkRef?.length === 2 ? await MainView.layout.folders.get(bookmarkRef[0]) : null
        const bookmark = folder ? await folder.bookmarks.get(bookmarkRef[1]) : null
        this.#bookmark = bookmark

        // Icon
        const icon = bookmark?.icon ? bookmark.icon : bookmark?.domain ? `${bookmark.domain}/favicon.ico` : ''
        const faIcon = this.shadowRoot.querySelector('i.icon')
        if (icon.includes('fa-')) {
            faIcon.classList.remove('fas', 'fa-bookmark')
            faIcon.classList.add(...bookmark.icon.split(' '))
        } else if (icon && !icon.startsWith('chrome:') /* TODO && layout.showFavicons*/) {
            this._apply('img.icon', function () {
                this.onload = () => {
                    faIcon.replaceWith(this)
                    this.style.display = ''
                }
                this.src = icon
            })
        }

        // Link
        this._apply('a', function () {
            this.href = bookmark?.url
            this.title = bookmark?.url
        })
        this.shadowRoot.querySelector('a>span').textContent = bookmark?.title

        // Style
        this.shadowRoot.host.classList.toggle('favourite', bookmark?.favourite)
        this.shadowRoot.host.classList.toggle('readonly', bookmark?.readonly || !MainView.layout.allowEdits)

        // Favourite
        this.shadowRoot.querySelector('.favourite>i[title="Pin"]').style.display = bookmark?.favourite ? 'none' : ''
        this.shadowRoot.querySelector('.favourite>i[title="Unpin"]').style.display = bookmark?.favourite ? '' : 'none'
        this.shadowRoot.querySelector('.favourite').onclick = () => {
            bookmark.favourite = !bookmark.favourite
            bookmark.save().then(() => MainView.refreshFolder(folder))
            return false
        }

        // Move
        this._apply('.actions>i[title="Move up"]', function () {
            this.style.display = bookmark?.isFirst ? 'none' : ''
            this.onclick = () => {
                const [newIndex, oldIndex] = [bookmark.previous.index, bookmark.index]
                Promise.allSettled([
                    bookmark.setIndex(newIndex),
                    bookmark.previous.setIndex(oldIndex)
                ]).then(() => { console.log(bookmark.id, bookmark.index); MainView.refreshFolder(folder) })
                return false
            }
        })
        this._apply('.actions>i[title="Move down"]', function () {
            this.style.display = bookmark?.isLast ? 'none' : ''
            this.onclick = () => {
                const [newIndex, oldIndex] = [bookmark.next.index, bookmark.index]
                Promise.allSettled([
                    bookmark.setIndex(newIndex),
                    bookmark.next.setIndex(oldIndex)
                ]).then(() => MainView.refreshFolder(folder))
                return false
            }
        })
        if (bookmark.favourite) {
            this._apply('.actions>i[title="Move up"],.actions>i[title="Move down"]', (el) => {
                el.style.display = 'none'
            })
        }

        // Edit
        this.shadowRoot.querySelector('i[title="Edit bookmark"]').onclick = () => {
            Dialogs.editBookmark(bookmark, folder).then(() => MainView.refreshFolder(folder))
            return false
        }
    }
}
customElements.define('bs-bookmark', BookmarkElement);