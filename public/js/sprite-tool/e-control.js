import { guid } from './guid.js';
import { removeChildren } from './dom-utilities.js';
import { distinctConcat } from './array-utilities.js';

export default class eControl {
  constructor(...events) {
        this.listeners = new Map();
        this.listening = new Map();

        distinctConcat(events || [])
            .forEach(e => this.listeners.set(e, []));
        
        this.children = [];
        this.built = false;
        this.ignore = [];
    }

    build() {
        console.warn('Override build() in class that inherits ePage, set `this.built = true;`');
    }

    dispose() {
        if (this.disposed) return;

        this.children.forEach(c => c.dispose());
        
        if (this.detach) this.detach();
        else eControl.prototype.detach.call(this);
        
        if (this.container) {
            removeChildren(this.container);
            this.container.remove();
        }

        for (const to of this.listening.values()) {
            to.ctl.removeEventListener(to.evt, to.cb);
        }

        const ignore = 
            ['ignore', 'disposed', 'listeners', 'listening']
            .concat(this.ignore);

        for (var prop in this) {
            if (ignore.indexOf(prop) === -1) {
                this[prop] = undefined;
            }
        }

        this.children = [];
        this.disposed = true;
        this.built = false;
    }

    listenTo(ctl, evt, cb) {
        if (!ctl || !ctl.addEventListener) {
            console.warn(`Attempted to listen to invalid event source`);
            
            return;
        }
       
        const id = guid();

        this.listening.set(id, { ctl: ctl, evt: evt, cb: cb });
        ctl.addEventListener(evt, cb);

        return id;
    }

    ignoreEvent(id) {
        if (!this.listening.has(id)) {
            console.warn(`Attempted to ignore to invalid event source`);
            
            return;
        }

        const to = this.listening.get(id);
        
        to.ctl.removeEventListener(to.evt, to.cb);
        this.listening.delete(id);
    }

    addEventListener(evt, cb) {
        if (!this.listeners.has(evt)) return;

        this.listeners.get(evt).push(cb);
    }

    removeEventListener(evt, cb) {
        if (!this.listeners.has(evt)) return;

        const cbs = this.listeners.get(evt);
        const idx = cbs.lastIndexOf(cb);

        if (idx > -1) cbs.splice(idx, 1);
    }
}

eControl.prototype.attach = function attach(parentSelector) {
    if (this.disposed || !this.built) this.build();

    this.disposed = false;

    if (this.container) {
        this.parent = parentSelector instanceof Element
            ? parentSelector
            : parentSelector
                ? document.querySelector(parentSelector)
                : document.body;
        this.parent.appendChild(this.container);
        this.children.forEach(c => c.attach(c.parent || this.container));
    }
};

eControl.prototype.detach = function detach(options) {
    options = options || {};

    if (this.container && this.parent) {
        const parent = options.retainParent ? this.parent : null;
        
        this.parent.removeChild(this.container);
        this.parent = parent; 
    }
};