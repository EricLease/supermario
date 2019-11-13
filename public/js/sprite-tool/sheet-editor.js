import eControl from '../common/e-control.js';
import SheetDetails from './sheet-details.js';
import SpriteEditor from './sprite-editor.js';
import { getDivWithClasses } from '../common/dom-utilities.js';

const SheetEditorEvents = ['done'];

export default class SheetEditor extends eControl {
    constructor(fileName, sprites, isNew) { 
        super(SheetEditorEvents);

        this.fileName = fileName;
        this.sprites = sprites;
        this.state = { spriteDirty: false, sheetDirty: isNew };
        this.ignore.push('fileName', 'sprites');
    }

    build() {
        const done = () => {
            this.spriteEditor.cleanup();
            this.listeners.get('done').forEach(cb => cb());
        };

        this.sheetDetails = new SheetDetails(this.state, this.fileName, this.sprites);
        this.listenTo(this.sheetDetails, 'done', () => done());
        this.spriteEditor = new SpriteEditor(this.state, this.sprites);
        this.children.push(this.sheetDetails, this.spriteEditor);
        this.container = getDivWithClasses('container-fluid', 'editor');
        this.built = true;
    }
}