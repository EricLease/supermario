import SpriteWorkbench from './sprite-workbench.js';
import StaticDetails from './static-details.js';
import SpriteIndicator from './sprite-indicator.js';
import { getTileMetaOrDefault } from './sprite-utilities.js';
import { Vec2 } from '../engine/math.js';
import { getDivWithClasses } from './dom-utilities.js';

const StaticWorkbenchEvents = ['spritesupdated'];

export default class StaticWorkbench extends SpriteWorkbench {
    constructor(state, sprites) { 
        super(StaticWorkbenchEvents); 

        this.state = state;
        this.sprites = sprites;
        this.ignore.push('sprites');
    }

    reset(evt) {
        const resetIndicator = () => {
            const meta = getTileMetaOrDefault(
                this.sprites, evt.itemType, evt.itemName);
                
            this.indicator.reset(
                new Vec2(meta.x, meta.y), 
                new Vec2(meta.width, meta.height));
        }

        this.details.reset(evt.itemType, evt.itemName);
        resetIndicator();
    }

    build() {
        const initDetails = () => {
            const spritesUpdated = (evt) => {
                this.listeners.get('spritesupdated').forEach(cb => cb(evt));
            };
            const boundsChanged = (evt) => {
                if (!(evt.x >= 0 && evt.y >= 0 && evt.w >= 0&& evt.h >= 0)) return;

                this.indicator.reset(
                    new Vec2(evt.x, evt.y), 
                    new Vec2(evt.w, evt.h));
            };

            this.details = new StaticDetails(this.state, this.sprites);
            this.details.addEventListener('save', (evt) => spritesUpdated(evt));
            this.details.addEventListener('boundschanged', (evt) => boundsChanged(evt))
            this.children.push(this.details);
        };
        const initIndicator = () => {            
            this.indicator = new SpriteIndicator(this.state, this.sprites.image);
            this.children.push(this.indicator);
        };

        this.container = getDivWithClasses('workbench');
        this.close();
        initDetails();
        initIndicator();
        this.built = true;
    }
}