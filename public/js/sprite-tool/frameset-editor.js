import eControl from '../common/e-control.js';
import { guid } from '../common/guid.js';
import { ItemType } from '../common/item-type.js';
import { getNodeIndex, getDivWithClasses, removeChildren } from '../common/dom-utilities.js';
import { setDataTransferData, getDataTransferData } from '../common/drag-and-drop-utilities.js';
import { getAnimationMetaOrDefault } from './sprite-utilities.js';
import { buildEditPanel, buildStaticLists, buildStaticListItem } from './builders.js';

const FramesetEditorEvents = ['change'];

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

function updateCount() {
    const span = this.playlist.querySelector('h5 span');

    span.innerText = `${span.innerText.split('(')[0]}(${this.frames.length})`;
}

function remove(orig) {
    this.ignoreEvent(orig.dataset.dragId);
    this.ignoreEvent(orig.dataset.dropId);
    this.ignoreEvent(orig.dataset.dragOverId);
    this.frames.splice(getNodeIndex(orig), 1);
    updateCount.call(this);
    orig.remove();
}

function add(orig, tgt) {
    const li = orig.cloneNode(true);    
    const frameName = li.dataset.itemName;
    
    this.sprites.draw(
        frameName, 
        li.querySelector('canvas').getContext('2d'), 
        0, 0);
    li.dataset.playlist = this.uniqueId;    
    li.dataset.dragId = this.listenTo(
        li, 'dragstart', 
        (evt) => {
            evt.dataTransfer.clearData();
            setDataTransferData(evt, li.dataset.dragId, this.uniqueId);
        });
    li.dataset.dropId = this.listenTo(li, 'drop', (evt) => drop.call(this, evt));
    li.dataset.dragOverId = this.listenTo(li, 'dragover', (evt) => evt.preventDefault());

    if (!tgt.matches('li')) {
        this.frames.push(frameName);
        this.playlist.querySelector('ul').appendChild(li);
    } else {
        this.frames.splice(getNodeIndex(tgt), 0, frameName);
        tgt.parentNode.insertBefore(li, tgt);
    }

    updateCount.call(this);
}

function drop(evt) {
    const data = getDataTransferData(evt);

    if (data.contextId !== this.uniqueId) return false;

    const orig = document.querySelector(`[data-drag-id="${data.dragId}"]`);
    const tgt = evt.currentTarget;
    const playlist = orig.dataset.playlist === this.uniqueId;
    
    if (playlist) {
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
        const resetPlaylist = () => {
            this.frames = Array.from(getAnimationMetaOrDefault(this.sprites, itemName).frames);
            
            const frameSet = this.frames
                .map(f => buildStaticListItem(this.sprites.tileMetas.get(f), this.sprites))
                .map(li => { li.dataset.playlist = this.uniqueId; return li; });
            const opts = { 
                container: this.playlist, 
                containerClass: this.playlistClass, 
                expand: true, 
                collapsible: false,
                enableAdd: false, 
                enableClick: false, 
                enableDrag: true,
                contextId: this.uniqueId,
                enableDrop: true,                
                dropCb: (evt) => drop.call(this, evt),
                label: 'Playlist'
            };

            removeChildren(this.playlist);
            buildEditPanel(this, frameSet, this.itemType, opts);
            this.playlist.querySelector('.card').classList.add('single');
        };
        const resetPalette = () => {
            const [tiles, frames] = buildStaticLists(this.sprites);
            const opts = { 
                container: this.palette, 
                containerClass: this.paletteClass, 
                expand: true, 
                collapsible: false,
                enableAdd: false, 
                enableClick: false, 
                enableDrag: true,
                contextId: this.uniqueId,
                label: 'Palette'
            };

            removeChildren(this.palette);
            buildEditPanel(this, this.itemType == ItemType.Tile ? tiles : frames, this.itemType, opts);
            this.palette.querySelector('.card').classList.add('single');
        };
                
        resetPalette();
        resetPlaylist();
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
        
        this.container = getDivWithClasses('row', 'mb-0', 'p-0');
        ['playlist', 'palette'].forEach(initList);
        this.listenTo(window, 'dragover', (evt) => evt.preventDefault());
        this.listenTo(window, 'drop', (evt) => drop.call(this, evt));
        this.built = true;
    }
}