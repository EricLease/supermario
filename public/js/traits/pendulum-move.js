import { Trait, Sides } from '../entity.js';

export default class PendulumMove extends Trait {
    constructor() { 
        super('pendulumMove');

        this.enabled = true;
        this.speed = -30;
    }

    obstruct(entity, side, match) {
        if (side === Sides.Left || 
            side === Sides.Right) {
            this.speed = -this.speed;
        }
    }

    update(entity, deltaTime) {
        if (this.enabled) {
            entity.vel.x = this.speed;
        }
    }
}