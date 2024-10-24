/*
Useful functions for working with tabs.
*/
export default class Tabs {
    static subscribe(callback) {
        subscribers.push(callback)
    }

    static async list() {
        return (await chrome.tabs.query({})).filter(tab => tab.id !== ownTabId)
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

    static asBookmark(tab, collection) {
        return {
            id: tab.id,
            collection: collection,
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

const ownTabId = (await chrome.tabs.getCurrent()).id

const subscribers = []
function emit(event, tabOrId) {
    for (const subscriber of subscribers) {
        subscriber(event, tabOrId)
    }
}
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tabId === ownTabId) return
    if (changeInfo.status === 'loading' || changeInfo.status === 'complete') {
        emit('updated', tab)
    }
})
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    if (tabId === ownTabId) return
    emit('closed', tabId)
})