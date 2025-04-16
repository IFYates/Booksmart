import { Boxicons } from "./Icons.Boxicons.js"
import { Emojis } from "./Icons.Emojis.js"
import { FontAwesome } from "./Icons.FontAwesome.js"
import { GoogleMaterial } from "./Icons.GoogleMaterial.js"
import { Hugeicons } from "./Icons.Hugeicons.js"
import { Iconoir } from "./Icons.Iconoir.js"

var _icons = [
    ...Boxicons.icons,
    ...Emojis.icons,
    ...FontAwesome.icons,
    ...GoogleMaterial.icons,
    // ...Hugeicons.icons,
    // ...Iconoir.icons
]
_icons = _icons.sort((a, b) => a.name.localeCompare(b.name))

export default class IconProvider {
    static get CSS() {
        return [
            Boxicons.CSS,
            FontAwesome.CSS,
            GoogleMaterial.CSS,
            Hugeicons.CSS,
            Iconoir.CSS
        ]
    }

    static findIcon(value) {
        if (!value) {
            return null
        }
        
        // Explicit
        if (value.id && (value.content || value.classes || value.src)) {
            return value
        }

        // By id
        var icon = _icons.find(i => i.id == value)
        if (icon) {
            return icon
        }

        // By classes
        const words = `${value}`.toLowerCase().split(' ')
        for (var icon of _icons) {
            if (icon.classes && words.every(w => icon.classes.includes(w))) {
                return icon
            }
        }
        return null
    }

    static icons() { return _icons }

    // static get icons() { return Object.entries(this.#icons) }
    // static getStyles(...styles) {
    //     const icons = {}
    //     if (!styles.length) styles = null
    //     for (const [icon, istyles] of this.icons) {
    //         const intersect = styles?.filter(s => istyles.includes(s)) || istyles
    //         if (intersect.length > 0) {
    //             icons[icon] = intersect
    //         }
    //     }
    //     return icons
    // }

    // static isBoxicon(string) {
    //     return string?.slice(0, 3) == 'bx '
    // }
}