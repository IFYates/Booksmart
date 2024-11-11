import Emojis from "../../common/emojiHelpers.js"
import { BaseHTMLElement, DragDropHandler } from "../../common/html.js"

const template = document.createElement('template')
template.innerHTML = `
<style type="text/css">
input {
    width: 100%;
}

list {
    display: block;
    overflow-y: scroll;
    padding-top: 5px;
    height: 150px;
}

list .emoji {
    display: inline-block;
    padding: 0 1px 3px;
    border: 1px solid transparent;
    border-radius: 3px;
    user-select: none;
}

.emoji:hover {
    border-color: var(--text-colour-darkest);
}

.emoji.selected {
    border-color: var(--text-colour);
    background-color: rgba(255, 255, 255, 0.2);
}
</style>

<input type="text" placeholder="Filter" />
<list>
    <span role="button" tabIndex="0" class="emoji fa-2x"></span>
</list>
`

export class EmojiSelectorElement extends BaseHTMLElement {
    #value
    get value() { return this.#value }

    constructor(currentIcon) {
        super(template, ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'])
        this.#value = Emojis.isEmoji(currentIcon) ? currentIcon : null
    }

    update(char, title, scrollTo, force) {
        if (force || this.#value !== char) {
            for (const el of this.shadowRoot.querySelectorAll('.selected')) {
                el.classList.remove('selected')
            }

            if (char) {
                title ??= Object.entries(Emojis.emojis).find(e => e[1] === char)?.[0]
                const el = this.shadowRoot.querySelector(`.emoji[title="${title}"]`)
                if (el) {
                    el.classList.add('selected')
                }
            }

            this.#value = char
            this.dispatchEvent(new Event('change'))
        }

        if (scrollTo) {
            const el = this.shadowRoot.querySelector('.emoji.selected')
            setTimeout(() => el?.scrollIntoView({ block: 'center' }), 100)
        }
    }

    _ondisplay(root) {
        const txtFilter = root.querySelector('input')
        txtFilter.onkeyup = function () {
            for (const el of root.querySelectorAll('.emoji')) {
                el.style.display = (!this.value || el.title.includes(this.value)) ? '' : 'none'
            }
        }

        const emojiTemplate = root.querySelector('.emoji')
        for (const entry of Object.entries(Emojis.emojis)) {
            const [name, icon] = entry
            const emoji = emojiTemplate.cloneNode(true)
            emojiTemplate.parentElement.appendChild(emoji)

            emoji.title = name
            emoji.innerText = icon
            emoji.onfocus = () => {
                this.update(icon, name, true)
            }
            emoji.onmouseenter = (ev) => {
                if (ev.buttons == 1) {
                    this.update(icon, name)
                }
            }
            emoji.onmouseup = () => {
                if (this.#value[0] == name) {
                    this.update(icon, name, true)
                }
            }
        }
        emojiTemplate.remove()
        this.update(this.#value, null, true, true)
    }
}
customElements.define('emoji-selector', EmojiSelectorElement)