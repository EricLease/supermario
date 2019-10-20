import Entity, { Trait } from '../entity.js';
import { PendulumMove, Killable, Solid, Physics } from '../traits.js';
import { loadSpriteSheet } from '../loaders.js';

export async function loadKoopa() {
    const sprite = await loadSpriteSheet('koopa');

    return createKoopaFactory(sprite);
}

const State_Walking = Symbol('walking');
const State_Hiding = Symbol('hiding');
const State_Panic = Symbol('panic');

class Behavior extends Trait {
    constructor() {
        super('behavior');

        this.state = State_Walking;
        this.hideTime = 0;
        this.hideDuration = 5;
        this.walkSpeed = null;
        this.walkDirection = null;
        this.panicSpeed = 300;
    }

    collides(us, them) {
        if(us.killable.dead) return;

        if(them.stomper) {
            if (them.vel.y > us.vel.y) {
                this.handleStomp(us, them);
            } else if (them.killable) {
                this.handleNudge(us, them);
            }
        }
    }

    handleNudge(us, them) {
        if (this.state === State_Walking) {
            them.killable.kill();
        } else if (this.state === State_Hiding) {
            this.panic(us, them);
        } else if (this.state === State_Panic) {
            const travelDir = Math.sign(us.vel.x);
            const impactDir = Math.sign(us.pos.x - them.pos.x);

            if(travelDir !== 0 && travelDir !== impactDir) {
                them.killable.kill();
            }
        }
    }

    handleStomp(us, them) {
        if (this.state === State_Walking) {
            this.hide(us);
        } else if (this.state === State_Hiding) {
            us.killable.kill();
            us.vel.set(100, -200);
            us.solid.obstructs = false;
        } else if (this.state === State_Panic) {
            this.hide(us);
        }
    }

    hide(us) {
        this.walkDirection = Math.sign(us.vel.x);        
        
        if (this.walkSpeed === null) {
            this.walkSpeed = us.pendulumMove.speed;
        }

        us.vel.x = 0;
        us.pendulumMove.enabled = false;

        this.hideTime = 0;
        this.state = State_Hiding;
    }

    unhide(us) {
        us.pendulumMove.speed = this.walkSpeed * -this.walkDirection; 
        us.pendulumMove.enabled = true;
        this.hideTime = 0;
        this.state = State_Walking;
    }

    panic(us, them) {
        us.pendulumMove.speed = this.panicSpeed * Math.sign(them.vel.x);
        us.pendulumMove.enabled = true;
        this.state = State_Panic;
    }

    update(us, deltaTime) {
        if (this.state === State_Hiding) {
            this.hideTime += deltaTime;
        }

        if (this.hideTime > this.hideDuration) {
            this.unhide(us);
        }
    }
}

function createKoopaFactory(sprite) {
    const walkAnimation = sprite.animations.get('walk');
    const wakeAnimation = sprite.animations.get('wake');

    function routeAnimation(koopa) {
        return koopa.behavior.state === State_Walking
            ? walkAnimation(koopa.lifetime)
            : koopa.behavior.state === State_Panic ||
              (koopa.behavior.state === State_Hiding &&
               koopa.behavior.hideTime <= 3)
               ? 'hiding'
               : wakeAnimation(koopa.behavior.hideTime);
    }

    function drawKoopa(context) {
        sprite.draw(routeAnimation(this), context, 0, 0, this.vel.x < 0);
    }

    return function createKoopa() {
        const koopa = new Entity('koopa');
        koopa.size.set(16, 16);
        koopa.offset.y = 8;
        koopa.draw = drawKoopa;
        koopa.addTrait(new Solid());
        koopa.addTrait(new Physics());
        koopa.addTrait(new PendulumMove());
        koopa.addTrait(new Killable());
        koopa.addTrait(new Behavior());
        return koopa;
    }
}