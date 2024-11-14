export default class DragDropHandler {
    #element;
    get element() { return this.#element; }

    constructor(element) {
        const self = this;
        self.#element = element;
        element.draggable = true;

        const subscribedElements = [];
        function fireEvent(fn, ev, el) {
            fn = fn['on' + ev.type];
            if (fn) {
                const clone = DragEvent.prototype.allKeys().reduce((o, k) => { o[k] = ev[k]; return o; }, {});
                clone.stopPropagation = ev.stopPropagation.bind(ev);
                clone.target = el;
                clone.preventDefault = ev.preventDefault.bind(ev);
                fn.call(element, clone);
            }
        }
        function filteredEvent(ev) {
            if (ev.target.shadowRoot && !subscribedElements.includes(ev.target.shadowRoot)) {
                subscribeEvents(ev.target.shadowRoot);
            }
            for (const sub of self.#subscribers) {
                const el = ev.composedPath().find(sub.filter);
                if (el) {
                    fireEvent(sub.handler, ev, el);
                }
            }
        }
        function subscribeEvents(element) {
            subscribedElements.push(element);
            element.addEventListener('dragenter', filteredEvent);
            element.addEventListener('dragleave', filteredEvent);
            element.addEventListener('dragover', filteredEvent);
            element.addEventListener('drop', filteredEvent);
        }
        function unsubscribeEvents() {
            const copy = [...subscribedElements];
            subscribedElements.splice(0, subscribedElements.length);
            for (const element of copy) {
                element.removeEventListener('dragenter', filteredEvent);
                element.removeEventListener('dragleave', filteredEvent);
                element.removeEventListener('dragover', filteredEvent);
                element.removeEventListener('drop', filteredEvent);
            }
        }

        element.addEventListener('dragstart', (ev) => {
            // console.log('ondragstart', element, ev)
            subscribeEvents(document);
            self.ondragstart.call(element, ev);
        });
        element.addEventListener('dragend', (ev) => {
            // console.log('ondragend', element, ev)
            unsubscribeEvents();
            self.ondragend.call(element, ev);
        });
    }

    // filter: bool (el) { ... }
    // handler: { ondragenter(ev), ondragleave(ev), ondragover(ev), ondrop(ev) }
    subscribeDrop(filter, handler) {
        this.#subscribers.push({ filter, handler });
    }
    #subscribers = [];

    ondragstart(ev) { }
    ondragend(ev) { }
}
