import SpriteWorkbench from './sprite-workbench.js';
import AnimationDetails from './animation-details.js';
import FramesetEditor from './frameset-editor.js';
import { getDivWithClasses } from './dom-utilities.js';

const AnimationWorkbenchEvents = [];

export default class AnimationWorkbench extends SpriteWorkbench {
    constructor(state, sprites) { 
        super(AnimationWorkbenchEvents); 

        this.state = state;
        this.sprites = sprites;
        this.ignore.push('sprites');
    }

    reset(evt) {
        this.currentAnimation = evt.itemName;
        this.details.reset(evt.itemName);
        this.frameset.reset(evt.itemName);
    }

    cleanup() { if (this.details) this.details.cleanup(); }

    build() {
        const initDetails = () => {
            this.details = new AnimationDetails(this.state, this.sprites);
            this.listenTo(this.details, 'save', 
                (evt) => this.listeners.get('spritesupdated').forEach(cb => cb(evt)));
            this.listenTo(this.details, 'cancel',
                () => this.frameset.reset(this.currentAnimation))
            this.children.push(this.details);
        };
        const initFrameset = () => {
            this.frameset = new FramesetEditor(this.state, this.sprites);
            this.listenTo(this.frameset, 'change',
                (evt) => this.details.updateFrames(evt.frames));
            this.children.push(this.frameset);
        };

        this.container = getDivWithClasses('workbench');
        this.close();
        initDetails();
        initFrameset();
        this.built = true;
    }
}