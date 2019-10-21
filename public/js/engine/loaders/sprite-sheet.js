import SpriteSheet from '../sprite-sheet.js';
import { loadJSON } from './json.js';
import { loadImage } from './image.js';
import { createAnimation } from '../animation.js';

export async function loadSpriteSheet(name) {
    const sheetSpec = await loadJSON(`/sprites/${name}.json`);
    const image = await loadImage(sheetSpec.imageUrl);
    const sprites = new SpriteSheet(image, sheetSpec.tileW, sheetSpec.tileH);

    if (sheetSpec.tiles) {
        sheetSpec.tiles.forEach(tileSpec => {
            sprites.defineTile(tileSpec.name, tileSpec.index[0], tileSpec.index[1]);
        });
    }

    if (sheetSpec.frames) {
        sheetSpec.frames.forEach(frameSpec => {
            sprites.define(frameSpec.name, ...frameSpec.rect);
        });
    }

    if (sheetSpec.animations) {
        sheetSpec.animations.forEach(animSpec => {
            const animation = createAnimation(animSpec.frames, animSpec.frameLen);
            sprites.defineAnimation(animSpec.name, animation);
        });
    }

    return sprites;
}