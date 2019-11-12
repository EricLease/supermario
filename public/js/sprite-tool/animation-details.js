import eControl from './e-control.js';
import Timer from '../engine/timer.js';
import Modal from './modal.js';
import { 
    getDivWithClasses, 
    getButtonWithClasses, 
    getNumberInput, 
    bsHide,
    bsShow,
    getInputWithClasses} from './dom-utilities.js';
import { getAnimationMetaOrDefault } from './sprite-utilities.js';
import { createAnimation } from '../engine/animation.js';
import { ItemType } from './item-type.js';
import { capitalize } from './string-utilities.js';

const AnimationDetailsEvents = ['save', 'cancel', 'canceladd'];
const EditItemScale = 2;

function updatePreview() {
    this.timer.pause();
    
    if (this.frameLen.value && this.frames.length) {
        const update = (deltaTime) => {
            const tileName = this.animation(lifetime += deltaTime);            
            
            if (tileName !== prev) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                this.sprites.draw(tileName, ctx, 0, 0);
                prev = tileName;
            }
        };
        const metas = this.frames.map(f => this.sprites.tileMetas.get(f));
        let prev = null;
        let lifetime = 0;

        this.animation = createAnimation(this.frames, parseFloat(this.frameLen.value));
        this.preview.height = metas.reduce((m, t) => t.height > m ? t.height : m, 0);
        this.preview.width = metas.reduce((m, t) => t.width > m ? t.width : m, 0);

        const scaledH = EditItemScale * this.preview.height;

        this.preview.style.width = `${this.preview.width * EditItemScale}px`;
        this.preview.style.height = `${scaledH}px`;

        const ctx = this.preview.getContext('2d');

        setTimeout(() =>
            this.preview.style.marginTop = 
                `calc(${Math.floor((this.preview.parentElement.clientHeight - scaledH) / 2) + 2}px)`);
        
        this.timer.update = update;
        this.timer.resume();
        bsShow(this.preview);
    } else {
        bsHide(this.preview);
    }
}

export default class AnimationDetails extends eControl {
    constructor(state, sprites) { 
        super(AnimationDetailsEvents); 

        this.state = state;
        this.sprites = sprites;
        this.ignore.push('sprites');
    }

    reset(itemName) {
        const meta = getAnimationMetaOrDefault(this.sprites, itemName);

        this.origName = meta.name;
        this.name.value = meta.name;
        this.frameLen.value = meta.frameLen;
        this.frames = meta.frames;
        this.btnSave.removeAttribute('disabled');
        this.btnCancel.removeAttribute('disabled');
        this.name.removeAttribute('disabled');
        this.frameLen.removeAttribute('disabled');
        this.state.spriteDirty = !this.sprites.animations.has(this.origName);
        updatePreview.call(this);
    }

    updateFrames(frames) {
        this.frames = frames;
        updatePreview.call(this);
    }

    cleanup() { if (this.timer) this.timer.pause(); }

    build() {
        const buildSaveCancel = () => {
            const save = async (evt) => {
                const valid = async () => {
                    if (!this.state.spriteDirty) return;
    
                    const ctlNames = ['name', 'frameLen']
                        .filter(c => !this[c].value)
                        .map(capitalize);
    
                    if (!this.frames.length) ctlNames.push('Frameset');
    
                    if (!ctlNames.length) return true;

                    let msg = `${ctlNames.splice(-1, 1)} cannot be blank`;

                    if (ctlNames.length) {
                        msg = `${ctlNames.join(', ')}, and ${msg}`;
                    }

                    return await this.modal.reject(msg, evt);
                };
                
                if (!await valid()) return;

                if (this.name.value !== this.origName) {
                    if (this.sprites.animations.has(this.name.value) &&
                        !await this.modal.confirm(
                            `Animation with the name "${this.name.value}" already exists.  Overwrite?`,
                            evt, {
                                footer: {
                                    btnOk: {
                                        text: 'Overwrite',
                                        class: 'btn-outline-warning'
                                    }
                                }
                            })) return;
                }

                this.sprites.defineAnimation(
                    this.name.value, 
                    this.animation, 
                    this.frames, 
                    parseFloat(this.frameLen.value)); 
                this.origName = this.name.value;
                this.state.spriteDirty = false;
                this.state.sheetDirty = true;                        
                this.listeners.get('save').forEach(cb => 
                    cb({ 
                        itemType: ItemType.Animation, 
                        itemName: this.name.value 
                    }));
            };
            const cancel = () => {
                if (!this.state.spriteDirty) return;

                if (this.sprites.animations.has(this.origName)) {
                    this.reset(this.origName);
                    this.listeners.get('cancel').forEach(cb => cb());
                    return;
                }
                
                this.state.spriteDirty = false;
                this.listeners.get('canceladd').forEach(cb => cb());
            };           
            const col = getDivWithClasses(...colBaseClasses, 'save-cancel');
            const saveRow = getDivWithClasses('row');
            const saveCol = getDivWithClasses('col');            
            const cancelRow = getDivWithClasses('row');
            const cancelCol = getDivWithClasses('col');
            
            this.btnSave = getButtonWithClasses('Save', 'btn', 'btn-outline-success');
            this.btnSave.setAttribute('disabled', true);
            this.btnSave.dataset.ignoreId = 
                this.listenTo(this.btnSave, 'click', async (evt) => await save(evt));
            saveCol.appendChild(this.btnSave);
            saveRow.appendChild(saveCol);
            col.appendChild(saveRow);
            
            this.btnCancel = getButtonWithClasses('Cancel', 'btn', 'btn-outline-warning');
            this.btnCancel.setAttribute('disabled', true);
            this.btnCancel.dataset.ignoreId = 
                this.listenTo(this.btnCancel, 'click', () => cancel());
            cancelCol.appendChild(this.btnCancel);
            cancelRow.appendChild(cancelCol);
            col.appendChild(cancelRow);                        

            return col;
        };
        const buildPreview = () => {
            const col = getDivWithClasses(...colBaseClasses, 'text-center', 'mb-3');
            
            col.style.height = `${64 * EditItemScale}px`;
            this.preview = document.createElement('canvas');
            this.preview.classList.add('zoom');
            this.preview.style.border = '1px solid black';
            col.appendChild(this.preview);

            return col;
        };
        const buildName = () => {
            const col = getDivWithClasses(...colBaseClasses);

            this.name = getInputWithClasses('text', 'form-control');
            this.name.placeholder = 'name';
            this.name.setAttribute('disabled', true);
            this.name.addEventListener('keyup', () => this.state.spriteDirty = true);
            col.appendChild(this.name);

            return col;
        };
        const buildFrameLen = () => {
            const frameLenChanged = () => {
                this.state.spriteDirty = true;
                updatePreview.call(this);
            };            
            const col = getDivWithClasses(...colBaseClasses);

            this.frameLen = getNumberInput(0, null, 0, .01, 'frame len', frameLenChanged);
            col.appendChild(this.frameLen);

            return col;
        };
        const colBaseClasses = ['col-3', 'col-lg'];
        
        this.container = getDivWithClasses('row');
        this.container.appendChild(buildSaveCancel());
        this.container.appendChild(buildPreview());
        this.container.appendChild(buildName());
        this.container.appendChild(buildFrameLen());
        this.timer = new Timer(1/60);
        this.modal = new Modal();
        this.built = true;
    }
}