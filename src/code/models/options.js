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

    static #dailyBackground
    static #dailyBackgroundProviderUrl = 'https://corsproxy.io/?https://bing.gifposter.com';
    static #dailyBackgroundUrlRegex = /<a.+?href="(?<link>[^"]+)"[^>]+>\s+?<img.+?class="fl".*?src="(?<img>[^"]+)"/s
    static #dailyBackgroundColorRegex = /href="\/colors\.html\?color=(?<r>\d+),(?<g>\d+),(?<b>\d+)"/s
    getDailyBackground() {
        return Options.#dailyBackground
    }
    async resolveDailyBackground(force = false) {
        if (!force && Options.#dailyBackground?.date != new Date().toDateString()) {
            Options.#dailyBackground = (await chrome.storage.local.get('dailyBackgroundUrl'))?.dailyBackgroundUrl
        }
        if (!force && Options.#dailyBackground?.date == new Date().toDateString()) {
            return Options.#dailyBackground
        }

        // Find today's image
        const response = await fetch(Options.#dailyBackgroundProviderUrl)
        const body = await response?.text()
        const match = body?.match(Options.#dailyBackgroundUrlRegex)
        if (match) {
            if (match.groups.img.endsWith('_mb')) {
                match.groups.img = match.groups.img.slice(0, -3)
            }
            if (match.groups.link.endsWith('.html')) {
                match.groups.link = match.groups.link.slice(0, -5)
            }

            Options.#dailyBackground = { date: new Date().toDateString(), url: match.groups.img }
            chrome.storage.local.set({ dailyBackgroundUrl: Options.#dailyBackground })

            // Continue to find accent
            fetch(Options.#dailyBackgroundProviderUrl + match.groups.link)
                .then(response => response.text())
                .then(body => {
                    const rgb = body?.match(Options.#dailyBackgroundColorRegex)?.groups
                    if (rgb) {
                        rgb.r = (rgb.r | 0).toString(16).padStart(2, '0')
                        rgb.g = (rgb.g | 0).toString(16).padStart(2, '0')
                        rgb.b = (rgb.b | 0).toString(16).padStart(2, '0')
                        Options.#dailyBackground.accentColour = `#${rgb.r}${rgb.g}${rgb.b}`
                        chrome.storage.local.set({ dailyBackgroundUrl: Options.#dailyBackground })
                        MainView.setTheme(Options.#dailyBackground.accentColour)
                    }
                })

            return Options.#dailyBackground
        }
    }

    #ensureTags() {
        const notag = this.tags?.find(t => t.id == 0)
        if (notag) {
            if (this.tags.length == 1) {
                this.tags.splice(0, 1)
            } else {
                notag.name = '(Untagged)'
                notag.colour = '#808080'
            }
        }
        else if (this.tags.length) {
            this.tags.push(Tag.import({ id: 0, name: '(Untagged)', colour: '#808080' }))
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
        this.#ensureTags()
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
            tags: this.#tags.reduce((o, t) => { o[t.id] = t.export(); return o }, {}),
            wrapTitles: this.#wrapTitles
        }.pick(Options.#defaults)
    }

    import(data) {
        if (!Array.isArray(data.tags)) {
            data.tags = Object.values(data.tags)
        }
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
        this.#tags = data.tags?.map(t => Tag.import(t)) || []
        this.wrapTitles = data.wrapTitles !== false
        this.#ensureTags()
    }
}