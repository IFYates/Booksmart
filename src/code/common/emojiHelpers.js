export default class Emojis {
    // TODO
    static #icons = {
        'face with tears of joy': '😂',
        'red question mark': '❓',
        'white question mark': '❔',
    }

    static get emojis() { return { ...this.#icons } }

    static isEmoji(string) {
        return string?.startsWith('\uD83D')
    }
}