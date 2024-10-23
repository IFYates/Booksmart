HTMLElement.prototype.add = addToElement

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
        if (args.classes instanceof Array) {
            el.classList.add(...args.classes)
            delete args.classes
        } else if (args.classes)  {
            el.classList.add(args.classes)
            delete args.classes
        }
        Object.assign(el, args)
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