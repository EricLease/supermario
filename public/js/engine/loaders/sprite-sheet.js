import SpriteSheet from '../sprite-sheet.js';
import { loadJSON } from './json.js';
import { loadImage } from './image.js';
import { createAnimation } from '../animation.js';

export async function loadSpriteSheet(name, addFileExt = true) {
    return await loadSpriteSheetFromSheetSpec(
        await loadJSON(`/sprites/${name}${(addFileExt ? '.json' : '')}`));
}

export async function loadSpriteSheetFromSheetSpec(sheetSpec) {
    const image = await loadImage(sheetSpec.imageUrl);
    const sprites = new SpriteSheet(image, sheetSpec.tileW, sheetSpec.tileH);

    if (sheetSpec.tiles) {
        sheetSpec.tiles.forEach(tileSpec => {
            sprites.defineTile(tileSpec.name, tileSpec.index[0], tileSpec.index[1]);
        });
    }

    if (sheetSpec.frames) {
        sheetSpec.frames.forEach(frameSpec => {
            sprites.define(frameSpec.name, true, ...frameSpec.rect);
        });
    }

    if (sheetSpec.animations) {
        sheetSpec.animations.forEach(animSpec => {
            const animation = createAnimation(animSpec.frames, animSpec.frameLen);
            sprites.defineAnimation(animSpec.name, animation, animSpec.frames, animSpec.frameLen);
        });
    }

    return sprites;
}