const Events = ['loaded', 'bound']

export default class mControl {
    constructor(ctlName, container, ...events) {
        this.ctlName = ctlName;
        this.container = container instanceof Element
            ? container : document.querySelector(container);
        this.state = {
            loaded: false,
            bound: false
        };
        
        this.listeners = new Map();
        Events.concat((events || []).flat()).forEach(
            e => this.listeners.set(e, []));
    }

    bind() {
        console.warn('Classes extending mControl should implement `bind()`, raising `bound` when complete');
        this.listeners.get('bound').forEach(cb => cb());
    }
}

mControl.prototype.load = 
async function load() { 
    const resp = await fetch(`/js/map-editor/${this.ctlName}/${this.ctlName}.html`);
    const raw = await resp.text();
    const parser = new DOMParser();
    const html = parser.parseFromString(raw, 'text/html');

    while (html.body.childNodes.length) 
        this.container.appendChild(html.body.firstChild);

    this.listeners.get('loaded').forEach(cb => cb());
    this.bind();
};

 mControl.prototype.addEventListener = 
 function addEventListener(evt, cb) {
    if (!this.listeners.has(evt)) return;

    this.listeners.get(evt).push(cb);
};

mControl.prototype.removeEventListener = 
function removeEventListener(evt, cb) {
    if (!this.listeners.has(evt)) return;

    const cbs = this.listeners.get(evt);
    const idx = cb ? cbs.lastIndexOf(cb) : cbs.length - 1;

    if (idx > -1) cbs.splice(idx, 1);
};