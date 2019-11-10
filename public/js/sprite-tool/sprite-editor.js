import eControl from './e-control.js';
import Modal from './modal.js';
import SpriteList from './sprite-list.js';
import SpriteWorkbench from './sprite-workbench.js';
import StaticWorkbench from './static-workbench.js';
import AnimationWorkbench from './animation-workbench.js';
import { ItemType } from './item-type.js';
import { getDivWithClasses } from './dom-utilities.js';

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
            const dirtyCheck = async (evt) => {
                return new Promise(resolve => {
                    const dismissCb = () => cb(true);
                    const cb = (cancel = false) => {
                        this.modal.dismiss();
                        resolve(evt.cancel = cancel);
                    };

                    evt.cancel = this.state.spriteDirty;

                    if (!evt.cancel) {
                        resolve(false);

                        return;
                    }

                    this.modal.show({
                        dismiss: dismissCb,
                        header: { show: false },
                        body: { content: 'There are unsaved changes.  Discard?' },
                        footer: {
                            btnOk: {  cb: () => cb() },
                            btnCancel: { show: true, cb: dismissCb } 
                        }
                    });
                });
            };
            const edit = async (evt) => {
                if (await dirtyCheck(evt)) return;

                let tgtWkb;

                switch (evt.itemType) {
                    case ItemType.Tile:
                    case ItemType.Frame: tgtWkb = this.staticWorkbenchIndex; break;
                    case ItemType.Animation: tgtWkb = this.animationWorkbenchIndex; break;
                    default:                        
                        throw new Error(`Invalid ItemType (${evt.itemType}) on list event`);
                }

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
                if (evt.itemType === ItemType.Tile &&
                    (!this.sprites.width || !this.sprites.height)) {
                    alert('Sprite sheet height and width must be set before tiles can be created.');
                    evt.cancel = true;
                    return;
                } else if (evt.itemType === ItemType.Animation && !this.sprites.tiles.size) {
                    alert('Tiles or frames must be defined before animations can be created.');
                    evt.cancel = true;                    
                    return;
                }

                await edit(evt);
                
                if (!evt.cancel) this.state.spriteDirty = true;
            };
            const remove = async (evt) => {
                const reject = async (content) => {
                    return new Promise(resolve => {
                        const cb = () => {
                            this.modal.dismiss();
                            resolve(evt.cancel = true);
                        };
    
                        this.modal.show({
                            dismiss: () => cb(),
                            header: { show: false },
                            body: { content: content },
                            footer: {
                                btnOk: {  
                                    cb: () => cb(),
                                    class: 'btn-outline-primary'
                                }
                            }
                        });
                    });
                };

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

                        await reject(content)
                        return;
                    }
                } 
                
                if (this.currentSprite && 
                    this.currentSprite.itemType === ItemType.Animation &&
                    this.state.spriteDirty) {
                    await reject('Cannot delete the sprite while an animation is being edited');
                    return;
                }
                
                // if (this.currentSprite.itemName === evt.itemName &&
                //     this.currentSprite.itemType === evt.itemType &&
                //     this.state.spriteDirty) {
                //     await reject('Cannot delete the sprite while it is being edited');
                // }
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
                const wb = new ctor(this.state, this.sprites);
    
                if (!wb instanceof SpriteWorkbench) {
                    throw new Error('SpriteEditor only accepts workbenches of type SpriteWorkbench')
                }
    
                wb.addEventListener('spritesupdated', (evt) => this.list.update(evt));
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
                this.list.parent.style.backgroundColor =
                    this.state.sheetDirty ? 'lightyellow' : null;
                workbenchCol.style.backgroundColor =
                    this.state.spriteDirty ? 'lightyellow' : null;
            }, 1000);
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