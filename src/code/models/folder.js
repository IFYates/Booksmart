import State from "./state.js"

/*
A folder in the bookmarks hierarchy.
*/
export default class Folder {
    constructor(folder, data = {}) {
        this.#parentId = folder.parentId
        this.#id = folder.id
        this.#dateAdded = folder.dateAdded
        this.#title = folder.title
        this.import(data)
    }

    get isOwned() { return this.#parentId == State.booksmartRootId }

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
    #icon
    get icon() { return this.#icon }
    set icon(value) { this.#icon = value?.trim() }
    #scale
    get scale() { return this.#scale }
    set scale(value) { this.#scale = num(value) }
    #sortOrder
    get sortOrder() { return this.#sortOrder }
    set sortOrder(value) { this.#sortOrder = num(value) }

    get immobile() { return false }
    get readonly() { return false }

    static #defaults = {
        accentColour: v => !v,
        backgroundImage: v => !v?.length,
        collapsed: false,
        icon: v => !v?.length,
        index: null,
        scale: 100,
        sortOrder: 0,
        title: null
    }
    export(standalone) {
        return {
            accentColour: this.#accentColour,
            backgroundImage: this.#backgroundImage,
            collapsed: this.#collapsed,
            icon: this.#icon,
            index: this.#index,
            scale: this.#scale,
            sortOrder: this.#sortOrder,
            title: standalone ? this.#title : null
        }.pick(Folder.#defaults)
    }
    
    import(data)
    {
        this.#index = num(data.index)
        this.#accentColour = data.accentColour
        this.#backgroundImage = data.backgroundImage
        this.#collapsed = !!data.collapsed
        this.#icon = data.icon
        this.#scale = num(data.scale, 100)
        this.#sortOrder = num(data.sortOrder)
    }
}