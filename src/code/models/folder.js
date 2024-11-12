import State from "./state.js"

/*
A folder in the bookmarks hierarchy.
*/
export default class Folder {
    constructor(folder = {}, data = {}) {
        this.#parentId = folder.parentId
        this.#id = folder.id
        this.#dateAdded = folder.dateAdded
        this.#title = folder.title
        this.import(data)
    }

    get isOwned() { return this.#parentId == State.booksmartRootId }
    get uuid() { return `${this.#id}:${this.#dateAdded}:${this.#title.hashCode()}` }

    #parentId
    get parentId() { return this.#parentId }
    #id
    get id() { return this.#id }
    #dateAdded
    get dateAdded() { return new Date(this.#dateAdded) }

    #title
    get title() { return this.#title }
    set title(value) { this.#title = value?.trim() }
    #index
    get index() { return this.#index }
    set index(value) { this.#index = num(value) }
    #bookmarks = []
    get bookmarks() { return this.#bookmarks }

    #accentColour
    get accentColour() { return this.#accentColour }
    set accentColour(value) { this.#accentColour = value }
    #backgroundImage
    get backgroundImage() { return this.#backgroundImage }
    set backgroundImage(value) { this.#backgroundImage = value }
    #collapsed
    get collapsed() { return this.#collapsed }
    set collapsed(value) { this.#collapsed = !!value }
    #height
    get height() { return this.#height }
    set height(value) { this.#height = num(value) }
    #icon
    get icon() { return this.#icon }
    set icon(value) { this.#icon = value?.trim() }
    #scale
    get scale() { return this.#scale }
    set scale(value) { this.#scale = num(value) }
    #sortOrder
    get sortOrder() { return this.#sortOrder }
    set sortOrder(value) { this.#sortOrder = num(value) }
    #tags = []
    get tags() { return this.#tags }
    #width
    get width() { return this.#width }
    set width(value) { this.#width = num(value) }

    get immobile() { return false }
    get readonly() { return false }

    getBookmarks() {
        const result = [...this.#bookmarks]
        const compareFavourite = (a, b) => (a.favourite ? 0 : 1) - (b.favourite ? 0 : 1)
        switch (Math.abs(this.sortOrder)) {
            default: // Manual
                result.sort((a, b) => compareFavourite(a, b) || a.index - b.index)
                break;
            case 1: // Alphabetic
                result.sort((a, b) => compareFavourite(a, b) || a.title.localeCompare(b.title))
                break;
            case 2: // Creation date
                result.sort((a, b) => compareFavourite(a, b) || a.dateAddedUtc - b.dateAddedUtc)
                break;
            case 3: // Clicks
                result.sort((a, b) => compareFavourite(a, b) || b.clicks - a.clicks || a.title.localeCompare(b.title))
                break;
            case 4: // Last click
                result.sort((a, b) => compareFavourite(a, b) || b.lastClick - a.lastClick)
                break;
        }
        if (this.sortOrder < 0) {
            result.reverse()
        }
        // TODO? this.#reindex(result)
        return result
    }

    static #defaults = {
        accentColour: v => !v || State.options.accentColour.localeCompare(v, undefined, { sensitivity: 'base' }) == 0,
        backgroundImage: v => !v?.length,
        collapsed: false,
        icon: v => !v?.length,
        height: v => num(v) < 2,
        index: null,
        scale: 100,
        sortOrder: 0,
        tags: [],
        title: null,
        width: v => num(v) < 2
    }
    export(standalone) {
        const data = {
            accentColour: this.#accentColour,
            backgroundImage: this.#backgroundImage,
            collapsed: this.#collapsed,
            icon: this.#icon,
            height: this.#height,
            index: this.#index,
            scale: this.#scale,
            sortOrder: this.#sortOrder,
            tags: this.#tags.map(t => t.id),
            title: standalone ? this.#title : null,
            width: this.#width
        }.pick(Folder.#defaults)
        if (standalone) {
            data['.booksmart'] = {
                version: 1,
                content: 'Folder'
            }
            data.children = this.#bookmarks.map(b => b.export(true))
        }
        return data
    }
    
    import(data)
    {
        this.#index = num(data.index)
        this.#accentColour = data.accentColour
        this.#backgroundImage = data.backgroundImage
        this.#collapsed = !!data.collapsed
        this.#height = num(data.height)
        this.#icon = data.icon
        this.#scale = num(data.scale, 100)
        this.#sortOrder = num(data.sortOrder)
        this.#tags = data.tags?.map(d => State.options.tags.find(t => t.id == d)) || []
        this.#width = num(data.width)
    }
}