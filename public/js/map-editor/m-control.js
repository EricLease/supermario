import { guid } from '../common/guid.js';

const Events = ['loaded', 'bound', 'unloaded']
const Interpolation_ElementIDs = new RegExp(/{{\w*}}/g);
    
function interpolate(mCtl, raw) {
    const matches = raw.match(Interpolation_ElementIDs);

    if (!matches || !matches.length) return raw;

    if (matches.length != new Set(matches).size) {
        console.error(matches);
        throw new Error('Duplicate element ID used for interpolation');
    }

    mCtl.children = {};
    matches.forEach(m => {
        const name = m.substr(2, m.length - 4);
        mCtl.children[name] = `${name}_${mCtl.guid}`;
    });

    return matches.reduce((prev, m, i) => {
        const name = m.substr(2, m.length - 4);
        return prev.replace(m, `id="${mCtl.children[name]}"`);
    }, raw);
}

export default class mControl {
    constructor(ctlPathName, state, container, ...events) {
        const parts = ctlPathName.split('/');

        this.ctlName = parts[parts.length - 1];        
        this.ctlPath = ctlPathName;
        this.state = _.merge(state, {
            loaded: false,
            bound: false
        });
        this.container = container instanceof Element
            ? container : document.querySelector(container);
        this.listeners = new Map();
        Events.concat((events || []).flat()).forEach(
            e => this.listeners.set(e, []));
        this.guid = guid();
    }

    bind() {}

    async load() { 
        const resp = await fetch(`/js/map-editor/${this.ctlPath}/${this.ctlName}.html`);
        const raw = interpolate(this, await resp.text());
        const parser = new DOMParser();
        const html = parser.parseFromString(raw, 'text/html');
        let el = html.body.firstElementChild;

        while (el) {
            this.container.appendChild(el);
            el.classList.add(`_${this.guid}`);
            el = html.body.firstElementChild;
        }

        this.children = this.children || {};
        
        for (const child in this.children) {
            const id = this.children[child];
            this.children[child] = this.container.querySelector(`#${id}`);
        }
            
        this.state.loaded = true;
        this.listeners.get('loaded').forEach(cb => cb());
        this.bind();
        this.state.bound = true;
        this.listeners.get('bound').forEach(cb => cb());
    }

    unload() {
        this.container
            .querySelectorAll(`._${this.guid}`)
            .forEach(el => el.remove());
        this.listeners.get('unloaded').forEach(cb => cb());
    }

    addEventListener(evt, cb) {
        if (!this.listeners.has(evt)) return;
    
        this.listeners.get(evt).push(cb);
    }

    removeEventListener(evt, cb) {
        if (!this.listeners.has(evt)) return;
    
        const cbs = this.listeners.get(evt);
        const idx = cb ? cbs.lastIndexOf(cb) : cbs.length - 1;
    
        if (idx > -1) cbs.splice(idx, 1);
    }

    async raiseAsync(evtName, evtData) {
        let cancel = false;
    
        const promises = [];
    
        this.listeners.get(evtName).forEach(cb => {
            promises.push((async () => {
                if (cancel) return;
    
                const evt = evtData ? evtData() : {};
                evt.cancel = false;
    
                await cb(evt);
                cancel = evt.cancel || cancel;
            })());
        });
    
        await Promise.all(promises);
    
        return !cancel;
    }
}