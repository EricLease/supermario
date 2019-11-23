import mControl from '../m-control.js';
import Timer from '../../engine/timer.js';
import Camera from '../../engine/camera.js';
import { setupCollision, setupBackgrounds, setupTileGrid } from '../../engine/loaders/level.js';
import { debounce } from '../../common/dom-utilities.js';

const ScreenEvents = [];

export default class Screen extends mControl {
    constructor(state, container, level, levelSpec, sprites) { 
        super('screen', state, container, ScreenEvents);
        
        this.camera = new Camera();
        this.timer = new Timer();
        this.level = level;
        this.levelSpec = levelSpec;
        this.sprites = sprites;
        this.dbResize = debounce(this.resize.bind(this));
    }

    resize() {
        const screenHeight = 240; // 15 Tiles high (@ 16px/tile)
        const containerRect = this.container.getBoundingClientRect();

        this.children.stage.style.height = `calc(100vh - ${containerRect.top}px)`;
        this.children.stage.style.width = `${containerRect.width}px`;
        // Scale the canvas using max available height, and setting width accordingly
        this.children.stage.width = containerRect.width * screenHeight 
            / this.children.stage.getBoundingClientRect().height;
        this.children.stage.height = screenHeight;
    
        const context = this.children.stage.getContext('2d');
    
        this.timer.update = (deltaTime) => {
            //this.level.update(deltaTime);
            //this.camera.pos.x  = 0;
            if (this.state.redrawRequired) {                
                this.state.redrawRequired = false;
                context.clearRect(0, 0, this.children.stage.width, this.children.stage.height);
                this.level.comp.draw(context, this.camera);
            }
        };
        this.camera.size.set(
            this.children.stage.width, 
            this.children.stage.height); 
        this.level.comp.layers = [];
        setupBackgrounds(this.levelSpec, this.level, this.sprites, this.camera.size);
        setupTileGrid(this.level, this.camera.size);
        this.state.redrawRequired = true;
    }

    bind() {
        this.resize();        
        setupCollision(this.levelSpec, this.level);
    }

    async load() {
        window.addEventListener('resize', () => this.dbResize());
        await super.load();
    }

    unload() {
        window.removeEventListener('resize', () => this.dbResize());        
        super.unload();
    }

    start() { this.state.redrawRequired = true; this.timer.start(); }
    stop() { this.timer.stop(); }
}