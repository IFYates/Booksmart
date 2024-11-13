import State from "../models/state.js"

function eventHandler(self, eventName, handler) {
    self.addEventListener(eventName, (ev) => handler.call(self, self.value, ev))
    handler.call(self, self.value, null)
}
HTMLElement.prototype.on_change = function (handler) { eventHandler(this, 'change', handler) }
HTMLElement.prototype.on_click = function (handler) { eventHandler(this, 'click', handler) }

HTMLElement.prototype.show = function (state) {
    this.style.display = !!state ? '' : 'none'
    return !!state
}

HTMLElement.prototype.add = addToElement
HTMLElement.prototype.and = function (type, text, args, logic) { // Scoped
    const el = createElement(type, text, args, logic)
    this.insertAdjacentElement('afterend', el)
    return el
}

HTMLElement.prototype.clearChildren = function () {
    while (this.firstChild) {
        this.removeChild(this.firstChild)
    }
}

function addToElement(type, text, args, logic) { // Scoped
    const el = createElement(type, text, args, logic)
    this.appendChild(el)
    return el
}
globalThis.createElement = (type, text, args, logic) => {
    if (!logic) {
        if (typeof (args) == 'function') {
            [logic, args] = [args, null]
        } else if (typeof (text) == 'function') {
            [logic, args, text] = [text, null, null]
        }
    }
    if (!args && typeof (text) == 'object') {
        [args, text] = [text, null]
    }

    const el = type instanceof HTMLElement ? type : document.createElement(type)
    if (args && typeof (args) == 'object') {
        if (args.classes) {
            args.classes = Array.isArray(args.classes) ? args.classes : [args.classes]
            args.classes = [...args.classes].filter(c => !!c)
            el.classList.add(...args.classes)
            delete args.classes
        }
        Object.entries(args).forEach(v => {
            if (v[1] === null || v[1] === undefined) {
                delete el[v[0]]
            } else if (v[0][0] == '$') {
                el.setAttribute(v[0].substring(1), v[1])
            } else {
                el[v[0]] = v[1]
            }
        })
    }
    if (text && el.__lookupGetter__('textContent')) {
        el.textContent = text
    }
    if (typeof (logic) == 'function') {
        el.display(logic)
    }
    return el
}

HTMLElement.prototype.display = function (logic) {
    const previous = {
        add: globalThis.add,
        create: globalThis.create,
        refresh: globalThis.refresh
    }

    globalThis.add = addToElement.bind(this)
    globalThis.create = createElement
    this.layout = function () {
        this.display(logic)
    }

    if (typeof (logic) == 'function') {
        logic.call(this, this)
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
    get host() { return this.#template ? this.shadowRoot.host : this }

    static TemplateRE = /<!--\$\s*([\w\.]+)\s*\$-->/
    static replaceTemplates(input, object) {
        input = String(input)
        var m, result = ''
        while (m = BaseHTMLElement.TemplateRE.exec(input)) {
            result += input.substring(0, m.index) + (object[m[1]] || '')
            input = input.substring(m.index + m[0].length)
        }
        return result + input
    }

    constructor(template, styles) {
        super()

        if (template) {
            this.attachShadow({ mode: 'open' })
            this.#template = template
            this.#styles = styles || []
        }
    }

    refresh() {
        this._reset()
        this._ondisplay(this.shadowRoot, this.host)
    }

    _reset() {
        if (!this.#template) {
            this.innerHTML = ''
            return
        }

        this.shadowRoot.innerHTML = ''
        const template = this._prepareTemplate(this.#template.innerHTML)
        this.shadowRoot.innerHTML = template

        if (!this.#styles) {
            // Apply main CSS to shadow
            this.shadowRoot.adoptedStyleSheets.push(StyleManager.root())
        } else {
            for (const style of this.#styles) {
                this.shadowRoot.adoptedStyleSheets.push(StyleManager.get(style))
            }
        }
    }

    _prepareTemplate(template) { return template }

    attachInternals() {
        super.attachInternals()
        console.warn('attached', this)
    }

    #displayed = false
    async connectedCallback() {
        if (this.#displayed) return
        this.#displayed = true
        const self = this

        if (this.#template) {
            this.host.style.display = 'none !important'
            requestAnimationFrame(async () => {
                this._reset()
                await StyleManager.wait()
                await this._ondisplay(this.shadowRoot, this.host)
                if (this.host.style.display == 'none !important') {
                    this.host.style.display = null
                }
            })
        }

        if (typeof this.onclick == 'function') {
            this.host.addEventListener('click', (ev) => this.onclick.call(self, ev))
        }
        if (typeof this.onmouseenter == 'function') {
            this.host.addEventListener('mouseenter', (ev) => this.onmouseenter.call(self, ev))
        }
    }

    // Called whenever element customisation should occur
    async _ondisplay(root, host) { }

    //onclick(ev) // optional
    //onmouseenter(ev) // optional

    /** Apply changes to matching elements */
    _apply(selector, logic) {
        for (const el of this.shadowRoot.querySelectorAll(selector)) {
            logic.call(el, el)
        }
    }
}

// TODO: obsolete
export class DropHandler {
    #registration
    #element
    get element() { return this.#element }

    constructor(element) {
        this.#element = element
        this.#registration = this.register()
    }

    register() {
        if (this.#registration) {
            return this.#registration
        }

        const self = this, element = this.#element
        function eventHandler(ev) {
            // console.log(ev.type, element, ev, DragDropHandler.state)
            self['on' + ev.type]?.call(element, ev, DragDropHandler.state)
        }
        element.addEventListener('dragenter', eventHandler)
        element.addEventListener('dragleave', eventHandler)
        element.addEventListener('drop', eventHandler)
        return {
            unregister: () => {
                element.removeEventListener('dragenter', eventHandler)
                element.removeEventListener('dragleave', eventHandler)
                element.removeEventListener('drop', eventHandler)
                self.#registration = null
            }
        }
    }
    unregister() {
        this.#registration?.unregister()
    }

    ondragenter(ev, state) { }
    ondragleave(ev, state) { }
    ondragover(ev, state) { }
    ondrop(ev, state) { }
}

export class DragDropHandler extends DropHandler {
    // The current global drag state
    static #currentState = null
    static get state() { return DragDropHandler.#currentState }

    constructor(element) {
        super(element)
        element.draggable = true

        const self = this
        function execFiltered(ev) {
            const el = ev.composedPath().find(el => DragDropHandler.#currentState.dropTargetFilter(el))
            if (!el) {
                ev.preventDefault()
                ev.stopPropagation()
                ev.dataTransfer.dropEffect = 'none'
                return
            }

            const clone = DragEvent.prototype.allKeys().reduce((o, k) => { o[k] = ev[k]; return o }, {})
            clone.stopPropagation = ev.stopPropagation.bind(ev)
            clone.target = el
            clone.preventDefault = ev.preventDefault.bind(ev)
            self['on' + ev.type].call(element, clone, DragDropHandler.#currentState)
        }

        element.addEventListener('dragstart', (ev) => {
            DragDropHandler.#currentState = this.ondragstart.call(element, ev)
            // console.log('ondragstart', element, ev, DragDropHandler.#currentState)

            if (typeof DragDropHandler.#currentState.dropTargetFilter == 'function') {
                super.unregister()
                document.addEventListener('dragenter', execFiltered)
                document.addEventListener('dragleave', execFiltered)
                document.addEventListener('dragover', execFiltered)
                document.addEventListener('drop', execFiltered)
            }
        })
        element.addEventListener('dragend', (ev) => {
            // console.log('ondragend', element, ev, DragDropHandler.#currentState)
            document.removeEventListener('dragenter', execFiltered)
            document.removeEventListener('dragleave', execFiltered)
            document.removeEventListener('dragover', execFiltered)
            document.removeEventListener('drop', execFiltered)
            super.register()

            this.ondragend.call(element, ev, DragDropHandler.#currentState)
            DragDropHandler.#currentState = null
        })
    }

    ondragstart(ev) { } // return the state object to share to other drag/drop events
    ondragend(ev, state) { }
}