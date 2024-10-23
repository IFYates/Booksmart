HTMLElement.prototype.append = function (type, text, args) {
    if (!args && typeof (text) === 'object') {
        [args, text] = [text, null]
    }

    const el = type instanceof HTMLElement ? type : document.createElement(type)
    if (text && el.__lookupGetter__('textContent')) el.textContent = text
    this.appendChild(el)

    if (args && typeof (args) === 'object') {
        for (var key in args) {
            el[key] = args[key]
        }
    }

    return el
}

HTMLElement.prototype.clearChildren = function () {
    while (this.firstChild) {
        this.removeChild(this.firstChild)
    }
}

HTMLElement.prototype.display = function (layout) {
    const self = this
    const previous = { add: globalThis.add }
    
    globalThis.add = function (type, text, args, layout) {
        if (!layout) {
            if (typeof (args) === 'function') {
                [layout, args] = [args, null]
            } else if (typeof (text) === 'function') {
                [layout, text] = [text, null]
            }
        }
        var el = self.append(type, text, args)
        if (typeof (layout) === 'function') {
            el.display(layout)
        }
        return el
    }
    globalThis.refresh = function () {
        // TODO: rebuild element and replace
    }

    if (typeof (layout) === 'function') {
        layout.call(self, self)
    }

    globalThis.add = previous.add
}