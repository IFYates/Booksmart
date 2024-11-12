import { BaseHTMLElement } from "../../common/html.js"

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
        this.shadowRoot.host.classList.toggle('off')
    }

    async _ondisplay(root, host) {
        host.style.setProperty('--tag-colour', this.#tag.colour)
        host.style.setProperty('--tag-colour-r', parseInt(this.#tag.colour.substring(1, 3), 16))
        host.style.setProperty('--tag-colour-g', parseInt(this.#tag.colour.substring(3, 5), 16))
        host.style.setProperty('--tag-colour-b', parseInt(this.#tag.colour.substring(5, 7), 16))

        root.innerHTML = BaseHTMLElement.replaceTemplates(root.innerHTML, this)
    }
}
customElements.define('bs-tag', TagElement)