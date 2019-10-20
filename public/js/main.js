import Camera from './camera.js';
import Timer from './timer.js';
import Entity from './entity.js';
import { PlayerController } from './traits.js';
import { setupKeyboard } from './input.js'
import { createLevelLoader, loadFont } from './loaders.js';
import { loadEntities } from './entities.js';
import { displayHitboxes } from './debug/functions.js';
import { createDashboardLayer } from './layers.js';

function createPlayerEnvironment(playerEntity) {
    const playerEnv = new Entity();
    const playerCtl = new PlayerController();

    playerCtl.checkpoint.set(64, 64);
    playerCtl.setPlayer(playerEntity);
    playerEnv.addTrait(playerCtl);

    return playerEnv;
}

async function main(canvas) {
    const context = canvas.getContext('2d');
    const timer = new Timer(1/60);
    const camera = new Camera();
    const [entityFactory, font] = await Promise.all([
        loadEntities(),
        loadFont()
    ]);
    const loadLevel = createLevelLoader(entityFactory);
    const level = await loadLevel('1-1');    
    const mario = entityFactory.mario();
    const playerEnvironment = createPlayerEnvironment(mario);
    const input = setupKeyboard(mario);    
    
    timer.update = function update(deltaTime) {
        level.update(deltaTime);
        camera.pos.x  = Math.max(0, mario.pos.x - 100);
        level.comp.draw(context, camera);
    };

    //displayHitboxes(level); // DEBUG

    level.comp.layers.push(createDashboardLayer(font, playerEnvironment));
    level.entities.add(playerEnvironment);
    input.listenTo(window);
    timer.start();
}

const canvas = document.getElementById('screen');

main(canvas);