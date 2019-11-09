import eControl from './e-control.js';
import SpriteSheet from '../engine/sprite-sheet.js';
import { loadClientImage, loadClientSpriteSheet } from './loaders.js';
import { buildStaticLists, buildAnimationList } from './builders.js';
import { 
    bsHide, bsShow, bsToggle,    
    removeChildren, 
    getDivWithClasses, 
    getButtonWithClasses, 
    getElementWithClasses, 
    getNumberInput,
    getInputWithClasses} from './dom-utilities.js';
import { capitalize } from './string-utilities.js';
import { ItemType } from './item-type.js';

const SheetSelectionEvents = [ 'sheetselected' ];
const ExistingFileEmpty = 'Choose a sprite sheet...';
const AssetSelectionEmpty = 'Choose an image asset...';
const extractFiles = (e, p) => 
    [...e.target.files].filter(f => f.type.match(p));
    
function resetOpen() {
    const tiles = this.openPreviewLists.get('Tiles');
    const frames = this.openPreviewLists.get('Frames');
    const animations = this.openPreviewLists.get('Animations');

    this.existingSheet.value = '';
    this.existingSheetLabel.innerText = ExistingFileEmpty;
    this.currentFileName = null;
    bsHide(this.openPreview);
    bsHide(tiles.col);
    bsHide(frames.col);
    bsHide(animations.col);
    bsHide(this.existingSheetContainer);
    bsShow(this.createContainer);  
    bsShow(this.createDetails);                      
    removeChildren(tiles.ul);
    removeChildren(frames.ul);
    removeChildren(animations.ul);
}

function resetCreate() {
    this.newFilename.value = '';
    this.assetSelection.value = '';
    this.assetSelectionLabel.innerText = AssetSelectionEmpty;
    this.currentAsset = null;                        
    bsHide(this.createDetails);
    bsHide(this.createContainer);
    bsShow(this.existingSheetContainer);
    bsShow(this.openPreview);
    removeChildren(this.assetPreviewContainer);
}    

export default class SheetSelection extends eControl {
    constructor(parent) { 
        super(SheetSelectionEvents); 

        this.parent = parent;
        this.currentFileName = null;
        this.ignore.push('parent');
    }

    show() { eControl.prototype.attach.call(this, this.parent); }
    hide() { eControl.prototype.detach.call(this); }

    build() {
        const buildButtonPanel = () => {
            const buildButton = (name, active = false) => {
                const createOrOpen = (e) => {
                    // TODO: This is basically c/p to create's "tiles or frames"
                    // -> refactor into a rb group builder, add to builders.js
                    const target = e.target.matches('input[type="radio"]')
                        ? e.target : e.target.firstElementChild;
                
                    // Label click happens prior to radio state change
                    // so if it's already selected, do nothing
                    if (e.target.matches('.active')) return;
                    // should be (but this doesn't work initially for some reason):
                    //if (target.checked) return;
                
                    if (target.dataset.create === 'true') resetOpen.call(this);
                    else if (target.dataset.open === 'true') resetCreate.call(this);
                };
                const label = getElementWithClasses('label', 'btn', 'btn-primary', 'btn-link', 'text-light');
                    
                if (active) label.classList.add('active', 'focus');

                label.addEventListener('click', createOrOpen)
                
                const rb = document.createElement('input');
                
                rb.type = 'radio';
                rb.name = 'createOrOpen';
                rb.autocomplete = 'off';
                // TODO: figure out why rb.checked set here isn't reflected
                // when page loads. Current workaround is checking `.active`
                rb.checked = active; 
                rb.dataset.create = active;
                rb.dataset.open = !active;

                label.appendChild(rb);
                label.innerHTML += ` ${name}`;

                return label;
            };
            const row = getDivWithClasses('row');
            const btnGrp = getDivWithClasses('btn-group', 'btn-group-toggle');

            btnGrp.dataset.toggle = 'buttons';
            btnGrp.appendChild(buildButton('Create', true));
            btnGrp.appendChild(buildButton('Open'));
            row.appendChild(btnGrp);

            return row;
        };
        const buildSelectionPanel = () => {
            const buildCreateSelection = () => {
                const createSheet = () => {
                    let ctlNames = ['newFilename'];
                    
                    if (this.itemType === ItemType.Tile) {
                        ctlNames.push('tileW', 'tileH');
                    }
                    
                    ctlNames = ctlNames.filter(c => !this[c].value).map(capitalize);

                    if (!this.currentAsset || !this.currentAsset.length) {
                        ctlNames.push('Current Asset');
                    }

                    if (ctlNames.length) {
                        let msg = `${ctlNames.splice(-1, 1)} cannot be blank`;

                        if(ctlNames.length) {
                            msg = `${ctlNames.join(', ')}, and ${msg}`;
                        }

                        alert(msg);
                        return;
                    }

                    let fileName = this.newFilename.value;
                    let w, h;
                    
                    if (!fileName.endsWith('.json')) fileName += '.json';

                    if (this.itemType === ItemType.Tile) {
                        w = parseInt(this.tileW.value);
                        h = parseInt(this.tileH.value);
                    }

                    this.listeners.get('sheetselected').forEach(cb => {
                        cb({
                            sprites: new SpriteSheet(
                                this.assetPreviewContainer.querySelector('img'), w, h),
                            fileName: fileName,
                            new: true
                        });
                    });
                };
                
                this.createContainer = getDivWithClasses('input-group', 'mb-3');
                this.newFilename = getInputWithClasses('text', 'form-control');
                this.newFilename.placeholder = 'new sprite sheet name';
                this.createContainer.appendChild(this.newFilename);
                
                const button = getButtonWithClasses('Create', 'btn', 'btn-outline-primary');
                
                this.listenTo(button, 'click', () => createSheet());
                
                const append = getDivWithClasses('input-group-append');
                
                append.appendChild(button);
                
                this.createContainer.appendChild(append);
                
                return this.createContainer;
            };
            const buildOpenSelection = () => {
                const open = () => {
                    if (!this.currentFileName) return false;

                    this.listeners.get('sheetselected').forEach(cb => {
                        cb({
                            sprites: this.sprites,
                            fileName: this.currentFileName,
                            new: false
                        });
                    });                            
                };
                const jsonSelected = async (evt) => {
                    const displayPreview = () => {
                        if (!this.sprites) return;
                    
                        const tilesPreview = this.openPreviewLists.get('Tiles');
                        const framesPreview = this.openPreviewLists.get('Frames');
                        const animPreview = this.openPreviewLists.get('Animations');
                        const ulTiles = tilesPreview.ul;
                        const ulFrames = framesPreview.ul;
                        const ulAnim = animPreview.ul;
                        
                        removeChildren(ulTiles);
                        removeChildren(ulFrames);
                        removeChildren(ulAnim);
                        
                        const [tiles, frames] = buildStaticLists(this.sprites);
                        const animations = buildAnimationList(this.sprites);
                        
                        tiles.forEach(li => ulTiles.appendChild(li));
                        frames.forEach(li => ulFrames.appendChild(li));
                        animations.forEach(obj => {
                            ulAnim.appendChild(obj.li);
                            obj.start();
                        });
                    
                        tiles.length ? bsShow(tilesPreview.col) : bsHide(tilesPreview.col);
                        frames.length ? bsShow(framesPreview.col) : bsHide(framesPreview.col);
                        animations.length ? bsShow(animPreview.col) : bsHide(animPreview.col);
                    };
                    const loadlist = extractFiles(evt, /application\/json/);
                
                    if (loadlist.length === 0) return;

                    this.currentFileName = null;
                    this.existingSheetLabel.innerText = '';                    
                    this.sprites = await loadClientSpriteSheet(loadlist[0]);
                    this.existingSheetLabel.innerText = this.currentFileName = loadlist[0].name;
                    displayPreview();
                };
                const existingSheetAccept = '.json';
                
                this.existingSheetContainer = getDivWithClasses('input-group', 'mb-3');
                this.existingSheetLabel = getElementWithClasses('label', 'form-control', 'text-primary', 'text-truncate');
                this.existingSheetLabel.setAttribute('for', 'existingSheet');
                this.existingSheetLabel.innerText = ExistingFileEmpty;
                this.existingSheetContainer.appendChild(this.existingSheetLabel);
                this.existingSheet = getInputWithClasses('file', 'file-input');
                this.existingSheet.id = 'existingSheet'; //`id` req'd for label's `for`
                this.existingSheet.setAttribute('accept', existingSheetAccept);
                this.existingSheetContainer.appendChild(this.existingSheet);
                this.listenTo(this.existingSheet, 'change', async (evt) => await jsonSelected(evt));
                
                const button = getButtonWithClasses('Open', 'btn', 'btn-outline-primary');
                
                this.listenTo(button, 'click', () => open());
                
                const append = getDivWithClasses('input-group-append');
                
                append.appendChild(button);
                                
                this.existingSheetContainer.appendChild(append);
                bsHide(this.existingSheetContainer);

                return this.existingSheetContainer;
            };
            const row = getDivWithClasses('row');

            row.appendChild(buildCreateSelection());
            row.appendChild(buildOpenSelection());

            return row;
        };
        const buildCreateDetailsPanel = () => {
            const buildTilesOrFramesRow = () => {
                const buildButton = (name, active = false) => {
                    const tilesOrFrames = (e) => {
                        const target = e.target.matches('input[type="radio"]')
                            ? e.target : e.target.firstElementChild;
                    
                        // Label click happens prior to radio state change
                        // so if it's already selected, do nothing
                        if (e.target.matches('.active')) return;
                        // should be (but this doesn't work initially for some reason):
                        //if (target.checked) return;
                    
                        bsToggle(this.tileSize);
                        
                        this.itemType = target.dataset.tiles === 'true'
                            ? ItemType.Tile : ItemType.Frame;
                    };
                    const label = getElementWithClasses('label', 'btn', 'btn-primary', 'btn-link', 'text-light');
                    
                    if (active) label.classList.add('active', 'focus');
                    
                    label.addEventListener('click', tilesOrFrames)
                    
                    const rb = document.createElement('input');
    
                    rb.type = 'radio';
                    rb.name = 'tilesOrFrames';
                    rb.autocomplete = 'off';
                    // TODO: figure out why rb.checked set here isn't reflected
                    // when page loads. Current workaround is checking `.active`
                    rb.checked = active; 
                    rb.dataset.tiles = active;
                    rb.dataset.frames = !active;
                    
                    label.appendChild(rb);
                    label.innerHTML += ` ${name}`;
    
                    return label;
                };
                const row = getDivWithClasses('row');
                const choice = getDivWithClasses('col-4', 'col-sm-3', 'col-md-2');
                const btnGroup = getDivWithClasses('btn-group', 'btn-group-toggle');
                const sizeWRow = getDivWithClasses('row');
                const sizeWCol = getDivWithClasses('col');
                const sizeHRow = getDivWithClasses('row');
                const sizeHCol = getDivWithClasses('col');
                
                btnGroup.appendChild(buildButton('Tiles', true));
                btnGroup.appendChild(buildButton('Frames'));
                btnGroup.dataset.toggle = 'buttons';
                choice.appendChild(btnGroup);
                row.appendChild(choice);
                [this.tileW, this.tileH] = ['width', 'height']
                    .map(d => getNumberInput(1, 64, 16, 1, d, null, false));
                sizeWCol.appendChild(this.tileW);
                sizeHCol.appendChild(this.tileH);
                sizeWRow.appendChild(sizeWCol);
                sizeHRow.appendChild(sizeHCol);
                this.tileSize = getDivWithClasses('offset-1', 'col-3', 'col-md-2', 'col-lg-1');
                this.tileSize.appendChild(sizeWRow);
                this.tileSize.appendChild(sizeHRow);
                row.appendChild(this.tileSize);

                return row;
            };
            const buildAssetSelectionRow = () => {
                const imageSelect = async (evt) => {  
                    const loadlist = extractFiles(evt, 'image.*');
                
                    if (!loadlist.length) return;
                    
                    this.currentAsset = null;
                    this.assetSelectionLabel.innerText = '';
                    removeChildren(this.assetPreviewContainer);
                    
                    this.assetPreviewContainer.appendChild(await loadClientImage(loadlist[0]));
                    this.assetSelectionLabel.innerText = this.currentAsset = loadlist[0].name;
                };
                const imgAccept = '.png,.gif,.jpg,.jpeg'
                const row = getDivWithClasses('row');
                const col = getDivWithClasses('col-6', 'col-sm-5', 'col-md-4', 'col-lg-3');

                this.assetSelectionLabel = getElementWithClasses('label', 'form-control', 'text-primary', 'text-truncate');
                this.assetSelectionLabel.setAttribute('for', 'assetSelection');
                this.assetSelectionLabel.innerText = AssetSelectionEmpty;
                col.appendChild(this.assetSelectionLabel);
                this.assetSelection = getInputWithClasses('file', 'file-input');
                this.assetSelection.id = 'assetSelection'; //`id` req'd for label's `for`
                this.assetSelection.setAttribute('accept', imgAccept);
                this.assetSelection.addEventListener('change', imageSelect, false);
                col.appendChild(this.assetSelection);
                row.appendChild(col);

                return row;
            };
            const buildAssetPreviewRow = () => {
                const row = getDivWithClasses('row');
                
                this.assetPreviewContainer = getDivWithClasses('col', 'asset-preview');

                row.appendChild(this.assetPreviewContainer);

                return row;
            };
            const col = getDivWithClasses('col');
            
            col.appendChild(buildTilesOrFramesRow());
            col.appendChild(buildAssetSelectionRow());
            col.appendChild(buildAssetPreviewRow());
            this.createDetails = getDivWithClasses('row');
            this.createDetails.appendChild(col);
            
            return this.createDetails;
        };
        const buildOpenPreviewPanel = () => {
            const buildOpenPreviewPane = (name) => {
                const col = getDivWithClasses('col', 'col-lg-3');
                const ul = getElementWithClasses('ul');

                col.innerText = `${name}:`;
                col.appendChild(ul);
                bsHide(col);
                this.openPreviewLists.set(name, { col: col, ul: ul });

                return col;
            };

            this.openPreviewLists = new Map();
            this.openPreview = getDivWithClasses('row');
            this.openPreview.appendChild(buildOpenPreviewPane('Tiles'));
            this.openPreview.appendChild(buildOpenPreviewPane('Frames'));
            this.openPreview.appendChild(buildOpenPreviewPane('Animations'));
            bsHide(this.openPreview);
            
            return this.openPreview;
        };

        this.dispose();
        this.disposed = false;
        this.itemType = ItemType.Tile;
        this.container = getDivWithClasses('container-fluid');
        this.container.appendChild(buildButtonPanel());
        this.container.appendChild(buildSelectionPanel());
        this.container.appendChild(buildCreateDetailsPanel());
        this.container.appendChild(buildOpenPreviewPanel());
        this.built = true;
    }
}