import $$ from '../../common/symbol-store.js';
import { getElementWithClasses } from '../../common/dom-utilities.js';
import { Vec2 } from '../math.js';

export function createTileGridLayer(size, tileSize, base) {
    const buffer = getElementWithClasses('canvas', 'screen');
    const context = buffer.getContext('2d');
    
    size = size || new Vec2(256 + 16, 240);
    tileSize = tileSize || new Vec2(16, 16);
    buffer.width = size.x;
    buffer.height = size.y;
    
    function redrawBase(camera) {
        context.clearRect(0, 0, buffer.width, buffer.height);
        context.save();
        context.strokeStyle = 'rgba(0, 0, 0, .5)';
        
        for (let x = tileSize.x - (camera.pos.x % tileSize.x) - 1; x <= size.x; x += tileSize.x) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, size.y - 1);
            context.stroke();
        }

        for (let y = tileSize.y - (camera.pos.y % tileSize.y) - 1; y <= size.y; y += tileSize.y) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(size.x - 1, y);
            context.stroke();
        }

        context.restore();
    }

    function redrawOverlay(camera, srcContext) {
        const rowSize = size.x * 4;
        const srcData = srcContext
            .getImageData(0, 0, buffer.width, buffer.height)
            .data;
        let skipRow = tileSize.y - 1;
        let tgtImgData, tgtData;
        const invertPixel = (yOffset, x) => {
            const color = ([0, 1, 2].reduce((p, c) => p + srcData[yOffset + x + c], 0) / 3) > 127
                ? 0 : 255;

            [0, 1, 2].forEach(c => tgtData[yOffset + x + c] = color);
            tgtData[yOffset + x + 3] = color * .5 + 50;
        };
        const invertLines = (xs, xe, xstep, ys, ye, ystep) => {
            for (let x = xs; x <= xe; x += xstep) {
                for (let y = ys; y <= ye; y += ystep) {
                    // prevent double inversion where grid lines cross
                    if (y % tileSize.y === skipRow) continue;
    
                    invertPixel(rowSize * y, x);
                }
            }
        };
        
        context.clearRect(0, 0, buffer.width, buffer.height);      
        
        tgtImgData = context.getImageData(0, 0, buffer.width, buffer.height);
        tgtData = tgtImgData.data;
        invertLines((tileSize.x - (camera.pos.x % tileSize.x) - 1) * 4, 
            rowSize - 4, tileSize.x * 4, 0, size.y - 1, 1);
        skipRow = null;
        invertLines(0, (size.x - 1) * 4, 4, 
            tileSize.y - (camera.pos.y % tileSize.y) - 1, size.y, tileSize.y);
        context.putImageData(tgtImgData, 0, 0);
    }

    const drawFn = base ? redrawBase : redrawOverlay;
    const layer = function drawTileGridLayer(context, camera) {
        drawFn(camera, context);
        context.drawImage(buffer, 0, 0);
    };

    layer[$$.SystemFlag] = true;

    return layer;
}