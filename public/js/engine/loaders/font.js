import SpriteSheet from '../sprite-sheet.js'
import { loadImage } from './image.js';

const FontCharacters = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

class Font {
    constructor(sprites, size) {
        this.sprites = sprites;
        this.size = size;
    }

    print(text, context, x, y) {
        [...text].forEach((char, pos) => {
            this.sprites.draw(char, context, x + pos * this.size, y);
        });
    }
}

export async function loadFont() {
    const image = await loadImage('./assets/font.png');
    const sprites = new SpriteSheet(image);

    const size = 8; // character width
    const rowLen = image.width;
    
    for (let [index, char] of [...FontCharacters].entries()) {
        const x = index * size % rowLen;
        const y = Math.floor(index * size / rowLen) * size;

        sprites.define(char, false, x, y, size, size);
    }

    return new Font(sprites, size);
}