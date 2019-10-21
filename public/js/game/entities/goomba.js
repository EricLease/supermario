import Entity, { Trait } from '../entity.js';
import { PendulumMove, Killable, Solid, Physics } from '../traits.js';
import { loadSpriteSheet } from '../loaders.js';

export async function loadGoomba() {
    const sprite = await loadSpriteSheet('goomba');

    return createGoombaFactory(sprite);
}

class Behavior extends Trait {
    constructor() {
        super('behavior');
    }

    collides(us, them) {
        if(us.killable.dead) return;

        if(them.stomper) {
            if (them.vel.y > us.vel.y) {
                us.killable.kill();
                us.pendulumMove.speed = 0;
            } else if(them.killable) them.killable.kill();
        }
    }
}

function createGoombaFactory(sprite) {
    const walkAnimation = sprite.animations.get('walk');

    function routeAnimation(goomba) {
        return !goomba.killable.dead
            ? walkAnimation(goomba.lifetime)
            : 'flat';
    }

    function drawGoomba(context) {
        sprite.draw(routeAnimation(this), context, 0, 0);
    }

    return function createGoomba() {
        const goomba = new Entity('goomba');
        goomba.size.set(16, 16);
        goomba.draw = drawGoomba;
        goomba.addTrait(new Solid());
        goomba.addTrait(new Physics());        
        goomba.addTrait(new PendulumMove());
        goomba.addTrait(new Killable());
        goomba.addTrait(new Behavior());
        return goomba;
    }
}