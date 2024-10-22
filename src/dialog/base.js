const Dialog = {
    async show(title, display) {
        const dialog = document.createElement('dialog')
        dialog.display(() => {
            add('title', title)
            add('form', { onsubmit: () => false }, () => display(dialog))
        })
        document.body.appendChild(dialog)

        const promise = new Promise(resolve => {
            dialog.showModal()
            dialog.onclose = resolve
        })
        await promise
        dialog.parentElement.removeChild(dialog)
    }
}

export default Dialog