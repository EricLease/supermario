import eControl from './e-control.js';
import Modal from './modal.js';
import { getDivWithClasses, getButtonWithClasses, getElementWithClasses } from './dom-utilities.js';

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

        this.listeners.get('done').forEach(cb => cb());
    }

    build() {
        const buildDetailsCol = () => {
            const buildRow = (label, value) => {
                const row = getDivWithClasses('row');
                const lCol = getDivWithClasses('col', 'col-xl-2', 'col-lg-3', 'col-md-4', 'col-sm-6', 'text-right');
                const rCol = getDivWithClasses('col', 'col-xl-10', 'col-lg-9', 'col-md-8', 'col-sm-6');
                const span = getElementWithClasses('span', 'text-truncate');

                lCol.innerText = label;
                row.appendChild(lCol);
                span.innerText = value;
                rCol.appendChild(span);
                row.appendChild(rCol);

                return row;
            };
            const col = getDivWithClasses('col-8');
            
            col.appendChild(buildRow('Sprite Sheet:', this.fileName));
            col.appendChild(buildRow('Asset:', this.sprites.displayImageUrl));

            if (this.sprites.width) col.appendChild(buildRow('Tile Width:', this.sprites.width));
            if (this.sprites.height) col.appendChild(buildRow('Tile Width:', this.sprites.height));

            return col;
        };
        const buildExportCol = () => {
            const btnBack = getButtonWithClasses('Back', 'btn', 'btn-outline-primary', 'float-right', 'mr-2');
            const btnExport = getButtonWithClasses('Export', 'btn', 'btn-outline-success', 'float-right', 'mr-2');
            
            btnBack.addEventListener('click', async () => await this.done());
            btnExport.addEventListener('click', async () => await this.export());
            
            const col = getDivWithClasses('col-4');
            
            col.append(btnBack);
            col.append(btnExport);

            return col;
        };
        
        this.container = getDivWithClasses('row');
        this.container.appendChild(buildDetailsCol());
        this.container.appendChild(buildExportCol());
        this.modal = new Modal();
        this.built = true;
    }
}