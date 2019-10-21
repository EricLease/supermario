import { Trait, Sides } from '../entity.js';

export default class Jump extends Trait {
    constructor() { 
        super('jump'); 

        this.ready = false;
        this.duration = 0.3;
        this.engageTime = 0;
        this.requestTime = 0;
        this.gracePeriod = 0.1;
        this.velocity = 200;
        this.speedBoost = 0.3;
    }

    get falling() {
        return this.ready < 0;
    }

    start() { 
        this.requestTime = this.gracePeriod;
    }

    cancel() { 
        this.engageTime = 0; 
        this.requestTime = 0;
    }

    obstruct(entity, side, match) {
        switch(side) {
            case Sides.Bottom:
                this.ready = 1;
                break;

            case Sides.Top:
                this.cancel();
                break;
        }
    }

    update(entity, deltaTime) {
        if (this.requestTime > 0) {
            if (this.ready > 0) {
                this.engageTime = this.duration; 
                this.requestTime = 0;
            }

            this.requestTime -= deltaTime;
        }

        if (this.engageTime > 0) {
            entity.vel.y = -(this.velocity + Math.abs(entity.vel.x) * this.speedBoost);
            this.engageTime -= deltaTime;
        }

        this.ready--;
    }
}