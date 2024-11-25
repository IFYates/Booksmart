import './common/html.js'
import './common/utilities.js'
import './ui/elements/folderAdd.js'
import MainView from "./ui/main.js"

await MainView.init()
await MainView.fullRefresh()

// Obfuscate sensitive content
function randomText(el) {
    if (el.nodeType !== 3 || !el.textContent?.length) return
    el.textContent = el.textContent.split('').map(char => {
        if (char.match(/[A-Z]/)) {
            return String.fromCharCode(Math.floor(Math.random() * 26) + 97).toUpperCase()
        }
        else if (char.match(/[a-z]/)) {
            return String.fromCharCode(Math.floor(Math.random() * 26) + 97)
        }
        else {
            return char
        }
    }).join('')
}
globalThis.obfuscateText = function () {
    const arr = [document.body]
    while (arr.length) {
        const el = arr.shift()
        if (el.nodeType === 3) { // Text node
            randomText(el)
        }
        else { // Element node
            if (el.childNodes?.length) {
                arr.push(...el.childNodes)
            }
            if (el.shadowRoot?.childNodes) { // Shadow DOM
                arr.push(...el.shadowRoot.childNodes)
            }
        }
    }
}