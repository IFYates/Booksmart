import State from "../../models/state.js";
import { BookmarkElement } from "./bookmark.js";

export class SiteElement extends BookmarkElement {
    get site() { return super.bookmark; }

    constructor(site) {
        if (!site) debugger;
        site ??= {};
        super({
            title: site.title,
            url: site.url,
            domain: isURL(site.url) ? new URL(site.url).origin : null,
            altIcon: 'far fa-file-code',
            icon: site.icon,
            readonly: true,
            immobile: true
        });
        this.removeAttribute('id');
    }

    async moveTo(folder, origin) {
        const data = await State.createBookmark(folder.folder, this.site.title, this.site.url, { icon: this.site.icon });
        const element = new BookmarkElement(data);
        this.parentNode.insertBefore(element, this);
        origin?.parentNode.insertBefore(this, origin);
        folder.reindexBookmarks();
    }

    async _ondisplay(root, host) {
        await super._ondisplay(root, host);
        root.querySelector('.actions').remove();
    }
}
customElements.define('bs-site', SiteElement)