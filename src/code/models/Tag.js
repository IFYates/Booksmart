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

    export() {
        return {
            id: this.#id,
            name: this.#name,
            colour: this.#colour
        }
    }

    static import(data) {
        return new Tag(num(data.id), data.name || 'Tag', data.colour || '#808080')
    }
}