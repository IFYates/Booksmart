import './common/html.js'
import './common/utilities.js'
import './ui/display.js'

import Layout from './models/layout.js'
import MainView from "./ui/main.js"

MainView.layout = await Layout.load()
await MainView.init()
await MainView.fullRefresh()
// await Dialogs.newBookmark(_layout.folders[0]); await MainView.fullRefresh()
// await Dialogs.editBookmark(_layout.folders[0].bookmarks.list()[0]); await MainView.fullRefresh()
// await Dialogs.newFolder(_layout); await MainView.fullRefresh()
// await Dialogs.editFolder(_layout.folders[0]); await MainView.fullRefresh()
// await Dialogs.options(_layout); await MainView.fullRefresh()
// await Dialogs.info(_layout); await MainView.fullRefresh()
// await Dialogs.importBookmarks(_layout); await MainView.fullRefresh()

// Blur sensitive content
globalThis.obfuscate = (on = true) => {
    [...document.querySelectorAll('bookmark span, folder title span')].forEach(n => n.classList.toggle('obfuscated', on))
}