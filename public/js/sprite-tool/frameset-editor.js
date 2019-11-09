import eControl from './e-control.js';
import { getDivWithClasses, removeChildren } from './dom-utilities.js';
import { buildEditPanel, buildStaticLists, buildStaticListItem } from './builders.js';
import { ItemType } from './item-type.js';
import { guid } from './guid.js';
import { getAnimationMetaOrDefault } from './sprite-utilities.js';

const FramesetEditorEvents = ['change'];

function getNodeIndex(el) { 
    const children = el.parentNode.children;
     
    for (let idx = 0; idx < children.length; idx++) {
        if (children[idx] === el)  return idx;
    }
}

function move(orig, tgt) {
    const origIdx = getNodeIndex(orig);
    const targetIdx = getNodeIndex(tgt);

    if (targetIdx > origIdx) {        
        tgt.parentNode.insertBefore(orig, tgt.nextSibling);
    } else {
        orig.parentNode.insertBefore(orig, tgt);
    }

    this.frames.splice(
        targetIdx, 0, ...this.frames.splice(origIdx, 1));
}

function remove(orig) {
    this.ignoreEvent(orig.dataset.dragId);
    this.ignoreEvent(orig.dataset.dropId);
    this.ignoreEvent(orig.dataset.dragOverId);
    this.frames.splice(getNodeIndex(orig), 1);
    orig.remove();
}

function add(orig, tgt) {
    const li = orig.cloneNode(true);    
    const frameName = li.dataset.itemName;
    
    this.sprites.draw(
        frameName, 
        li.querySelector('canvas').getContext('2d'), 
        0, 0);
    li.dataset.included = this.uniqueId;    
    li.dataset.dragId = this.listenTo(
        li, 'dragstart', 
        (evt) => {
            evt.dataTransfer.clearData();
            evt.dataTransfer.setData('text', li.dataset.dragId);
        });
    li.dataset.dropId = this.listenTo(li, 'drop', (evt) => drop.call(this, evt));
    li.dataset.dragOverId = this.listenTo(li, 'dragover', (evt) => evt.preventDefault());

    if (!tgt.matches('li')) {
        this.frames.push(frameName);
        this.included.querySelector('ul').appendChild(li);
        
        return;
    }
    
    this.frames.splice(getNodeIndex(tgt), 0, frameName);
    tgt.parentNode.insertBefore(li, tgt);
}

function drop(evt) {
    const orig = document.querySelector(
        `[data-drag-id="${evt.dataTransfer.getData('text')}"]`);
    const tgt = evt.currentTarget;
    const included = orig.dataset.included === this.uniqueId;
    
    if (included) {
        if (tgt.matches && tgt.matches('li')) {
            move.call(this, orig, tgt);
        } else remove.call(this, orig);
    } else if (tgt === window) return;
    else add.call(this, orig, tgt);

    this.listeners.get('change').forEach(cb => cb({ frames: this.frames }));
    this.state.spriteDirty = true;

    evt.preventDefault();    
    evt.stopPropagation();

    return false;
}

export default class FramesetEditor extends eControl {
    constructor(state, sprites) {
        super(FramesetEditorEvents);

        this.state = state;
        this.uniqueId = guid();
        this.sprites = sprites;
        this.itemType = this.sprites.width && this.sprites.height 
            ? ItemType.Tile : ItemType.Frame;
        this.ignore.push('uniqueId', 'sprites', 'itemType');
    }

    reset(itemName) {
        const resetIncluded = () => {
            this.frames = Array.from(getAnimationMetaOrDefault(this.sprites, itemName).frames);
            
            const frameSet = this.frames
                .map(f => buildStaticListItem(this.sprites.tileMetas.get(f), this.sprites))
                .map(li => { li.dataset.included = this.uniqueId; return li; });
            const opts = { 
                container: this.included, 
                containerClass: this.includedContainerClass, 
                expand: true, 
                collapsible: false,
                enableAdd: false, 
                enableClick: false, 
                enableDrag: true,
                enableDrop: true,                
                dropCb: (evt) => drop.call(this, evt),
                label: 'Playlist'
            };

            removeChildren(this.included);
            buildEditPanel(this, frameSet, this.itemType, opts);
            this.included.querySelector('.card').classList.add('single');
        };
        const resetPalette = () => {
            const [tiles, frames] = buildStaticLists(this.sprites);
            const opts = { 
                container: this.palette, 
                containerClass: this.paletteContainerClass, 
                expand: true, 
                collapsible: false,
                enableAdd: false, 
                enableClick: false, 
                enableDrag: true,
                label: 'Palette'
            };

            removeChildren(this.palette);
            buildEditPanel(this, this.itemType == ItemType.Tile ? tiles : frames, this.itemType, opts);
            this.palette.querySelector('.card').classList.add('single');
        };
                
        resetPalette();
        resetIncluded();
    }

    build() {
        const initList = (type) => {
            const col = getDivWithClasses('col-6');
            const classProp = `${type}Class`;
            
            this[classProp] = `_${this.uniqueId}_${type}`;
            this[type] = getDivWithClasses('accordion', this[classProp]);            
            col.appendChild(this[type]);
            this.container.appendChild(col);
        };
        // const initIncluded = () => {
        //     const col = getDivWithClasses(...colClasses);
            
        //     this.includedContainerClass = `_${this.uniqueId}_Included`;
        //     this.included = getDivWithClasses('accordion', this.includedContainerClass);            
        //     col.appendChild(this.included);
        //     this.container.appendChild(col);
        // };
        // const initPalette = () => {
        //     const col = getDivWithClasses(...colClasses);
            
        //     this.paletteContainerClass = `_${this.uniqueId}_Palette`;
        //     this.palette = getDivWithClasses('accordion', this.paletteContainerClass);            
        //     col.appendChild(this.palette);
        //     this.container.appendChild(col);
        // };
        //const colClasses = ['col-6'];
        
        this.container = getDivWithClasses('row', 'mb-0', 'p-0');
        ['included', 'palette'].forEach(initList);
        this.listenTo(window, 'dragover', (evt) => evt.preventDefault());
        this.listenTo(window, 'drop', (evt) => drop.call(this, evt));
        this.built = true;
    }
}