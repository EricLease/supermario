import { Vec2 } from '../engine/math.js';

function getSpritePair(image, pos, dim) {
    return [false, true].map(flip => {
        const buffer = document.createElement('canvas');
        
        buffer.width = dim.x;
        buffer.height = dim.y;

        const context = buffer.getContext('2d');
        
        if (flip) {
            context.scale(-1, 1);
            context.translate(-dim.x, 0);
        }

        context.drawImage(image, pos.x, pos.y, dim.x, dim.y, 0, 0, dim.x, dim.y);

        return buffer;
    });
}

export default class SpriteSheet {
    constructor(image, width, height) {
        this.image = image;
        this.width = width;
        this.height = height;
        this.tiles = new Map();
        this.tileMetas = new Map();
        this.animations = new Map();
        this.animationMetas = new Map();
    }

    defineAnimation(name, animation, frames, frameLen) {
        this.animations.set(name, animation);
        this.animationMetas.set(name, {
            name: name, 
            frames: frames, 
            frameLen: frameLen 
        });
    }

    define(name, isFrame, x, y, width, height) {
        const buffers = getSpritePair(
            this.image, 
            new Vec2(x, y), 
            new Vec2(width, height));

        this.tiles.set(name, buffers);
        this.tileMetas.set(name, { 
            name, 
            x, y, 
            width, height, 
            isFrame: isFrame
        });
    }

    defineTile(name, x, y) {
        this.define(
            name, false,
            x * this.width, 
            y * this.height, 
            this.width, 
            this.height);
    }

    draw(name, context, x, y, flip = false) {
        const buffer = this.tiles.get(name)[flip ? 1 : 0];
        
        context.drawImage(buffer, x, y);
    }

    drawAnimation(name, context, x, y, distance) {
        const animation = this.animations.get(name);

        this.drawTile(animation(distance), context, x, y);
    }

    drawTile(name, context, x, y) {
        this.draw(name, context, x * this.width, y * this.height);
    }

    get imageUrl() {  return this.image.src; }

    get displayImageUrl() {
        return this.image.src.startsWith('data:image')
            ? '[embedded]' 
            : this.image.src.split(location.origin)[1];
    }

    export() {
        let output = { imageUrl: this.imageUrl }

        if (this.width) output.tileW = this.width;
        if (this.height) output.tileH = this.height;

        if(this.tiles.size) {
            const frames = [];
            const tiles = [];

            debugger;
            for (const [name, { isFrame, x, y, width, height }] of this.tileMetas.entries()) {
                if (isFrame) {
                    frames.push({ name: name, rect: [x, y, width, height] });
                } else {
                    // TODO: account for errors (xOffset/yOffset) in tile sprite images
                    // -> make json data pixel based, and convert to tile coords on load
                    tiles.push({ name: name, index: [x / width, y / height] });
                }
            }

            if (frames.length) output.frames = frames;
            if (tiles.length) output.tiles = tiles;
        }

        if(this.animations.size) {
            output.animations = [];
                
            for (const [name, { frameLen, frames }] of this.animationMetas.entries()) {
                output.animations.push({
                    name: name,
                    frameLen: frameLen,
                    frames: frames
                });
            }
        }

        return output;
    }
}