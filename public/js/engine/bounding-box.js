export default class BoundingBox {
    constructor(name, pos, size, offset) {
        this.entityName = name;
        this.pos = pos;
        this.size = size;
        this.offset = offset;
    }

    overlaps(box) {
        return this.bottom > box.top 
            && this.top < box.bottom 
            && this.left < box.right 
            && this.right > box.left;
    }

    get top() {
        return this.pos.y + this.offset.y;
    }

    set top(y) {        
        this.pos.y = y - this.offset.y;
    }

    get bottom() {
        return this.pos.y + this.offset.y + this.size.y;
    }

    set bottom(y) {
        this.pos.y = y - (this.size.y + this.offset.y);
    }

    get left() {
        return this.pos.x + this.offset.x;
    }

    set left(x) {
        this.pos.x = x - this.offset.x;
    }

    get right() {
        return this.offset.x + this.pos.x + this.size.x;
    }

    set right(x) {
        this.pos.x = x - (this.size.x + this.offset.x);
    }
}