import Tag from "./Tag.js"

export default class Options {
    #accentColour
    get accentColour() { return this.#accentColour }
    set accentColour(value) { this.#accentColour = value }
    #allowEdits
    get allowEdits() { return this.#allowEdits }
    set allowEdits(value) { this.#allowEdits = !!value }
    #backgroundImage
    get backgroundImage() { return this.#backgroundImage }
    set backgroundImage(value) { this.#backgroundImage = value }
    #columns
    get columns() { return this.#columns }
    set columns(value) { this.#columns = num(value, 500) }
    #openExistingTab
    get openExistingTab() { return this.#openExistingTab }
    set openExistingTab(value) { this.#openExistingTab = !!value }
    #openNewTab
    get openNewTab() { return this.#openNewTab }
    set openNewTab(value) { this.#openNewTab = !!value }
    #scale
    get scale() { return this.#scale }
    set scale(value) { this.#scale = num(value, 100) }
    #showFavicons
    get showFavicons() { return this.#showFavicons }
    set showFavicons(value) { this.#showFavicons = !!value }
    #showTabList
    get showTabList() { return this.#showTabList }
    set showTabList(value) { this.#showTabList = !!value }
    #showTopSites
    get showTopSites() { return this.#showTopSites }
    set showTopSites(value) { this.#showTopSites = !!value }
    #tags = []
    get tags() { return this.#tags }
    #wrapTitles
    get wrapTitles() { return this.#wrapTitles }
    set wrapTitles(value) { this.#wrapTitles = !!value }

    constructor(data) {
        this.import(data)
    }

    static #dailyBackgroundProviderUrl = 'https://corsproxy.io/?https://bing.gifposter.com';
    static #dailyBackgroundUrlRegex = /<meta.*?property="og:image".*?content="(.*?\.jpe?g)"\s*\/?>/
    async getDailyBackgroundUrl() {
        const cache = await chrome.storage.local.get('dailyBackgroundUrl')
        if (cache?.dailyBackgroundUrl?.date == new Date().toDateString()) {
            return cache.dailyBackgroundUrl.url
        }

        const response = await fetch(Options.#dailyBackgroundProviderUrl)
        const body = await response.text()
        const match = body?.match(Options.#dailyBackgroundUrlRegex)
        if (match) {
            const url = match[1]
            await chrome.storage.local.set({ dailyBackgroundUrl: { date: new Date().toDateString(), url } })
            return url
        }
    }

    static #defaults = {
        accentColour: v => !v || v == '#4F4F78',
        allowEdits: true,
        backgroundImage: v => !v?.length,
        columns: 500,
        openExistingTab: true,
        openNewTab: false,
        scale: 100,
        showFavicons: true,
        showTabList: true,
        showTopSites: false,
        tags: [],
        wrapTitles: true
    }
    export() {
        return {
            accentColour: this.#accentColour,
            allowEdits: this.#allowEdits,
            backgroundImage: this.#backgroundImage,
            columns: this.#columns,
            openExistingTab: this.#openExistingTab,
            openNewTab: this.#openNewTab,
            scale: this.#scale,
            showFavicons: this.#showFavicons,
            showTabList: this.#showTabList,
            showTopSites: this.#showTopSites,
            tags: this.#tags.map(t => t.export()),
            wrapTitles: this.#wrapTitles
        }.pick(Options.#defaults)
    }

    import(data) {
        this.accentColour = data.accentColour || '#4F4F78'
        this.allowEdits = data.allowEdits !== false
        this.backgroundImage = data.backgroundImage
        this.columns = data.columns
        this.openExistingTab = data.openExistingTab !== false
        this.openNewTab = !!data.openNewTab
        this.scale = data.scale || 100
        this.showFavicons = data.showFavicons !== false
        this.showTabList = data.showTabList !== false
        this.showTopSites = !!data.showTopSites
        this.#tags = data.tags?.filter(t => t.id > 0).map(t => Tag.import(t)) || []
        this.wrapTitles = data.wrapTitles !== false

        const notag = data.tags?.find(t => t.id == 0)
        this.tags.push(Tag.import({ id: 0, name: '(Untagged)', colour: '#808080', visible: notag?.visible }))
    }
}