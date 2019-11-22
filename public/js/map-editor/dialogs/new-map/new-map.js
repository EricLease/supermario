import Dialog from '../dialog.js';
import { extractFiles } from '../../../common/dom-utilities.js';
import { loadClientSpriteSheet } from '../../../common/tools/loaders.js';
import Modal from '../../../common/modal.js';

async function validate(dialog, evt) {
    const loadlist = extractFiles(evt, /application\/json/);
                
    if (loadlist.length === 0) return;

    dialog.details.sprites = null;
    dialog.details.spriteSheetName = null;
    dialog.children.label.innerText = '';                    
    dialog.details.sprites = await loadClientSpriteSheet(loadlist[0]);
    dialog.children.label.innerText = dialog.details.spriteSheetName = loadlist[0].name;
}

export default class NewMapDialog extends Dialog {
    constructor() { 
        super('new-map', {
            dismiss: (evt) => evt.cancel = true
        });
    }

    reset() {
        this.children.label.innerText = 'Select a sprite sheet...';
        this.children.file.value = null;
        this.children.name.value = null;
    }

    bind() {
        this.children.label.setAttribute('for', this.children.file.id);
        this.children.file.addEventListener('change', 
            async (evt) => await validate(this, evt));
        this.children.name.addEventListener('keyup', 
            () => this.details.mapName = this.children.name.value);
        this.children.cancel.addEventListener('click', () => { 
            this.details.cancel = true; this.modal.dismiss(); 
        });
        this.children.create.addEventListener('click', async () => {
            this.details.cancel = 
                !(this.details.spriteSheetName && 
                  this.details.sprites && 
                  this.details.mapName);
            
            if (this.details.cancel) {
                await new Modal({ depth: 2 }).reject('Sprite sheet and map name required.');            
            } else {
                this.modal.dismiss();
            }
        });
    }
}