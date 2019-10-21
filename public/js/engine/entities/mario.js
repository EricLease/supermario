import Entity from '../entity.js';
import { Jump, Go, Stomper, Killable, Solid, Physics } from '../traits.js';
import { loadSpriteSheet } from '../loaders.js';

const SlowDrag = 1/2000;
const FastDrag = 1/5000;

export async function loadMario() {
    const sprites = await loadSpriteSheet('mario');

    return createMarioFactory(sprites);
}

function createMarioFactory(sprites) {
    const runAnimation = sprites.animations.get('run');
        
    function routeFrame(mario) {
        return !mario.jump.falling
            ? (mario.go.distance > 0
                ? (mario.vel.x > 0 && mario.go.direction < 0 ||
                mario.vel.x < 0 && mario.go.direction > 0
                    ? 'break' 
                    : runAnimation(mario.go.distance))
                : 'idle')
            : 'jump';
    }

    function drawMario(context) {
        sprites.draw(routeFrame(this), context, 0, 0, this.go.heading < 0);
    }

    function setSprint(sprintOn) {
        this.go.dragFactor = sprintOn ? FastDrag : SlowDrag;
    }

    return function createMario() {
        const mario = new Entity('mario');
        mario.draw = drawMario;
        mario.sprint = setSprint;
        mario.addTrait(new Solid());
        mario.addTrait(new Physics());
        mario.addTrait(new Go());
        mario.addTrait(new Jump());
        mario.addTrait(new Stomper());
        mario.addTrait(new Killable());
        mario.size.set(14, 16);
        mario.killable.removeAfter = 0;
        mario.sprint(false);        
        return mario; 
    };
}