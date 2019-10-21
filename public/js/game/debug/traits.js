import { Trait } from '../entity.js';

export class ClonePoop extends Trait {
    constructor(entities, createMario) { 
        super('clonepoop'); 

        this.spawnTimeout = 0;
        this.createMario = createMario;
        this.entities = entities;
    }

    update(entity, deltaTime) {        
        if (this.spawnTimeout > 0.1 && entity.vel.y < 0) {
            const spawn = this.createMario();

            spawn.bounds.left = entity.bounds.left;
            spawn.bounds.top = entity.bounds.top;
            spawn.vel.y = entity.vel.y - 200;
            
            this.entities.add(spawn);
            this.spawnTimeout = 0;
        }

        this.spawnTimeout += deltaTime;
    }
}