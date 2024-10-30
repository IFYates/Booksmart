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