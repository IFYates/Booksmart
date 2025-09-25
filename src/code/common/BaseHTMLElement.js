import { StyleManager } from "./StyleManager.js";

export class BaseHTMLElement extends HTMLElement {
    #template;
    #styles;
    get host() { return this.#template ? this.shadowRoot.host : this; }

    static TemplateRE = /(?:&lt;|<)!--\$\s*([\w\.]+)\s*\$--(?:&gt;|>)/;
    static replaceTemplates(input, object) {
        input = String(input);
        var m, result = '';
        while (m = BaseHTMLElement.TemplateRE.exec(input)) {
            result += input.substring(0, m.index) + (object[m[1]] || '');
            input = input.substring(m.index + m[0].length);
        }
        return result + input;
    }

    constructor(template, styles) {
        super();

        if (template) {
            this.attachShadow({ mode: 'open' });
            this.#template = template;
            this.#styles = styles || [];
        }
    }

    refresh() {
        this._reset();
        this._ondisplay(this.shadowRoot, this.host);
    }

    _reset() {
        if (!this.#template) {
            this.innerHTML = '';
            return;
        }

        this.shadowRoot.innerHTML = '';
        const template = this._prepareTemplate(this.#template.innerHTML);
        this.shadowRoot.innerHTML = template;

        if (!this.#styles) {
            // Apply main CSS to shadow
            this.shadowRoot.adoptedStyleSheets.push(StyleManager.root());
        } else {
            for (const style of this.#styles) {
                this.shadowRoot.adoptedStyleSheets.push(StyleManager.get(style));
            }
        }
    }

    _prepareTemplate(template) { return template; }

    attachInternals() {
        super.attachInternals();
        console.warn('attached', this);
    }

    #displayed = false;
    async connectedCallback() {
        if (this.#displayed) return;
        this.#displayed = true;
        const self = this;

        if (this.#template) {
            this.host.style.display = 'none !important';
            requestAnimationFrame(async () => {
                this._reset();
                await StyleManager.wait();
                await this._ondisplay(this.shadowRoot, this.host);
                if (this.host.style.display == 'none !important') {
                    this.host.style.display = null;
                }
            });
        }

        if (typeof this.onclick == 'function') {
            this.host.addEventListener('click', (ev) => this.onclick.call(self, ev));
        }
        if (typeof this.onmouseenter == 'function') {
            this.host.addEventListener('mouseenter', (ev) => this.onmouseenter.call(self, ev));
        }
    }

    // Called whenever element customisation should occur
    async _ondisplay(root, host) { }

    //onclick(ev) // optional
    //onmouseenter(ev) // optional
    /** Apply changes to matching elements */
    _apply(selector, logic) {
        for (const el of this.shadowRoot.querySelectorAll(selector)) {
            logic.call(el, el);
        }
    }
}
