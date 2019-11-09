import eControl from './e-control.js';
import { ItemType, getItemTypeName } from './item-type.js';
import { capitalize } from './string-utilities.js';
import { 
    getDivWithClasses, 
    getButtonWithClasses, 
    getElementWithClasses, 
    getNumberInput, 
    getInputWithClasses}  from './dom-utilities.js';
import { getTileMetaOrDefault } from './sprite-utilities.js';

const StaticDetailsEvents = ['boundschanged', 'save'];
const EditItemScale = 2;

function updatePreview() {
    if (this.x.value && this.y.value && this.w.value && this.h.value) {    
        this.preview.width = +this.w.value;
        this.preview.height = +this.h.value;

        const scaledH = EditItemScale * this.preview.height;

        this.preview.style.width = `${EditItemScale * this.preview.width}px`;
        this.preview.style.height = `${scaledH}px`;    
        setTimeout(() =>
            this.preview.style.marginTop = 
                `calc(${Math.floor((this.preview.parentElement.clientHeight - scaledH) / 2) + 2}px)`);

        const ctx = this.preview.getContext('2d');

        ctx.drawImage(
            this.sprites.image, 
            +this.x.value, +this.y.value, 
            +this.w.value, +this.h.value, 
            0, 0, 
            +this.w.value, +this.h.value);
    }

    this.listeners.get('boundschanged')
        .forEach(cb => cb({
            x: parseInt(this.x.value),
            y: parseInt(this.y.value),
            w: parseInt(this.w.value),
            h: parseInt(this.h.value)
        }));
}

export default class StaticDetails extends eControl {
    constructor(state, sprites) { 
        super(StaticDetailsEvents); 

        this.state = state;
        this.sprites = sprites;
        this.ignore.push('sprites');
    }

    reset(itemType, itemName) {        
        const meta = getTileMetaOrDefault(this.sprites, itemType, itemName);

        this.currentType = itemType;
        this.origName = meta.name;
        this.name.value = meta.name;
        this.x.value = meta.x;
        this.y.value = meta.y;
        this.w.value = meta.width;
        this.h.value = meta.height;
        this.w.readOnly = this.h.readOnly = !meta.isFrame;
        
        if (!meta.isFrame) {
            this.x.step = meta.width;
            this.y.step = meta.height;
        }
        
        this.btnSave.removeAttribute('disabled');
        this.btnCancel.removeAttribute('disabled');
        this.name.removeAttribute('disabled');
        this.x.removeAttribute('disabled');
        this.y.removeAttribute('disabled');
        this.w.removeAttribute('disabled');
        this.h.removeAttribute('disabled');
        updatePreview.call(this);
        this.state.spriteDirty = !this.sprites.tiles.has(this.origName);
    }

    build() {
        const buildSaveCancel = () => {
            const save = (evt) => {
                if (!this.state.spriteDirty) return;
                
                const ctlNames = ['name', 'x', 'y', 'w', 'h']
                    .filter(c => !this[c].value)
                    .map(capitalize);

                if (ctlNames.length) {
                    let msg = `${ctlNames.splice(-1, 1)} cannot be blank`;

                    if (ctlNames.length) {
                        msg = `${ctlNames.join(', ')}, and ${msg}`;
                    }

                    alert(msg);
                    evt.cancel = true;
                    return;
                }

                if (this.name.value !== this.origName) {
                    if (this.sprites.tiles.has(this.name.value) &&
                        !confirm(`${getItemTypeName(this.currentType)} with the name "${this.name.value}" already exists.  Overwrite?`)) {
                        evt.cancel = true;
                        return;
                    }

                    if (this.sprites.tiles.has(this.origName)) {
                        this.sprites.tiles.delete(this.origName);
                        this.sprites.tileMetas.delete(this.origName);
                    }
                }

                this.sprites.define(
                    this.name.value, 
                    this.currentType === ItemType.Frame, 
                    parseInt(this.x.value),
                    parseInt(this.y.value),
                    parseInt(this.w.value),
                    parseInt(this.h.value));
                this.origName = this.name.value;
                this.state.spriteDirty = false; 
                this.state.sheetDirty = true;                       
                this.listeners.get('save').forEach(cb => 
                    cb({ 
                        itemType: this.currentType, 
                        itemName: this.name.value 
                    }));
                return;
            };
            const cancel = (evt) => {
                if (!this.state.spriteDirty) return;

                this.reset(this.currentType, this.origName);
            };           
            const col = getDivWithClasses(...smColClasses, 'save-cancel');
            const saveRow = getDivWithClasses('row');
            const saveCol = getDivWithClasses('col');            
            const cancelRow = getDivWithClasses('row');
            const cancelCol = getDivWithClasses('col');
            
            this.btnSave = getButtonWithClasses('Save', 'btn', 'btn-outline-success');
            this.btnSave.setAttribute('disabled', true);
            this.btnSave.dataset.ignoreId = 
                this.listenTo(this.btnSave, 'click', (evt) => save(evt));
            saveCol.appendChild(this.btnSave);
            saveRow.appendChild(saveCol);
            col.appendChild(saveRow);
            
            this.btnCancel = getButtonWithClasses('Cancel', 'btn', 'btn-outline-warning');
            this.btnCancel.setAttribute('disabled', true);
            this.btnCancel.dataset.ignoreId = 
                this.listenTo(this.btnCancel, 'click', (evt) => cancel(evt));
            cancelCol.appendChild(this.btnCancel);
            cancelRow.appendChild(cancelCol);
            col.appendChild(cancelRow);                        

            return col;
        };
        const buildPreview = () => {
            const col = getDivWithClasses(...smColClasses, 'text-center', 'mb-3');
            
            col.style.height = `${64 * EditItemScale}px`;
            this.preview = getElementWithClasses('canvas', 'zoom');
            this.preview.style.border = '1px solid black';
            col.appendChild(this.preview);

            return col;
        };
        const buildName = () => {
            const col = getDivWithClasses(...smColClasses);

            this.name = getInputWithClasses('text', 'form-control');
            this.name.placeholder = 'name';
            this.name.setAttribute('disabled', true);
            this.name.addEventListener('keyup', () => this.state.spriteDirty = true);
            col.appendChild(this.name);

            return col;
        };
        const buildPos = () => {
            const initX = (col) => {
                this.x = getNumberInput(
                    0, this.sprites.image.width - 1, 
                    0, null, 'x coord', boundsChanged);
                col.appendChild(this.x);
            };
            const initY = (col) => {
                this.y = getNumberInput(
                    0, this.sprites.image.height - 1, 
                    0, null, 'y coord', boundsChanged);
                col.appendChild(this.y);
            };
            const col = getDivWithClasses(...lgColClasses);
            const xRow = getDivWithClasses('row');
            const xCol = getDivWithClasses('col');
            const yRow = getDivWithClasses('row');
            const yCol = getDivWithClasses('col');

            initX(xCol);
            initY(yCol);
            xRow.appendChild(xCol);
            yRow.appendChild(yCol);
            col.appendChild(xRow);
            col.appendChild(yRow);

            return col;
        };
        const buildDim = () => {
            const initW = (col) => {
                const max = this.sprites.image.width < 64
                    ? this.sprites.image.width : 64;
                let val = this.sprites.width || 16;

                if (val > max) val = max;

                this.w = getNumberInput(1, max, val, 1, 'width', boundsChanged);
                col.appendChild(this.w);
            };
            const initH = (col) => {
                const max = this.sprites.image.height < 64
                    ? this.sprites.image.height : 64;
                let val = this.sprites.height || 16;

                if (val > max) val = max;

                this.h = getNumberInput(1, max, val, 1, 'height', boundsChanged);
                col.appendChild(this.h);
            };
            const col = getDivWithClasses(...lgColClasses);
            const wRow = getDivWithClasses('row');
            const wCol = getDivWithClasses('col');
            const hRow = getDivWithClasses('row');
            const hCol = getDivWithClasses('col');

            initW(wCol);
            initH(hCol);
            wRow.appendChild(wCol);
            hRow.appendChild(hCol);
            col.appendChild(wRow);
            col.appendChild(hRow);

            return col;
        };
        const boundsChanged = () => {
            this.state.spriteDirty = true;
            updatePreview.call(this);
        };
        const smColClasses = ['col-4', 'col-lg'];
        const lgColClasses = ['col-6', 'col-lg'];

        this.container = getDivWithClasses('row');
        this.container.appendChild(buildSaveCancel());
        this.container.appendChild(buildPreview());
        this.container.appendChild(buildName());
        this.container.appendChild(buildPos());
        this.container.appendChild(buildDim());
        this.built = true;
    }
}