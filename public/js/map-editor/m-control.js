import $$ from '../common/symbol-store.js';
import { guid } from '../common/guid.js';

// TODO: move to string utilities
const replaceSection = (search, replace, start, end) => 
    `${search.substring(0, start)}${replace}${search.substring(end)}`;
const removeSection = (search, start, end) => 
    replaceSection(search, '', start, end);
   
//#region Interpolation

//#region RegExp utilities

const TagBeginRegexPattern = tag => `<\\s*${tag}`;
const TagEndRegexPattern = tag => `<\\/\\s*${tag}\\s*>`;

//#endregion RegExp utilities

//#region Configuration

// TODO: Load config from json

const InterpolationElements = new RegExp(/{{([^}]*)}}/g);
const FindTagBeginRegex = new RegExp(/<\s*(\w*)\s*/);
const RawMatchIndex = 0;
const ContentMatchIndex = 1;
const CommandPartDelimeter = ':';
const IdPartIndex = 0;
const CommandPartIndex = 1;
// Command specific part indexes
const RepeatCountPartIndex = 2;

//#endregion Configuration

//#region Matches utilities

// TODO: Refactor this into a class/service/set of functions

const cloneMatch = (origMatch, newId, matches) => {
    const m = _.clone(origMatch);

    m.raw = makeStandalone(newId);
    m.parts = [newId];
    matches.push(m);

    return m;
};

const getMatchPart = (match, idx) => 
    idx >= 0 && match && match.parts && match.parts.length > idx
        ? match.parts[idx] : null;
const getIdFromMatch = match => getMatchPart(match, IdPartIndex);
const getCommandFromMatch = match => getMatchPart(match, CommandPartIndex);

const firstDuplicateID = matches => {
    const set = new Set();

    for (let i = 0; i < matches.length; i++) {
        const id = getIdFromMatch(matches[i]);

        if (set.has(id)) return id;

        set.add(id);
    }

    return null;
};

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
                    a.push(str.substring(s, m.index + m[0].length));
                    if (!g) return a;
                }
            }
        }
    } while (t && (x.lastIndex = s));

    return a;
};

const findDomEl = (search, matchIndex) => {
    const start = search.substr(0, matchIndex).lastIndexOf('<');
    const partial = search.substr(start);
    const tag = partial.match(FindTagBeginRegex)[ContentMatchIndex];
    const match = matchRecursive(partial, tag);
    const len = match[RawMatchIndex].length;
    
    return [search.substr(start, len), start, start + len];
};

const extractMatches = search => {
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

    // NOTE: reversing the order of match set
    // Process template from bottom to top -> easy string replaces
    return matches.reverse();
};

const extractChildMatches = search =>
    extractMatches(search.substr(search.indexOf('>')));

const extractFromMatches =
    (matches, reducer, initial = [], clone = false) => {
        const result = matches.reduce(reducer, initial);

        return clone
            ? result.map(i => _.clone(matches[i]))
            : result.reverse().flatMap(i => matches.splice(i, 1)).reverse();
    };

const takeFromMatches =
    (matches, takeFn, initial = [], clone = false) =>
        extractFromMatches(
            matches,
            (take, m, i) => { if (takeFn(m)) take.push(i); return take; },
            initial,
            clone);

const extractListFromMatches =
    (sourceMatches, removeMatches, initial = [], clone = false) =>
        takeFromMatches(
            sourceMatches,
            s => removeMatches.find(r => r.raw === s.raw),
            initial,
            clone);            

const extractCommandType =
    (sourceMatches, type = null, initial = [], clone = false) =>
        takeFromMatches(
            sourceMatches,
            s => (!type && s.parts.length > CommandPartIndex)
                || (type && getCommandFromMatch(s) === type),
            initial,
            clone);

const extractCommands = (matches, initial = [], clone = false) =>
    extractCommandType(matches, null, initial, clone);
const getCommands = (matches, initial = []) =>
    extractCommands(matches, initial, clone);

//#region Command specific

const extractPlaceholders = (matches, initial = [], clone = false) =>
    extractCommandType(matches, 'placeholder', initial, clone);
const getPlaceholders = (matches, initial = []) =>
    extractPlaceholders(matches, initial, true);

const extractRepeats = (matches, initial = [], clone = false) =>
    extractCommandType(matches, 'repeat', initial, clone);
const getRepeats = (matches, initial = []) =>
    extractRepeats(matches, initial, true);  

const getRepeatCount = (m, mCtl) => {
    let cnt, part;

    cnt = m.parts.length < RepeatCountPartIndex
        ? 'none specified'
        : !isNaN(cnt =
            parseInt(part =
                m.parts[RepeatCountPartIndex]))
            ? cnt
            : !isNaN(cnt = parseInt(mCtl[part]))
                ? cnt
                : `unrecognized variable [${part}]`;
    
    if (isNaN(cnt) || cnt < 0) {
        throw new Error(`Invalid repeat count (${cnt}) @ ${m.index}`);
    }

    return cnt;
};

//#endregion Command specific

//#endregion Matches utilities

// TODO: Refactor this into a class (Interpolator)

const makeStandalone = name => `{{${name}}}`;

async function interpolate(mCtl, raw) {
    const processCommands = async () => {
        const process = async (c) => {
            //#region Commands

            const repeat = () => {
                const repeatCnt = getRepeatCount(c, mCtl);
                const [domEl, start, end] = findDomEl(raw, c.index);
                
                if (!repeatCnt) return removeSection(raw, start, end);
                
                const instances = [];
                const id = getIdFromMatch(c);
                const hasId = id.length;
                const childMatches = extractListFromMatches(
                    matches,
                    extractChildMatches(domEl));
                
                for (let i = 0; i < repeatCnt; i++) {
                    const adjustChild = (cm) => {
                        const newId = `${instanceId}_${getIdFromMatch(cm)}`;
                        const newChild = cloneMatch(cm, newId, matches);
    
                        instance = instance.replace(cm.raw, newChild.raw);
                    };
                    const instanceId = `${id}_${i}`;
                    let instance = domEl;
                    let replace = hasId ? cloneMatch(c, instanceId, matches).raw : '';

                    childMatches.forEach(cm => adjustChild(cm, instance, instanceId));
                    instances.push(instance.replace(c.raw, replace));
                }

                return replaceSection(raw, instances.join(''), start, end);
            };

            const placeholder = async () =>
                replaceSection(
                    raw,
                    await mCtl.placeholder(getIdFromMatch(c)),
                    c.index - 1,
                    c.index + c.raw.length);
            
            //#endregion Commands

            const command = getCommandFromMatch(c);

            switch (command) {
                case 'repeat': raw = repeat(); break;
                case 'placeholder': raw = await placeholder(); break;
                
                default:
                    console.error('State before interpolation error:', raw);
                    throw new Error(`Unhandled interpolation command (${command})`);
            }
        };

        const commands = extractCommands(matches);
        const placeholders = extractPlaceholders(commands);

        if (placeholders.length) {
            await Promise.all(
                placeholders.map(
                    (p, i) => (async () => await process(p, i))()));

            return false;
        }
        
        commands.forEach(process);

        return true;
    };
    const setChild = m => {
        const setChildId = (container, idx) => {
            const id = `${fullId}_${mCtl.guid}`;

            container[idx] = { [$$.DOMElementId]: id };
            raw = raw.replace(m.raw, `id="${id}"`);
        }
        const initAndUpdateContext = key => {
            parent = ctx;            
            parent[key] = parent[key] || {};
            ctx = parent[key];

            if (typeof ctx === 'string' && ctx) {
                ctx = { [$$.DOMElementId]: ctx };
                parent[key] = ctx;
            }
        };
        const unrollDimensions = () => {
            while (dimensions.length) {
                initAndUpdateContext(dimensions.shift());
            }
        };
        const fullId = getIdFromMatch(m);
        const parts = fullId.split('_');
        let name = '', dimensions = [], parent = mCtl, ctx = parent.children;

        //#region Walk parts array        
        while (parts.length) {            
            const part = parts.shift();
            
            //#region Numeric part
            if (!isNaN(part) && part !== '') {
                const idx = parseInt(part);
            
                dimensions.push(idx);
                    
                if (!name) continue;
                
                unrollDimensions();
                    
                if (parts.length) name = '';
                else setChildId(parent, idx);
                continue;
            }
            //#endregion Numeric part
            
            //#region String part            
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
            //#endregion String part
        }
        //#endregion Walk parts array
    };
    let matches = extractMatches(raw);

    if (!matches.length) return raw;
    if (!await processCommands()) return await interpolate(mCtl, raw);
    if (!matches.length) return raw;

    const offender = firstDuplicateID(matches);

    if (offender) {
        console.error(matches);
        throw new Error(`Duplicate element ID (${offender}) used for interpolation`);
    }

    mCtl.children = {};
    // sort to ensure containers are set before their children
    matches.sort((a, b) => (a.raw < b.raw ? 1 : -1))
        .forEach(setChild);

    return raw;
}

//#endregion Interpolation

const Events = ['loaded', 'bound', 'unloaded'];

export default class mControl {
    constructor(ctlPathName, state, container, placeholders, ...events) {
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
        this.placeholders = new Map();
        placeholders.forEach(p => this.placeholders.set(p, null));
        this.listeners = new Map();
        Events.concat((events || []).flat()).forEach(
            e => this.listeners.set(e, []));
    }

    bind() { }

    async placeholder(id) {
        // All interpolation elements that have IDs and are children of `repeat` 
        // interpolation commands that have IDs will be removed them from the set
        // of matches that will have the prefix prepended. This should prevent the 
        // prefix from being repeated throughout the nested interpolation elements' ids.
        const getRepeatChildren = () => [...new Set(
            getRepeats(matches)
                .filter(r => getIdFromMatch(r))
                .map(r => findDomEl(raw, r.index)[0])
                .flatMap(e => extractChildMatches(e))
        )];

        if (!this.placeholders.has(id)) return '';
        
        const ph = this.placeholders.get(id);

        if (!ph) return '';
        if (ph.raw) return ph.raw;
        
        const resp = await fetch(`/js/map-editor/${ph.path}/${ph.name}.html`);
        const raw = await resp.text();
        const matches = extractMatches(raw);
        
        // TODO: Determine how to handle nested placeholders:
        //extractPlaceholders(matches); // discard?
        
        // extract and discard certain repeat children
        extractListFromMatches(matches, getRepeatChildren());

        ph.raw = matches.reduce((raw, m) =>
            !m.parts[0].length
                ? raw
                : raw.substr(0, m.index) 
                + `{{${id}_${m.parts.join(':')}}}`
                + raw.substr(m.index + m.raw.length),
            raw);

        return ph.raw;
    }

    async load() { 
        const setChildren = (ctx = this.children) => {
            for (const child in ctx) {
                const c = ctx[child];

                if (typeof c === 'string') { 
                    ctx[child] = this.container.querySelector(`#${c}`);
                    continue;
                }
                
                setChildren(c);

                if (c instanceof Object) {
                    ctx[child] = _.merge(
                        this.container.querySelector(`#${c[$$.DOMElementId]}`),
                        ctx[child]);
                }
            }
        };
        const resp = await fetch(`/js/map-editor/${this.ctlPath}/${this.ctlName}.html`);
        const raw = await interpolate(this, await resp.text());
        const parser = new DOMParser();
        const html = parser.parseFromString(raw, 'text/html');
        let el = html.body.firstElementChild;

        while (el) {
            this.container.appendChild(el);
            el.classList.add(`_${this.guid}`);
            el = html.body.firstElementChild;
        }

        this.children = this.children || {};
        setChildren();            
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