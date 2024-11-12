import State from "../../models/state.js";
import Tag from "../../models/Tag.js";
import BaseDialog from "./base.js";

export default class TagsDialog extends BaseDialog {
    constructor() {
        super('fas fa-tags', 'Tags')
    }

    _refresh(dialog) {
        dialog.querySelector('form').display((el) => {
            while (el.firstChild) {
                el.firstChild.remove()
            }
            this._display(dialog)
        })
    }

    _display(dialog) {
        // Head
        add('div', 'Tag name')
        add('div', 'Colour')
        add('div')

        // Row per tag
        console.log(State.options)
        for (const tag of State.options.tags) {
            add('input', { type: 'text', maxlength: 20, value: tag.name }, (el) => {
                el.addEventListener('blur', async () => {
                    el.value = el.value?.trim()
                    if (el.value != tag.name) {
                        tag.name = el.value
                        await State.save()
                    }
                })
            })
            add('input', { type: 'color', value: tag.colour }, (el) => {
                el.addEventListener('change', async () => {
                    tag.colour = el.value
                    await State.save()
                })
            })
            add('div', () => {
                add('button', { type: 'button' }, () => {
                    add('i', { className: 'fa-fw fas fa-trash-can', title: 'Delete tag' })
                }).onclick = async () => {
                    // TODO: remove from all folders
                    console.error('Not implemented')
                }
            })
        }

        // New tag
        var newColour = '#' + Math.rand(0, 256).toString(16) + Math.rand(0, 256).toString(16) + Math.rand(0, 256).toString(16)
        add('input', { type: 'text', maxlength: 20, placeholder: 'New tag' }, (el) => {
            el.addEventListener('keydown', async (ev) => {
                el.value = el.value?.trim()
                if (el.value.length && ev.key == 'Enter') {
                    State.options.tags.push(new Tag(State.options.tags.length + 1, el.value, newColour))
                    await State.save()
                    this._refresh(dialog)
                }
            })
        })
        add('input', { type: 'color', value: newColour }, (el) => {
            el.addEventListener('change', () => {
                newColour = el.value
            })
        })
        add('div')

        add('div', { className: 'spanCols3', style: 'text-align: right' }, () => {
            add('button', 'Close', { type: 'button' }).onclick = async () => {
                dialog.close()
            }
        })
    }
}