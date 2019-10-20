import TileResolver from './tile-resolver.js';
import { Sides } from './entity.js';

export default class TileCollider {
    constructor(tileMatrix) {
        this.tiles = new TileResolver(tileMatrix);
    }

    checkX(entity) {
        let x;

        if(entity.vel.x > 0) {
            x = entity.bounds.right;
        } else if(entity.vel.x < 0) {
            x = entity.bounds.left;
        } else return;

        this.tiles.searchByRange(
            x, x, entity.bounds.top, entity.bounds.bottom)
            .forEach(match => {
                if(!match || match.tile.type !== 'solid') return;

                if(entity.vel.x > 0) {
                    if(entity.bounds.right > match.x1) {
                        entity.obstruct(Sides.Right, match);
                    }
                } else if(entity.vel.x < 0) {
                    if(entity.bounds.left < match.x2) {
                        entity.obstruct(Sides.Left, match);
                    }
                }
            });
    }

    checkY(entity) {
        let y;

        if(entity.vel.y > 0) {
            y = entity.bounds.bottom;
        } else if(entity.vel.y < 0) {
            y = entity.bounds.top;
        } else return;

        this.tiles.searchByRange(
            entity.bounds.left, entity.bounds.right, y, y)
            .forEach(match => {
                if(!match || match.tile.type !== 'solid') return;

                if(entity.vel.y > 0) {
                    if(entity.bounds.bottom > match.y1) {                        
                        entity.obstruct(Sides.Bottom, match);
                    }
                } else if(entity.vel.y < 0) {
                    if(entity.bounds.top < match.y2) {                        
                        entity.obstruct(Sides.Top, match);
                    }
                }
            });
    }
}