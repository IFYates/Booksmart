const ownTab = (await chrome.tabs.getCurrent()).tidy(['id', 'url'])

const _subscribers = []
function emit(event, tabOrId) {
    for (const subscriber of _subscribers) {
        subscriber(event, tabOrId)
    }
}
chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
    if (!Tabs.isSelf(tab) && changeInfo.status == 'complete' || changeInfo.hasOwnProperty('title')) {
        emit('updated', tab)
    }
})
chrome.tabs.onRemoved.addListener(async (tabId, _) => {
    emit('closed', tabId)
})

export class Tabs {
    static subscribe(callback) {
        _subscribers.push(callback)
    }
    
    static async list() {
        const tabs = await chrome.tabs.query({})
        return tabs.filter(tab => !Tabs.isSelf(tab))
            .sort((a, b) => (a.windowId - b.windowId) || (a.index - b.index))
            .map(t => new Tab(t))
    }

    static async find(url) {
        try {
            url = new URL(url)
            const q = `*://${url.host}${url.pathname}${url.search}`
            const tabs = await chrome.tabs.query({ url: q })
            return tabs.length > 0 ? new Tab(tabs[0]) : null
        } catch {
            return null
        }
    }

    static isSelf(tab) {
        return tab.id == ownTab.id || tab.url == ownTab.url || tab.favIconUrl?.startsWith(document.location.origin)
    }
}

export class Tab {
    #tab
    get id() { return this.#tab.id }
    get title() { return this.#tab.title }
    get url() { return this.#tab.url }
    get icon() { return this.#tab.favIconUrl }

    constructor(tab) {
        this.#tab = tab
    }

    async focus() {
        await chrome.windows.update(this.#tab.windowId, { focused: true })
        await chrome.tabs.update(this.#tab.id, { active: true })
    }
}