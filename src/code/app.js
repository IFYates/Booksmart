import './common/html.js'
import './common/utilities.js'

import Dialogs from './ui/dialogs.js'
import MainView from "./ui/main.js"
import State from './models/state.js'

await State.init()
await MainView.init()
await MainView.fullRefresh()

// await Dialogs.newBookmark(State.folders[0]); await MainView.fullRefresh()
// await Dialogs.editBookmark((await State.folders.entries())[0].bookmarks.list()[0]); await MainView.fullRefresh()
// await Dialogs.newFolder(); await MainView.fullRefresh()
// await Dialogs.editFolder((await State.folders.entries())[0]); await MainView.fullRefresh()
// await Dialogs.info(); await MainView.fullRefresh()
// await Dialogs.importBookmarks(); await MainView.fullRefresh()
// await Dialogs.options(); await MainView.fullRefresh()

// Blur sensitive content
globalThis.obfuscate = (on = true) => {
    [...document.querySelectorAll('bookmark span, folder title span')].forEach(n => n.classList.toggle('obfuscated', !!on))
}