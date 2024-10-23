const Dialog = {
    async show(title, display) {
        const dialog = document.body.add('dialog', function () {
            add('title', title)
            add('form', { onsubmit: () => false }, () => display(this))
        })

        const promise = new Promise(resolve => {
            dialog.showModal()
            dialog.onclose = resolve
        })
        await promise
        dialog.parentElement.removeChild(dialog)
    }
}

export default Dialog