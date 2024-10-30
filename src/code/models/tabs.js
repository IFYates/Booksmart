/*
Useful functions for working with browser tabs.
*/
export default class Tabs {
    static subscribe(callback) {
        _subscribers.push(callback)
    }

    static async list() {
        const tabs = await chrome.tabs.query({})
        return tabs.filter(tab => !isSelf(tab))
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

const ownTab = (await chrome.tabs.getCurrent()).tidy(['id', 'url'])
const isSelf = (tab) => tab.id === ownTab.id || tab.url === ownTab.url || tab.favIconUrl.startsWith(document.location.origin)

const _subscribers = []
function emit(event, tabOrId) {
    for (const subscriber of _subscribers) {
        subscriber(event, tabOrId)
    }
}
chrome.tabs.onUpdated.addListener(async (id, changeInfo, tab) => {
    if (!isSelf(tab) && changeInfo.status === 'complete' || changeInfo.hasOwnProperty('title')) {
        emit('updated', tab)
    }
})
chrome.tabs.onRemoved.addListener(async (tabId, _) => {
    emit('closed', tabId)
})