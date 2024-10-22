class Tabs {
    static async list() {
        var self = await chrome.tabs.getCurrent()
        return (await chrome.tabs.query({})).filter(tab => tab.id !== self.id)
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
}

export default Tabs