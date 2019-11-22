import TileResolver from '../tile-resolver.js';
import { Vec2 } from '../math.js';

export function createBackgroundLayer(level, tiles, sprites, size) {
    const resolver = new TileResolver(tiles);
    const buffer = document.createElement('canvas');
    const context = buffer.getContext('2d');
    
    size = size || new Vec2(256 + 16, 240);
    buffer.width = size.x;
    buffer.height = size.y;

    function redraw(drawFrom, drawTo) {
        context.clearRect(0, 0, buffer.width, buffer.height);

        for (let x = drawFrom; x <= drawTo; x++) {
            const col = tiles.grid[x];

            if (col) {
                col.forEach((tile, y) => {
                    if (sprites.animations.has(tile.name)) {
                        sprites.drawAnimation(tile.name, context, x - drawFrom, y, level.totalTime);
                    } else {
                        sprites.drawTile(tile.name, context, x - drawFrom, y);
                    }
                });
            }
        }
    }

    return function drawBackgroundLayer(context, camera) {
        const drawWidth = resolver.toIndex(camera.size.x);
        const drawFrom = resolver.toIndex(camera.pos.x);
        const drawTo = drawFrom + drawWidth;
        redraw(drawFrom, drawTo);

        context.drawImage(
            buffer, 
            -camera.pos.x % 16, 
            -camera.pos.y);
    };
}