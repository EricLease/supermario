import eControl from './e-control.js';
import Modal from './modal.js';
import { getDivWithClasses, getButtonWithClasses, getElementWithClasses, getInputWithClasses } from './dom-utilities.js';
import { guid } from './guid.js';

const SheetDetailsEvents = ['done'];

export default class SheetDetails extends eControl {
    constructor(state, fileName, sprites) { 
        super(SheetDetailsEvents); 

        this.state = state;
        this.fileName = fileName;
        this.sprites = sprites;
        this.ignore.push('fileName', 'sprites');
    }

    async export() {        
        if (this.state.spriteDirty && 
            !await this.modal.confirm(
                'There are pending changes.  Export sprite sheet before saving?',
                null, {
                    footer: {
                        btnOk: {
                            text: 'Discard',
                            class: 'btn-outline-danger'
                        }
                    }
                })) return;
    
        const data = JSON.stringify(this.sprites.export(), null, 4);
        const file = new Blob([data], {type: 'application/json'});
        const download = document.createElement('a');
        
        download.href = window.URL.createObjectURL(file);
        download.download = this.fileName;
        document.body.appendChild(download);
        download.click();
    
        setTimeout(() => {
            document.body.removeChild(download);
            window.URL.revokeObjectURL(download.href);
            this.state.sheetDirty = false;
        });
    }

    async done() {
        if ((this.state.sheetDirty || this.state.spriteDirty) && 
            !await this.modal.confirm(
                'There are pending changes.  Return to sheet selection without saving?',
                null, {
                    footer: {
                        btnOk: {
                            text: 'Discard',
                            class: 'btn-outline-danger'
                        }
                    }
                })) return;

        if (this.dirtyIndicator) {
            clearInterval(this.dirtyIndicator);
            this.dirtyIndicator = null;
            document.body.style.backgroundColor = null;
        }

        this.listeners.get('done').forEach(cb => cb());
    }

    build() {
        const buildDetailsCol = () => {
            const buildRow = (text, value) => {
                const nameChanged = () => {
                    this.fileName = input.value;
                    this.state.sheetDirty = true;
                };
                const formGroup = getDivWithClasses('form-group', 'row');
                const label = getElementWithClasses('label', 'col-6', 'col-md-5', 'col-lg-3', 'col-xl-2', 'col-form-label');
                const col = getDivWithClasses('col-12', 'col-sm-6', 'col-lg-5', 'col-xl-4');
                const input = getInputWithClasses('text', 'form-control');
                const id = `_${guid()}`;

                input.id = id;
                input.value = value;
                
                if (text !== 'Sprite Sheet') input.setAttribute('readonly', true);
                else {
                    input.placeholder = 'sprite sheet name (.json)';
                    this.listenTo(input, 'keyup', () => nameChanged());
                }

                col.appendChild(input);
                label.innerText = text;
                label.setAttribute('for', id);
                formGroup.appendChild(label);
                formGroup.appendChild(col);

                return formGroup;
            };
            const col = getDivWithClasses('col-7', 'col-lg-8');
            
            col.appendChild(buildRow('Sprite Sheet', this.fileName));
            col.appendChild(buildRow('Asset', this.sprites.displayImageUrl));

            if (this.sprites.width) col.appendChild(buildRow('Tile Width', this.sprites.width));
            if (this.sprites.height) col.appendChild(buildRow('Tile Width', this.sprites.height));

            return col;
        };
        const buildExportCol = () => {
            const btnBack = getButtonWithClasses('Back', 'btn', 'btn-outline-primary', 'float-right', 'mr-2');
            const btnExport = getButtonWithClasses('Export', 'btn', 'btn-outline-success', 'float-right', 'mr-2');
            
            btnBack.addEventListener('click', async () => await this.done());
            btnExport.addEventListener('click', async () => await this.export());
            
            const col = getDivWithClasses('col-5', 'col-lg-4');
            
            col.append(btnBack);
            col.append(btnExport);

            return col;
        };
        const initDirtyIndicator = () => {
            this.dirtyIndicator = setInterval(() => {
                document.body.style.backgroundColor =
                    this.state.sheetDirty ? 'lightyellow' : null;
            }, 300);
        };
        
        this.container = getDivWithClasses('row');
        this.container.appendChild(buildDetailsCol());
        this.container.appendChild(buildExportCol());
        initDirtyIndicator();
        this.modal = new Modal();
        this.built = true;
    }
}