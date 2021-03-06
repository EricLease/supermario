import SpriteWorkbench from './sprite-workbench.js';
import StaticDetails from './static-details.js';
import SpriteIndicator from './sprite-indicator.js';
import { Vec2 } from '../engine/math.js';
import { getDivWithClasses } from '../common/dom-utilities.js';

const StaticWorkbenchEvents = ['spritesupdated'];

export default class StaticWorkbench extends SpriteWorkbench {
    constructor(state, sprites) { 
        super(StaticWorkbenchEvents); 

        this.state = state;
        this.sprites = sprites;
        this.ignore.push('sprites');
    }

    reset(evt) {
        // bounds changed on details triggers reset on indicator
        this.details.reset(evt.itemType, evt.itemName);
    }

    build() {
        const initDetails = () => {
            const spritesUpdated = 
                (evt) => this.listeners.get('spritesupdated').forEach(cb => cb(evt));
            const cancelAdd = 
                () => this.listeners.get('canceladd').forEach(cb => cb());
            const boundsChanged = (evt) => {
                if (!(evt.x >= 0 && evt.y >= 0 && evt.w >= 0&& evt.h >= 0)) return;

                this.indicator.reset(
                    new Vec2(evt.x, evt.y), 
                    new Vec2(evt.w, evt.h));
            };

            this.details = new StaticDetails(this.state, this.sprites);
            this.listenTo(this.details, 'save', (evt) => spritesUpdated(evt));
            this.listenTo(this.details, 'canceladd', () => cancelAdd());
            this.listenTo(this.details, 'boundschanged', (evt) => boundsChanged(evt))
            this.children.push(this.details);
        };
        const initIndicator = () => {   
            const moveTo = (evt) => this.details.moveTo(evt.pos);
            const dragging = (evt) => this.details.dragging(evt.pos, evt.dim);
            const frames = !(this.sprites.width && this.sprites.height);
            const maxDim = frames 
                ? new Vec2(64, 64) 
                : new Vec2(this.sprites.tileW, this.sprites.tileH);

            this.indicator = new SpriteIndicator(
                this.state, this.sprites.image, frames, maxDim);
            this.listenTo(this.indicator, 'moveto', (evt) => moveTo(evt));
            this.listenTo(this.indicator, 'dragging', (evt) => dragging(evt));
            this.children.push(this.indicator);
        };

        this.container = getDivWithClasses('workbench');
        this.close();
        initDetails();
        initIndicator();
        this.built = true;
    }
}