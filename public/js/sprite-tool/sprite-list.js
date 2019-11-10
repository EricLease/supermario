import eControl from './e-control.js';
import Modal from './modal.js';
import { 
    buildStaticLists, 
    buildAnimationList, 
    buildEditPanel, 
    buildEditPanelListContainerClass, 
    buildEditPanelCollapseButtonContent } from './builders.js';
import { ItemType, getItemTypeName } from './item-type.js';
import { findParent, getDivWithClasses, getNodeIndex } from './dom-utilities.js';
import { guid } from './guid.js';
import { getDataTransferData } from './drag-and-drop-utilities.js';

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

    this.listeners.get('change').forEach(cb => {
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

async function itemClick(evt) {
    const li = findListItem(evt.target);
    const itemType = parseInt(li.dataset.itemType);
    const itemName = li.dataset.itemName;

    if (raiseClick.call(this, itemName, itemType)) return;

    const prev = this.container.querySelector('li.selected');
    
    if (prev !== li) {
        if (await raiseChange.call(this, itemName, itemType)) return;

        if (prev) prev.classList.remove('selected');

        li.classList.add('selected');
    }
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
    const confirmation = async () => {
        return new Promise(resolve => {
            const dismissCb = () => cb(true);
            const cb = (cancel = false) => {
                this.modal.dismiss();
                resolve(cancel);
            };

            this.modal.show({
                dismiss: dismissCb,
                header: { show: false },
                body: { content: 'Are you sure you want to delete this sprite?' },
                footer: {
                    btnOk: {  
                        cb: () => cb(),
                        text: 'Delete',
                        class: 'btn-outline-danger'
                    },
                    btnCancel: { show: true, cb: dismissCb } 
                }
            });
        });
    };
    const promises = [];
    let cancel = false;
    
    this.listeners.get('remove').forEach(cb => {
        promises.push((async () => {
            const evt = { 
                cancel: false,
                itemName: orig.dataset.itemName, 
                itemType: orig.dataset.itemType 
            }; 

            await cb(evt); 
            cancel = evt.cancel || cancel; 
        })());
    });

    await Promise.all(promises);

    if (cancel) return;

    const prev = this.container.querySelector('li.selected');

    if (await confirmation()) return;

    if (prev && parseInt(prev.dataset.itemType) === ItemType.Animation &&
        parseInt(orig.dataset.itemType) !== ItemType.Animation) {
        // Reset animation palette
        raiseChange.call(this, prev.dataset.itemName, parseInt(prev.dataset.itemType));
    }

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
    orig.remove();
    this.state.sheetDirty = true;
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
        let list;

        switch(evt.itemType) {
            case ItemType.Tile:
            case ItemType.Frame:
                const [tiles, frames] = buildStaticLists(this.sprites);

                list = evt.itemType === ItemType.Tile ? tiles : frames;
                break;
                
            case ItemType.Animation:
                this.animationList = list = buildAnimationList(this.sprites);
                break;

            default: 
                console.warn(`Invalid ItemType (${evt.itemType}) in update()`);
                return;
        }

        const type = getItemTypeName(evt.itemType);
        const ul = this.container.querySelector(
            `.${buildEditPanelListContainerClass(type)}-${this.containerClass} ul`);
        const lis = ul.querySelectorAll('li');

        lis.forEach(li => {
            this.ignoreEvent(li.dataset.listeningId);
            li.remove();
        });

        const prevLi = this.container.querySelector('li.selected');
        const prevPnl = this.container.querySelector('div.collapse.show');

        if (prevLi) prevLi.classList.remove('selected');
        if (prevPnl) prevPnl.classList.remove('show');

        findParent(ul, '.card').querySelector('h5 button')
            .innerHTML = buildEditPanelCollapseButtonContent(`${type}s`, list.length);
        findParent(ul, `.${buildEditPanelListContainerClass(type)}-${this.containerClass}`)
            .classList.add('show');

        list.forEach(li => {
            const el = li.li ? li.li : li;

            if (el.dataset.itemName === evt.itemName) {
                el.classList.add('selected');

                setTimeout(() => el.scrollIntoView());
            }

            el.dataset.listeningId = this.listenTo(
                el, 'click', (evt) => itemClick.call(this, evt));
            ul.appendChild(el);

            if (li.start) li.start();
        });
    }

    build() {
        const clickCb = (evt) => itemClick.call(this, evt);
        const addCb = (evt) => {
            let cancel = false;
    
            this.listeners.get('add').forEach(cb => { 
                let e = { 
                    cancel: false,
                    itemType: parseInt(evt.target.dataset.itemType)
                }; 
                cb(e); 
                cancel = e.cancel || cancel; 
            });
    
            if (cancel) return;
    
            const prev = this.container.querySelector('li.selected');
    
            if (!prev) return;
            
            prev.classList.remove('selected');
        }
        const [tiles, frames] = buildStaticLists(this.sprites);
        
        this.containerClass = `_${this.uniqueId}`;
        this.container = getDivWithClasses('accordion', this.containerClass);

        const staticOpts = { 
            containerClass: this.containerClass, 
            clickCb: clickCb,
            addCb: addCb, 
            expand: true, 
            setMaxHeight: false,
            enableDrag: true,
            contextId: this.uniqueId,
            enableDrop: true,                
            dropCb: async (evt) => await drop.call(this, evt)
        };

        if (this.sprites.width && this.sprites.height) {
            buildEditPanel(this, tiles, ItemType.Tile, staticOpts);
        } else {
            buildEditPanel(this, frames, ItemType.Frame, staticOpts);
        }
        
        this.animationList = buildAnimationList(this.sprites);
        buildEditPanel(this, this.animationList, ItemType.Animation, { 
            containerClass: this.containerClass, 
            clickCb: clickCb, 
            addCb: addCb,
            enableDrag: true,
            contextId: this.uniqueId,
            enableDrop: true,                
            dropCb: async (evt) => await drop.call(this, evt)
        });
        this.listenTo(window, 'drop', async (evt) => await drop.call(this, evt));
        this.animationList.forEach(a => a.start());
        this.modal = new Modal();
        this.built = true;
    }

    dispose() {
        if (this.animationList) {
            this.animationList.forEach(a => a.stop());
        }

        eControl.prototype.dispose.call(this);
    }
}