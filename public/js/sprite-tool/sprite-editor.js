import eControl from '../common/e-control.js';
import Modal from '../common/modal.js';
import SpriteList from './sprite-list.js';
import SpriteWorkbench from './sprite-workbench.js';
import StaticWorkbench from './static-workbench.js';
import AnimationWorkbench from './animation-workbench.js';
import { ItemType } from '../common/item-type.js';
import { getDivWithClasses } from '../common/dom-utilities.js';
import { dirtyCheck } from '../common/modal-utilities.js';

const SpriteEditorEvents = [];
const SpriteEditorWorkbenches = [StaticWorkbench, AnimationWorkbench];
const swapWorkbenches = (off, on) => {
    if (off && off.close) off.close();
    if (on && on.open) on.open();
};

export default class SpriteEditor extends eControl {
    constructor(state, sprites) { 
        super(SpriteEditorEvents);

        this.activeWorkbench = -1;
        this.state = state;
        this.sprites = sprites;
        this.ignore.push('sprites', 'modal');
    }

    cleanup() { 
        const idx = parseInt(this.animationWorkbenchIndex);

        if (this.workbenches && !isNaN(idx) && 
            idx > -1 && idx < this.workbenches.length) 
            this.workbenches[idx].cleanup();

            
        if (this.dirtyIndicator) {
            clearInterval(this.dirtyIndicator);
            this.dirtyIndicator = null;
        }
    }

    build() {
        const buildCol = (...addlClasses) => {
            return getDivWithClasses(
                'col-12', 'col-xs-12', 'col-sm-12', 'col-md-6', 
                ...addlClasses);
        };
        const initList = () => {            
            const edit = async (evt) => {
                if (!await dirtyCheck(this.modal, evt, this.state.spriteDirty)) return;

                let tgtWkb;

                switch (evt.itemType) {
                    case ItemType.Tile:
                    case ItemType.Frame: tgtWkb = this.staticWorkbenchIndex; break;                    
                    case ItemType.Animation: tgtWkb = this.animationWorkbenchIndex; break;                    
                    default:
                        this.workbenches.forEach(wb => wb.close());
                        this.activeWorkbench = -1;
                        this.currentSprite = null;
                        workbenchCol.classList.remove('workbench-col');
                        return;
                }

                workbenchCol.classList.add('workbench-col');

                if (tgtWkb != this.activeWorkbench) {
                    swapWorkbenches(
                        this.workbenches[this.activeWorkbench], 
                        this.workbenches[tgtWkb]);
                    this.activeWorkbench = tgtWkb;
                }

                this.currentSprite = { 
                    itemName: evt.itemName, 
                    itemType: evt.itemType 
                };                
                this.workbenches[this.activeWorkbench].reset(evt);
            };
            const add = async (evt) => {
                let msg;

                if (evt.itemType === ItemType.Tile &&
                    (!this.sprites.width || !this.sprites.height)) {
                    msg = 'Sprite sheet height and width must be set before tiles can be created.';                    
                } else if (evt.itemType === ItemType.Animation && !this.sprites.tiles.size) {
                    msg = 'Tiles or frames must be defined before animations can be created.';
                }

                if (msg) {
                    await this.modal.reject(msg, evt);
                    return;
                }

                await edit(evt);
                
                if (!evt.cancel) this.state.spriteDirty = true;
            };
            const remove = async (evt) => {
                if (evt.itemType !== ItemType.Animation) {
                    const contains = [...this.sprites.animationMetas.entries()]
                        .filter(([_, meta]) => meta.frames.indexOf(evt.itemName) > -1)
                        .reduce((prev, curr) => {
                                const li = document.createElement('li');

                                li.innerText = curr[0];
                                prev.appendChild(li);
                                
                                return prev;
                            }, document.createElement('ul'));

                    if (contains.firstChild) {
                        const content = document.createElement('div');
                        const msg = document.createElement('span');

                        msg.innerText = 'Cannot delete the sprite. It is used by the following animations:';
                        content.appendChild(msg);
                        content.appendChild(contains);

                        await this.modal.reject(content, evt);                        
                        return;
                    }
                } 
                
                if (this.currentSprite && 
                    this.currentSprite.itemType === ItemType.Animation &&
                    this.state.spriteDirty) {
                    await this.modal.reject(
                        'Cannot delete the sprite while an animation is being edited', evt);
                    return;
                }

                if (this.currentSprite &&
                    this.currentSprite.itemType === parseInt(evt.itemType) &&
                    this.currentSprite.itemName === evt.itemName) {
                    evt.back = true;
                    return;
                }
            };
            
            this.list = new SpriteList(this.state, this.sprites);
            this.list.addEventListener('add', async (evt) => await add(evt));
            this.list.addEventListener('remove', async (evt) => await remove(evt));
            this.list.addEventListener('change', async (evt) => await edit(evt));
            this.list.parent = buildCol('col-lg-5', 'col-xl-4');
            this.container.appendChild(this.list.parent);
            this.children.push(this.list);
        };
        const initWorkbenches = () => {
            const initWorkbench = (ctor) => {
                const spritesUpdated = (evt) => {
                    this.currentSprite = {
                        itemName: evt.itemName,
                        itemType: evt.itemType,
                    };
                    this.list.update(evt);
                };
                const wb = new ctor(this.state, this.sprites);
    
                if (!wb instanceof SpriteWorkbench) {
                    throw new Error('SpriteEditor only accepts workbenches of type SpriteWorkbench')
                }
    
                wb.addEventListener('spritesupdated', (evt) => spritesUpdated(evt));
                wb.addEventListener('canceladd', () => this.list.back());
                wb.parent = workbenchCol;
                this.children.push(wb);
    
                return this.workbenches.push(wb) - 1;
            };

            this.workbenches = [];
            [this.staticWorkbenchIndex, this.animationWorkbenchIndex]
                = SpriteEditorWorkbenches.map(wb => initWorkbench(wb));
            this.container.appendChild(workbenchCol);
        };
        const initDirtyIndicators = () => {
            this.dirtyIndicator = setInterval(() => {
                workbenchCol.style.backgroundColor =
                    this.state.spriteDirty ? 'lightyellow' : null;
            }, 300);
        };
        const workbenchCol = buildCol('col-lg-7', 'col-xl-8');
                
        this.container = getDivWithClasses('row');
        initList();
        initWorkbenches();
        initDirtyIndicators();        
        this.modal = new Modal();
        this.built = true;
    }
}