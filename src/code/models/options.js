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
    static #dailyBackgroundProviderUrl = 'https://bing.biturl.top/?mkt=en-GB&resolution=UHD'
    getDailyBackground() {
        return Options.#dailyBackground
    }
    async resolveDailyBackground(force = false, applyValue = null) {
        if (typeof force == 'function') {
            [applyValue, force] = [force, false]
        }

        // Use cached, if not expired
        const today = new Date().toDateString()
        if (!force && Options.#dailyBackground?.date != today) {
            Options.#dailyBackground = (await chrome.storage.local.get('dailyBackgroundUrl'))?.dailyBackgroundUrl
        }
        if (Options.#dailyBackground && applyValue) {
            // Apply current background before deciding if refreshing
            applyValue(Options.#dailyBackground)
        }
        if (!force && Options.#dailyBackground?.date == today) {
            return Options.#dailyBackground
        }


        // Find today's image
        const response = await fetch(Options.#dailyBackgroundProviderUrl)
        const body = await response?.json()
        if (body?.url && body?.url != Options.#dailyBackground?.url) {
            Options.#dailyBackground = { date: today, url: body.url, info: body.copyright }
            
            // Resolve accent colour
            const img = document.createElement('img')
            await img.showImageAsDataUrl(body.url)
            Options.#dailyBackground.accentColour = img.getAverageColour()
            chrome.storage.local.set({ dailyBackgroundUrl: Options.#dailyBackground })

            applyValue?.(Options.#dailyBackground)
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
        if (data.tags && !Array.isArray(data.tags)) {
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