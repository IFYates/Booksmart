globalThis.iconButton = function (icon, title, onclick) {
    add('i', {
        className: `fa-fw ${icon}`,
        title: title,
        onclick: function (ev) {
            ev.stopPropagation()
            Promise.resolve(onclick.call(this, ev))
            return false
        }
    })
}