import { ItemType } from '../common/item-type.js';

function mockTileMeta(w, h, itemType) {
    w = w || 16;
    h = h || 16;

    return {
        name: '',
        x: 0, y: 0,
        width: w, height: h,
        isFrame: itemType === ItemType.Frame
    }
}

export function getTileMetaOrDefault(sprites, itemType, itemName) {
    return sprites.tileMetas.get(itemName) || 
        mockTileMeta(sprites.width, sprites.height, itemType);
}

function mockAnimationMeta() {
    return {
        name: '',
        frames: [],
        frameLen: 1
    }
}

export function getAnimationMetaOrDefault(sprites, itemName) {
    return sprites.animationMetas.get(itemName) || mockAnimationMeta();
}