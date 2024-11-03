import './common/html.js'
import './common/utilities.js'
import './ui/display.js'

import Dialogs from './ui/dialogs.js'
import Layout from './models/layout.js'
import MainView from "./ui/main.js"

MainView.layout = await Layout.load()
await MainView.init()
await MainView.fullRefresh()
// await Dialogs.newBookmark(MainView.layout.folders[0]); await MainView.fullRefresh()
// await Dialogs.editBookmark((await MainView.layout.folders.entries())[0].bookmarks.list()[0]); await MainView.fullRefresh()
// await Dialogs.newFolder(MainView.layout); await MainView.fullRefresh()
// await Dialogs.editFolder((await MainView.layout.folders.entries())[0]); await MainView.fullRefresh()
// await Dialogs.info(MainView.layout); await MainView.fullRefresh()
// await Dialogs.importBookmarks(MainView.layout); await MainView.fullRefresh()
await Dialogs.options(MainView.layout); await MainView.fullRefresh()

// Blur sensitive content
globalThis.obfuscate = (on = true) => {
    [...document.querySelectorAll('bookmark span, folder title span')].forEach(n => n.classList.toggle('obfuscated', !!on))
}