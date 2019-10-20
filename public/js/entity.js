import BoundingBox from './bounding-box.js'
import { Vec2 } from './math.js';

export const Sides = {
    Top: Symbol('top'),
    Bottom: Symbol('bottom'),
    Left: Symbol('left'),
    Right: Symbol('right')
};

export class Trait {
    constructor(name) { 
        this.name = name; 
        this.tasks = [];
    }

    finalize() { 
        this.tasks.forEach(task => task()); 
        this.tasks.length = 0;
    }

    queue(task) { this.tasks.push(task); }
    collides(us, them) { }
    obstruct (entity, side, match) { }
    update() { }
}

export default class Entity {
    constructor(name) {
        this.name = name;
        this.canCollide = true;
        this.size = new Vec2(0, 0);
        this.pos = new Vec2(0, 0);
        this.offset = new Vec2(0, 0);
        this.bounds = new BoundingBox(this.name, this.pos, this.size, this.offset);
        this.vel = new Vec2(0, 0);
        this.lifetime = 0;
        this.traits = [];
    }

    addTrait(trait) {
        this.traits.push(trait);
        this[trait.name] = trait;
    }

    collides(candidate) {
        this.traits.forEach(trait => {
            trait.collides(this, candidate);
        });
    }

    obstruct(side, match) {
        this.traits.forEach(trait => {
            trait.obstruct(this, side, match);
        });
    }

    draw() {}

    finalize() {
        this.traits.forEach(trait => {
            trait.finalize();
        });
    }

    update(deltaTime, level) {
        this.traits.forEach(trait => {
            trait.update(this, deltaTime, level);
        });
        this.lifetime += deltaTime;
    }
}