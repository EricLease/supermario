import eControl from '../common/e-control.js';
import Modal from '../common/modal.js';
import { guid } from '../common/guid.js';
import { ItemType } from '../common/item-type.js';
import { 
    getDivWithClasses, 
    getNodeIndex, 
    removeChildren, 
    findParent } from '../common/dom-utilities.js';
import { getDataTransferData } from '../common/drag-and-drop-utilities.js';
import { 
    buildStaticLists, 
    buildAnimationList, 
    buildEditPanel } from './builders.js';

const SpriteListEvents = ['add', 'remove', 'click', 'change'];

function findListItem(elem) {
    for (; elem && elem !== document; elem = elem.parentNode ) {
        if (elem.matches('li') && 
            elem.dataset && 
            elem.dataset.itemType) return elem;
        //if (elem.matches('li[data-item-type]')) return elem;
    }

    return null;
}

async function clickCb(evt){
    const li = findListItem(evt.target);
    const itemType = parseInt(li.dataset.itemType);
    const itemName = li.dataset.itemName;

    if (raiseClick.call(this, itemName, itemType)) return;

    const prev = this.container.querySelector('li.selected');
    
    if (prev !== li) {
        if (await raiseChange.call(this, itemName, itemType)) return;

        if (prev) {
            prev.classList.remove('selected');
            this.previous.push(prev);
        }

        li.classList.add('selected');
    }
}

async function addCb(evt) {
    let cancel = false;

    this.listeners.get('add').forEach(async cb => { 
        let e = { 
            cancel: false,
            itemType: parseInt(evt.target.dataset.itemType)
        }; 
        await cb(e); 
        cancel = e.cancel || cancel; 
    });

    if (cancel) return;

    const prev = this.container.querySelector('li.selected');

    if (!prev) return;
    
    prev.classList.remove('selected');
    this.previous.push(prev);
}

function buildStaticEditPanel(setMaxHeight = false) {
    const staticOpts = { 
        containerClass: this.containerClass, 
        clickCb: async (evt) => await clickCb.call(this, evt),
        addCb: async (evt) => await addCb.call(this, evt), 
        expand: true, 
        setMaxHeight: setMaxHeight,
        enableDrag: true,
        contextId: this.uniqueId,
        enableDrop: true,                
        dropCb: async (evt) => await drop.call(this, evt)
    };
    const [tiles, frames] = buildStaticLists(this.sprites);        
        
    if (this.sprites.width && this.sprites.height) {
        buildEditPanel(this, tiles, ItemType.Tile, staticOpts);
    } else {
        buildEditPanel(this, frames, ItemType.Frame, staticOpts);
    }
}

function buildAnimationEditPanel() {
    this.animationList = buildAnimationList(this.sprites);
    buildEditPanel(this, this.animationList, ItemType.Animation, { 
        containerClass: this.containerClass, 
        clickCb: async (evt) => await clickCb.call(this, evt),
        addCb: async (evt) => await addCb.call(this, evt), 
        enableDrag: true,
        contextId: this.uniqueId,
        enableDrop: true,                
        dropCb: async (evt) => await drop.call(this, evt)
    });
    this.animationList.forEach(a => a.start());
}

function destroyEditPanel(panel) {
    panel.querySelectorAll('li').forEach(li => {
        this.ignoreEvent(li.dataset.dragId);
        this.ignoreEvent(li.dataset.dragOverId);
        this.ignoreEvent(li.dataset.dropId);
        this.ignoreEvent(li.dataset.listeningId);
    });

    removeChildren(panel);
    panel.remove();
}

function swapEditPanels(container) {
    container.appendChild(container.firstChild);
}

function raiseClick(itemName, itemType) {
    let cancel = false;
    
    this.listeners.get('click').forEach(cb => { 
        let evt = { 
            cancel: false,
            itemName: itemName,
            itemType: itemType
        }; 
        cb(evt); 
        cancel = evt.cancel || cancel; 
    });

    return cancel;
}

async function raiseChange(itemName, itemType) {
    let cancel = false;

    const promises = [];

    this.listeners.get('change').forEach(async cb => {
        promises.push((async () => {
            const evt = { 
                cancel: false,
                itemName: itemName, 
                itemType: itemType 
            }; 

            await cb(evt); 
            cancel = evt.cancel || cancel; 
        })());
    });

    await Promise.all(promises);

    return cancel;
}

function move(orig, tgt) {
    const origIdx = getNodeIndex(orig);
    const targetIdx = getNodeIndex(tgt);

    if (origIdx === targetIdx) return;

    if (targetIdx > origIdx) {        
        tgt.parentNode.insertBefore(orig, tgt.nextSibling);
    } else {
        orig.parentNode.insertBefore(orig, tgt);
    }

    const set = parseInt(orig.dataset.itemType) === ItemType.Animation
        ? 'animations' : 'tiles';
    const metaSet = `${set.substr(0, set.length - 1)}Metas`;
    const entries = [...this.sprites[set].entries()];
    const metaEntries = [...this.sprites[metaSet].entries()];
    
    entries.splice(targetIdx, 0, ...entries.splice(origIdx, 1));
    metaEntries.splice(targetIdx, 0, ...metaEntries.splice(origIdx, 1));
    this.sprites[set] = new Map(entries);
    this.sprites[metaSet] = new Map(metaEntries);    
    this.state.sheetDirty = true;
}

async function remove(orig) {
    if (!await this.modal.confirm(
        'Are you sure you want to delete this sprite?', 
        null, {
            footer: {
                btnOk: {  
                    text: 'Delete',
                    class: 'btn-outline-danger'
                }
            }
        })) return;

    const promises = [];
    let back = false;
    let cancel = false;
    
    this.listeners.get('remove').forEach(cb => {
        promises.push((async () => {
            const evt = { 
                cancel: false,
                itemName: orig.dataset.itemName, 
                itemType: orig.dataset.itemType 
            }; 

            await cb(evt); 
            back = evt.back || back;
            cancel = evt.cancel || cancel; 
        })());
    });

    await Promise.all(promises);

    if (cancel) return;

    const set = parseInt(orig.dataset.itemType) === ItemType.Animation
        ? 'animations' : 'tiles';
    const metaSet = `${set.substr(0, set.length - 1)}Metas`;
    const entries = [...this.sprites[set].entries()];
    const metaEntries = [...this.sprites[metaSet].entries()];
    const origIdx = getNodeIndex(orig); 

    entries.splice(origIdx, 1);
    metaEntries.splice(origIdx, 1);
    this.sprites[set] = new Map(entries);
    this.sprites[metaSet] = new Map(metaEntries);
    this.ignoreEvent(orig.dataset.dragId);
    this.ignoreEvent(orig.dataset.dropId);
    this.ignoreEvent(orig.dataset.dragOverId);
    this.previous = this.previous.filter(p => p !== orig);
    
    const btn = findParent(orig, 'div.card').querySelector('h5 button');
    
    btn.innerText = `${btn.innerText.split('(')[0]}(${this.sprites[set].size})`;
    orig.remove();
    
    this.state.sheetDirty = true;

    if (back) { await this.back(); return; }

    const prev = this.container.querySelector('li.selected');
    
    if (prev && 
        parseInt(prev.dataset.itemType) === ItemType.Animation &&
        parseInt(orig.dataset.itemType) !== ItemType.Animation) {
        // Reset animation palette
        await raiseChange.call(this, prev.dataset.itemName, parseInt(prev.dataset.itemType));
    }
}

async function drop(evt) {
    const data = getDataTransferData(evt);

    if (data.contextId !== this.uniqueId) return false;

    const orig = document.querySelector(`[data-drag-id="${data.dragId}"]`);
    const tgt = evt.currentTarget;

    if (tgt.matches && tgt.matches('li')) move.call(this, orig, tgt);
    else await remove.call(this, orig);

    evt.preventDefault();    
    evt.stopPropagation();

    return false;
}

export default class SpriteList extends eControl {
    constructor(state, sprites) {
        super(SpriteListEvents);

        this.uniqueId = guid();
        this.state = state;
        this.sprites = sprites;
        this.ignore.push('uniqueId', 'sprites');
    }

    update(evt) {
        const prevLi = this.container.querySelector('li.selected');
        const prevPnl = this.container.querySelector('div.collapse.show');

        if (prevLi) prevLi.classList.remove('selected');
        if (prevPnl) prevPnl.classList.remove('show');

        let panel;

        switch(evt.itemType) {
            case ItemType.Tile:
            case ItemType.Frame:
                destroyEditPanel.call(this, this.container.firstChild);
                buildStaticEditPanel.call(this, true);
                swapEditPanels(this.container);
                panel = this.container.firstChild;
                break;
                
            case ItemType.Animation:
                destroyEditPanel.call(this, this.container.lastChild);
                buildAnimationEditPanel.call(this);
                panel = this.container.lastChild;
                break;

            default: 
                console.warn(`Invalid ItemType (${evt.itemType}) in update()`);
                return;
        }

        panel.querySelector('div.collapse').classList.add('show');
        panel.querySelectorAll('li').forEach(li => {
            if (li.dataset.itemName === evt.itemName) {
                if (prevLi !== li) this.previous.push(prevLi);
                li.classList.add('selected');
                setTimeout(() => li.scrollIntoView());
            }
        });     
    }

    build() {
        this.containerClass = `_${this.uniqueId}`;
        this.container = getDivWithClasses('accordion', this.containerClass);
        buildStaticEditPanel.call(this);
        buildAnimationEditPanel.call(this);
        this.listenTo(window, 'drop', async (evt) => await drop.call(this, evt));
        this.previous = [];
        this.modal = new Modal();
        this.built = true;
    }

    async back() {
        let li;

        while (this.previous.length && !li) {
            li = this.previous.pop();
        }

        if (!li) {
            await raiseChange.call(this);
            return;
        }

        const itemType = li.dataset.itemType;
        const itemName = li.dataset.itemName;
        
        await this.container
            .querySelector(`li[data-item-type="${itemType}"][data-item-name="${itemName}"]`)
            .click();
    }

    dispose() {
        if (this.animationList) {
            this.animationList.forEach(a => a.stop());
        }

        eControl.prototype.dispose.call(this);
    }
}