HTMLElement.prototype.add = addToElement
HTMLElement.prototype.then = function (type, text, args, layout) { // Scoped
    const el = createElement(type, text, args, layout)
    this.insertAdjacentElement('afterend', el)
    return el
}

HTMLElement.prototype.clearChildren = function () {
    while (this.firstChild) {
        this.removeChild(this.firstChild)
    }
}

function addToElement(type, text, args, layout) { // Scoped
    const el = createElement(type, text, args, layout)
    this.appendChild(el)
    return el
}
globalThis.createElement = (type, text, args, layout) => {
    if (!layout) {
        if (typeof (args) === 'function') {
            [layout, args] = [args, null]
        } else if (typeof (text) === 'function') {
            [layout, args, text] = [text, null, null]
        }
    }
    if (!args && typeof (text) === 'object') {
        [args, text] = [text, null]
    }

    const el = type instanceof HTMLElement ? type : document.createElement(type)
    if (args && typeof (args) === 'object') {
        if (args.classes) {
            args.classes = Array.isArray(args.classes) ? args.classes : [args.classes]
            args.classes = [...args.classes].filter(c => !!c)
            el.classList.add(...args.classes)
            delete args.classes
        }
        Object.entries(args).forEach(v => {
            if (v[1] === null || v[1] === undefined) {
                delete el[v[0]]
            } else if (v[0][0] === '$') {
                el.setAttribute(v[0].substring(1), v[1])
            } else {
                el[v[0]] = v[1]
            }
        })
    }
    if (text && el.__lookupGetter__('textContent')) {
        el.textContent = text
    }
    if (typeof (layout) === 'function') {
        el.display(layout)
    }
    return el
}

HTMLElement.prototype.display = function (layout) {
    const previous = {
        add: globalThis.add,
        create: globalThis.create,
        refresh: globalThis.refresh
    }

    globalThis.add = addToElement.bind(this)
    globalThis.create = createElement
    globalThis.refresh = function () {
        // TODO: re-run 'layout' for element and replace
    }

    if (typeof (layout) === 'function') {
        layout.call(this, this)
    }

    Object.assign(globalThis, previous)
}

/**
 * A manager for handling CSS stylesheets.
 */
export class StyleManager {
    static #cache = {}
    static #work = []

    /**
     * Retrieves a CSSStyleSheet from the given URL, caching it for future use.
     * @param {string} url - The URL of the CSS to fetch.
     * @returns {CSSStyleSheet} The fetched CSSStyleSheet.
     */
    static get(url) {
        if (!StyleManager.#cache[url]) {
            StyleManager.#cache[url] = new CSSStyleSheet()
            StyleManager.#work.push(fetch(url)
                .then(response => response.text())
                .then(css => StyleManager.#cache[url].replaceSync(css)))
        }
        return StyleManager.#cache[url]
    }

    /**
     * Retrieves or creates a CSSStyleSheet containing all root styles.
     * @returns {CSSStyleSheet} The root CSSStyleSheet.
     */
    static root() {
        if (!StyleManager.#cache['.root']) {
            StyleManager.#cache['.root'] = new CSSStyleSheet()
            for (const rule of [...document.querySelectorAll('link[rel=stylesheet]')].flatMap(s => [...s.sheet.rules])) {
                StyleManager.#cache['.root'].insertRule(rule.cssText)
            }
        }
        return StyleManager.#cache['.root']
    }

    /**
     * Waits for all pending stylesheet fetch operations to complete.
     * @returns {Promise} A promise that resolves when all stylesheets are settled.
     */
    static async wait() { return await Promise.allSettled(StyleManager.#work) }
}

export class BaseHTMLElement extends HTMLElement {
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
            this.shadowRoot.adoptedStyleSheets.push(StyleManager.root())
        } else {
            for (const style of this.#styles) {
                this.shadowRoot.adoptedStyleSheets.push(StyleManager.get(style))
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
        await StyleManager.wait()
        this.shadowRoot.host.style.display = null

        if (typeof this.onclick === 'function') {
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

    #dragLogic = null
    _enableDragDrop() {
        return this.#dragLogic ??= new DragDrop(this.shadowRoot.host)
    }
}

export class DragDrop {
    // The current global drag state
    static #currentState = null

    #dragging = false
    get dragging() { return this.#dragging }

    #element

    constructor(element) {
        this.#element = element

        element.ondragstart = (ev) => {
            this.#dragging = true
            DragDrop.#currentState = this.ondragstart.call(element, ev)
            console.log('ondragstart', element, ev, DragDrop.#currentState)
        }
        element.ondragend = (ev) => {
            this.#dragging = false
            console.log('ondragend', element, ev, DragDrop.#currentState)
            this.ondragend.call(element, ev, DragDrop.#currentState)
            DragDrop.#currentState = null
        }

        element.ondragenter = (ev) => {
            // console.log('ondragenter', element, ev, DragDrop.#currentState)
            this.ondragenter.call(element, ev, DragDrop.#currentState)
        }
        element.ondragover = (ev) => {
            // console.log('ondragover', element, ev, DragDrop.#currentState)
            this.ondragover.call(element, ev, DragDrop.#currentState)
        }
        element.ondrop = (ev) => {
            console.log('ondrop', element, ev, DragDrop.#currentState)
            this.ondrop.call(element, ev, DragDrop.#currentState)
        }
    }

    ondragstart(ev) { } // return the state object to share to other drag/drop events
    ondragend(ev, state) { }

    ondragenter(ev, state) { }
    ondragover(ev, state) { }
    ondrop(ev, state) { }
}