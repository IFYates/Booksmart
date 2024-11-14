import { BaseHTMLElement } from "../../common/BaseHTMLElement.js"
import DragDropHandler from "../../common/DragDropHandler.js"
import State from "../../models/state.js"
import { FolderElement } from "./folder.js"

const template = document.createElement('template')
template.innerHTML = `<div>
    <i class="fa-fw fas fa-tag"></i>
    <span><!--$ name $--></span>
</div>
`

export default class TagElement extends BaseHTMLElement {
    #tag
    get id() { return this.#tag.id }
    get name() { return this.#tag.name }
    get colour() { return this.#tag.colour }

    constructor(tag) {
        super(template, ['/styles/tag.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
        this.#tag = tag
    }

    onclick(ev) {
        ev.stopPropagation()

        this.#tag.visible = !this.#tag.visible
        this.shadowRoot.host.classList.toggle('off', !this.#tag.visible)

        State.save()

        for (const el of document.getElementsByTagName(customElements.getName(FolderElement))) {
            el.applyTags()
        }
    }

    async _ondisplay(root, host) {
        const self = this
        host.style.setProperty('--tag-colour', self.#tag.colour)
        host.style.setProperty('--tag-colour-r', parseInt(self.#tag.colour.substring(1, 3), 16))
        host.style.setProperty('--tag-colour-g', parseInt(self.#tag.colour.substring(3, 5), 16))
        host.style.setProperty('--tag-colour-b', parseInt(self.#tag.colour.substring(5, 7), 16))

        this.shadowRoot.host.classList.toggle('off', !this.#tag.visible)
        root.innerHTML = BaseHTMLElement.replaceTemplates(root.innerHTML, this)

        if (State.options.allowEdits) {
            const drag = new DragDropHandler(host)
            drag.ondragstart = (ev) => {
                ev.stopPropagation()
                ev.dataTransfer.effectAllowed = 'link'
                host.classList.add('dragging')
            }
            drag.ondragend = (_) => {
                host.classList.remove('dragging')
            }

            drag.subscribeDrop((el) => el instanceof FolderElement && !el.folder.readonly, {
                ondragover: (ev) => {
                    const folder = ev.target.folder
                    if (self.#tag.id > 0 ? !folder.tags.includes(self.#tag) : folder.tags.length) {
                        ev.preventDefault()
                        ev.stopPropagation()
                        MainView.elLayout.classList.add('dragging')
                        ev.target.classList.add('tag-hover')
                    } else {
                        ev.dataTransfer.dropEffect = 'none'
                    }
                },
                ondragleave: (ev) => {
                    MainView.elLayout.classList.remove('dragging')
                    ev.target.classList.remove('tag-hover')
                },
                ondrop: (ev) => {
                    MainView.elLayout.classList.remove('dragging')
                    ev.target.classList.remove('tag-hover')
                    
                    const folder = ev.target.folder
                    if (self.#tag.id > 0) {
                        folder.tags.push(self.#tag)
                    } else {
                        folder.tags.splice(0, folder.tags.length)
                    }
                    State.updateEntry(folder)
                    document.getElementById('folder-' + folder.id).refresh()
                }
            })
        }
    }
}
customElements.define('bs-tag', TagElement)