import './utilities.js'

// TODO: review these helpers

function addToElement(type, text, args, logic) { // Scoped
    const el = createElement(type, text, args, logic)
    this.appendChild(el)
    return el
}

/**
 * Invoked on subscription and when the class list of the element changes.
 * @param {function} handler The handler function for the event. Takes the class list as an argument.
 */
function on_class(handler) {
    const observer = _observers[this]?.observer || new MutationObserver(classMutationObserver.bind(this))
    if (!_observers[this]) {
        _observers[this] = []
    } else {
        _observers[this].push(handler)
    }
    observer.observe(this, { attributes: true, attributeFilter: ['class'] })
    handler.call(this, [...this.classList])
}
function classMutationObserver(mutations) {
    const handlers = _observers[this]
    if (handlers && mutations.some(m => m.type == 'attributes' && m.attributeName == 'class')) {
        handlers.forEach(h => h.call(this, [...this.classList]))
    }
}
const _observers = {}

function eventHandler(self, eventName, handler) {
    self.addEventListener(eventName, (ev) => handler.call(self, self.value, ev))
    handler.call(self, self.value, null)
}
HTMLElement.prototype.extend(
    // Events
    function on_change(handler) { eventHandler(this, 'change', handler) },
    function on_click(handler) { eventHandler(this, 'click', handler) },
    on_class,

    // Elements
    function add() { return addToElement.apply(this, arguments) },
    function and(type, text, args, logic) { // Scoped
        const el = createElement(type, text, args, logic)
        this.insertAdjacentElement('afterend', el)
        return el
    },

    function clearChildren() {
        while (this.firstChild) {
            this.removeChild(this.firstChild)
        }
    },

    // Display
    function display(logic) {
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
    },
    function show(state) {
        state = arguments.length == 0 || state
        this.style.display = state ? '' : 'none'
        return state
    },
    function hide() {
        this.style.display = 'none'
    }
)

const CORS_PROXY = 'https://corsproxy.io/?'
HTMLImageElement.prototype.extend(
    function showImageAsDataUrl(url) {
        const img = this
        return new Promise((resolve, reject) => {
            if (url.startsWith('data:') || /\.svg(?:\?|$)/i.test(url)) {
                img.src = url
                resolve(img.src)
                return
            }
    
            img.crossOrigin = 'anonymous' // Try with CORS support first

            var failCount = 0
            img.onerror = () => {
                switch (++failCount) {
                    case 1:
                        // First failure retries without CORS proxy
                        img.src = url
                        break
                    case 2:
                        // Second failure removes CORS bypass (won't cache)
                        img.crossOrigin = null
                        break
                    case 3:
                        // Failed now
                        img.onerror = null
                        reject(null)
                        break
                }
            }

            img.onload = async () => {
                img.onload = null

                // Resolve data URL
                try {
                    const canvas = document.createElement('canvas')
                    canvas.width = img.naturalWidth
                    canvas.height = img.naturalWidth
                    const ctx = canvas.getContext('2d')
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                    img.src = canvas.toDataURL()
                    resolve(img.src)
                } catch {
                    resolve(img.src) // Didn't get data URL, but did get image
                }
            }

            img.src = CORS_PROXY + url
        })
    },
    function getAverageColour() {
        const ctx = document.createElement("canvas").getContext("2d")
        ctx.drawImage(this, 0, 0, 1, 1)
        const px = ctx.getImageData(0, 0, 1, 1).data
        return "#" + ((1 << 24) + (px[0] << 16) + (px[1] << 8) + px[2]).toString(16).slice(1)
    }
)
globalThis.extend(
    function createElement(type, text, args, logic) {
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
)