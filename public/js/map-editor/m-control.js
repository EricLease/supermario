import { guid } from '../common/guid.js';

const Events = ['loaded', 'bound', 'unloaded']
const InterpolationElements = new RegExp(/{{([:\w]*)}}/g);
const FindTagBeginRegex = new RegExp(/<\s*(\w*)\s*/);
const TagBeginRegexPattern = (tag) => `<\\s*${tag}`;
const TagEndRegexPattern = (tag) => `<\\/\\s*${tag}\\s*>`;
const RawMatchIndex = 0;
const ContentMatchIndex = 1;
const CommandPartDelimeter = ':';
const IdPartIndex = 0;
const CommandPartIndex = 1;
// Command specific part indexes
const RepeatCountPartIndex = 2;
/**
 * Courtesy of https://stackoverflow.com/a/31989913/4342563. Slightly modified.
 * 
 * Find the first occurrence of html element of type `tag` in the html text string `search`.
 * Returns the outer HTML of that element.  Accounts for nested elements with same tag name.
 * 
 * @param {string} str The search string
 * @param {string} tag The tag to isolate
 * @param {string} flags Optional flags (g -> RegEx global)
 * @returns {Array[string]} Array of matches
 */
const matchRecursive = (str, tag, flags) => {    
    const f = flags || "";
    const g = f.indexOf("g") > -1;
    const left = TagBeginRegexPattern(tag);
    const right = TagEndRegexPattern(tag);
    const x = new RegExp(left + "|" + right, "g" + f);
    const l = new RegExp(left, f.replace(/g/g, ""));
    const a = [];
    let t, s, m;

    do {
        t = 0;
        while (m = x.exec(str)) {
            if (l.test(m[0])) {
                if (!t++) s = x.lastIndex - m[0].length;
            } else if (t) {
                if (!--t) {
                    a.push(str.slice(s, m.index + m[0].length));
                    if (!g) return a;
                }
            }
        }
    } while (t && (x.lastIndex = s));

    return a;
};
    
function interpolate(mCtl, raw) {
    const makeStandalone = name => `{{${name}}}`;
    const extractMatches = (search) => {
        const processMatch = m => {
            return {
                raw: m[RawMatchIndex],
                parts: m[ContentMatchIndex].split(CommandPartDelimeter),
                index: m.index
            };
        };
        const iterator = search.matchAll(InterpolationElements);
        const matches = [];
        let curr;

        while (!(curr = iterator.next()).done) {
            matches.push(processMatch(curr.value));
        }

        return matches;
    };
    const idsUnique = () => matches.reduce((p, c, i) => {
        const oldP = p;
        const id = getId(c);

        p = p === false || p.indexOf(id) > -1
            ? false : p + id, '';            
        
        if (oldP && !p) offender = id;

        return p;
    }, '');
    const getId = m => m.parts[IdPartIndex];
    const getCommand = m => m.parts[CommandPartIndex];
    const processCommands = () => {
        // NOTE: reversing the order of command processing
        // - maintains integrity of raw html between commands
        // - supports cascading commands (e.g. `repeat`)
        // - perform reverse before splice to maintain `matches` integrity
        const extractCommands = () => matches
            .reduce((cmds, m, i) => {
                if (m.parts.length > 1) cmds.push(i);
                return cmds;
            }, [])
            .reverse()
            .flatMap(i => matches.splice(i, 1));
        const process = (c, i) => {
            //#region Commands
            const repeat = () => {
                const extractDomEl = () => {
                    const beginIdx = raw.substr(0, c.index).lastIndexOf('<');
                    let partial = raw.substr(beginIdx);
                    const tag = partial.match(FindTagBeginRegex)[ContentMatchIndex];
                    const match = matchRecursive(partial, tag);
                    const endIdx = beginIdx + match[RawMatchIndex].length;

                    return [beginIdx, endIdx, raw.slice(beginIdx, endIdx)];
                };
                const dupe = (orig, newId) => {
                    const m = _.clone(orig);

                    m.raw = makeStandalone(newId);
                    m.parts = [newId];
                    matches.push(m);

                    return m;
                };
                const hasId = id.length;
                const cnt = c.parts[RepeatCountPartIndex];
                const [beginIdx, endIdx, domEl] = extractDomEl();
                const instances = [];
                const childInterps = extractMatches(domEl.substr(domEl.indexOf('>')));
                const childMatches = childInterps.reduce((ms, c) => {
                    const mIdx = matches.findIndex(m => m.raw === c.raw);                        
                    if (mIdx > -1) ms.push(matches.splice(mIdx, 1));
                    return ms;
                }, []).flat();
                    
                for (let i = 0; i < cnt; i++) {                    
                    const adjustChild = (cm) => {
                        const newId = `${instanceId}_${getId(cm)}`;
                        const newChild = dupe(cm, newId);
    
                        instance = instance.replace(cm.raw, newChild.raw);
                    };
                    const instanceId = `${id}_${i}`;
                    let instance = domEl;
                    let replace = hasId ? dupe(c, instanceId).raw : '';

                    childMatches.forEach(cm => adjustChild(cm, instance, instanceId));
                    instances.push(instance.replace(c.raw, replace));
                }

                raw = `${
                    raw.slice(0, beginIdx - 1)}${
                    instances.join('')}${
                    raw.slice(endIdx + 1)}`;
            }
            //#endregion Commands
            const id = getId(c);

            switch (getCommand(c)) {
                case 'repeat': repeat(); break;
                
                default:
                    throw new Error(`Unhandled interpolation command (${parts[0]})`);
            }
        };

        extractCommands().forEach(process);
    };
    const setChild = m => {
        const setChildId = (container, idx) => {
            const id = `${fullId}_${mCtl.guid}`;            

            container[idx] = id;
            raw = raw.replace(m.raw, `id="${id}"`);
        }
        const initAndUpdateContext = (key) => {
            ctx[key] = ctx[key] || [];
            parent = ctx;
            ctx = ctx[key];

            if (typeof ctx === 'string' && ctx) {
                parent[key] = { [Symbol.for('id')]: ctx };
                ctx = parent[key];
            }
        };
        const unrollDimensions = () => {
            while (dimensions.length) {
                if (!(ctx instanceof Array) &&
                    !(ctx instanceof Object)) {
                    parent[name] = [];
                    ctx = parent[name];
                }
            
                initAndUpdateContext(dimensions.shift());
            }
        };
        const fullId = getId(m);
        const parts = fullId.split('_');//.filter(Boolean);
        let name = '', dimensions = [], parent = mCtl, ctx = parent.children;

        while (parts.length) {
            const part = parts.shift();
            
            if (!isNaN(part) && part !== '') {
                const idx = parseInt(part);
            
                if (!name) {
                    dimensions.push(idx);
                    continue;
                }
                
                unrollDimensions();
                initAndUpdateContext(idx);
                    
                if (parts.length) name = '';
                else setChildId(parent, idx);
                continue;
            } 
            
            name = part;

            if (!name) continue;

            if (parts.length) {
                initAndUpdateContext(part);
                continue;
            }

            if (!dimensions.length) {
                setChildId(ctx, part);
                continue;
            }

            const lastIdx = dimensions[dimensions.length - 1];

            initAndUpdateContext(part);
            unrollDimensions();
            setChildId(parent, lastIdx);
        }
    };
    let matches = extractMatches(raw);
    let offender;

    if (!matches.length) return raw;

    processCommands();

    if (!matches.length) return raw;

    if (!idsUnique()) {
        console.error(matches);
        throw new Error(`Duplicate element ID (${offender}) used for interpolation`);
    }

    mCtl.children = {};
    matches.forEach(setChild);

    return raw;
}

export default class mControl {
    constructor(ctlPathName, state, container, ...events) {
        const parts = ctlPathName.split('/');

        this.ctlName = parts[parts.length - 1];        
        this.ctlPath = ctlPathName;
        this.guid = guid();
        this.state = _.merge(state, {
            loaded: false,
            bound: false
        });
        this.container = container instanceof Element
            ? container : document.querySelector(container);
        this.listeners = new Map();
        Events.concat((events || []).flat()).forEach(
            e => this.listeners.set(e, []));
    }

    bind() {}

    async load() { 
        const setChildren = (ctx) => {
            for (const child in ctx) {
                const c = ctx[child];

                if (typeof c === 'string') { 
                    ctx[child] = this.container.querySelector(`#${c}`);
                    continue;
                }
                
                setChildren(c);

                if (c instanceof Object) {
                    ctx[child] = _.merge(
                        this.container.querySelector(`#${c[Symbol.for('id')]}`),
                        ctx[child]);
                }
            }
        };
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
        setChildren(this.children);            
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