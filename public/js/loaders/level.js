import Level from '../level.js';
import { Matrix } from '../math.js';
import { loadJSON } from './json.js';
import { loadSpriteSheet } from './sprite-sheet.js';
import { createSpriteLayer, createBackgroundLayer } from '../layers.js';

function setupCollision(levelSpec, level) {
    const mergedTiles = levelSpec.layers.reduce(
        (mergedTiles, layerSpec) => {
            return mergedTiles.concat(layerSpec.tiles);
        }, []);

    level.setCollisionGrid(
        createCollisionGrid(mergedTiles, levelSpec.patterns)); 
}

function setupBackgrounds(levelSpec, level, backgroundTiles) {
    levelSpec.layers.forEach(layer => {
        level.comp.layers.push(
            createBackgroundLayer(
                level, 
                createBackgroundGrid(
                    layer.tiles, 
                    levelSpec.patterns),
                backgroundTiles));        
    })
}

function setupEntities(levelSpec, level, entityFactory) {
    levelSpec.entities.forEach(({name, pos: [x, y]}) => {
         const createEntity = entityFactory[name];
         const entity = createEntity();

         entity.pos.set(x, y);
         level.entities.add(entity);
    });
    
    level.comp.layers.push(createSpriteLayer(level.entities));
}

function createCollisionGrid(tiles, patterns) {
    return createGrid(tiles, patterns, 'type');
}

function createBackgroundGrid(tiles, patterns) {
    return createGrid(tiles, patterns, 'name');
}

function createGrid(tiles, patterns, key) {
    const grid = new Matrix();

    for(const { tile, x, y } of expandTiles(tiles, patterns)) {
        const obj = {};

        obj[key] = tile[key];
        grid.set(x, y, obj);
    }

    return grid;
}

function* expandSpan(xStart, xLen, yStart, yLen) {
    const xEnd = xStart + xLen;
    const yEnd = yStart + yLen;

    for(let x = xStart; x < xEnd; x++) {
        for(let y = yStart; y < yEnd; y++) {
            yield {x, y};
        }
    }
}

function expandRange(range) {
    if (range.length === 4) {
        const [xStart, xLen, yStart, yLen] = range;
        return expandSpan(xStart, xLen, yStart, yLen);
    }
    
    if (range.length === 3) {
        const [xStart, xLen, yStart] = range;
        return expandSpan(xStart, xLen, yStart, 1);
    } 
    
    if (range.length === 2) {
        const [xStart, yStart] = range;
        return expandSpan(xStart, 1, yStart, 1);
    } 
}

function* expandRanges(ranges) {
    for (const range of ranges) {
        yield* expandRange(range);
    }
}

function* expandTiles(tiles, patterns) {
    function* walkTiles(tiles, offsetX, offsetY) {
        for(const tile of tiles) {
            for (const {x, y} of expandRanges(tile.ranges)) {
                const derivedX = x + offsetX;
                const derivedY = y + offsetY;

                if (tile.pattern) {
                    const pTiles = patterns[tile.pattern].tiles;
                    yield* walkTiles(pTiles, derivedX, derivedY);
                } else {
                    yield {
                        tile,
                        x: derivedX, 
                        y: derivedY
                    };
                }
            }
        }
    }

    yield* walkTiles(tiles, 0, 0);
}

export function createLevelLoader(entityFactory) {
    return async function loadLevel(name) {
        const levelSpec = await loadJSON(`/levels/${name}.json`);
        const backgroundTiles = await loadSpriteSheet(levelSpec.spriteSheet);
        const level = new Level();

        setupCollision(levelSpec, level);
        setupBackgrounds(levelSpec, level, backgroundTiles);
        setupEntities(levelSpec, level, entityFactory);

        return level;
    };
}