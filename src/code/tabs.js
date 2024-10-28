/*
Useful functions for working with browser tabs.
*/
export default class Tabs {
    static subscribe(callback) {
        _subscribers.push(callback)
    }

    static async list() {
        const tabs = await chrome.tabs.query({})
        return tabs.filter(tab => tab.url !== document.location.href)
            .sort((a, b) => (a.windowId - b.windowId) || a.title.localeCompare(b.title))
    }

    static async find(url) {
        url = new URL(url)
        const q = `*://${url.host}${url.pathname}${url.search}`
        var tabs = await chrome.tabs.query({ url: q })
        return tabs.length > 0 ? tabs[0] : null
    }

    static async focus(tab) {
        await chrome.windows.update(tab.windowId, { focused: true })
        await chrome.tabs.update(tab.id, { active: true })
    }

    static asBookmark(tab, folder) {
        return {
            // TODO
            id: tab.id,
            folderId: folder.id,
            readonly: true,
            isTab: true,
            favourite: false,
            icon: tab.favIconUrl,
            domain: isURL(tab.url) ? new URL(tab.url).origin : null,
            altIcon: 'fa-window-maximize',
            url: tab.url,
            title: tab.title,
            hasOpenTab: () => true,
            click: async (ev) => {
                ev.preventDefault()
                await Tabs.focus(tab)
            }
        }
    }
}

const _subscribers = []
function emit(event, tabOrId) {
    for (const subscriber of _subscribers) {
        subscriber(event, tabOrId)
    }
}
chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
    if (tab.url === document.location.href) return
    if (changeInfo.hasOwnProperty('title')) {
        emit('updated', tab)
    }
})
chrome.tabs.onRemoved.addListener(async (tabId, _) => {
    emit('closed', tabId)
})