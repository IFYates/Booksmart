export default class Tag {
    constructor(id, name, colour) {
        this.#id = id
        this.#name = name
        this.#colour = colour
    }

    #id
    get id() { return this.#id }
    #name
    get name() { return this.#name }
    set name(value) { this.#name = value }
    #colour
    get colour() { return this.#colour }
    set colour(value) { this.#colour = value }
    #visible = true
    get visible() { return this.#visible }
    set visible(value) { this.#visible = !!value }

    static #defaults = {
        id: null,
        name: null,
        colour: null,
        visible: true
    }
    export() {
        return {
            id: this.#id,
            name: this.#id > 0 ? this.#name : null,
            colour: this.#id > 0 ? this.#colour : null,
            visible: this.#visible
        }.pick(Tag.#defaults)
    }

    static import(data) {
        const tag = new Tag(num(data.id), data.name || 'Tag', data.colour || '#808080')
        tag.visible = data.visible !== false
        return tag
    }
}