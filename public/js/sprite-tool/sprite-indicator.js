import eControl from './e-control.js';
import { getDivWithClasses } from './dom-utilities.js';
import { Vec2 } from '../engine/math.js';

const SpriteIndicatorEvents = ['moveto', 'dragging'];

function setDimensions(canvas) {
    const favorWidth = (override) => {
        if (!override && maxW * ratio > maxH) favorHeight(true);        
        else {
            canvas.style.height = 'auto';
            canvas.style.width = `${maxW}px`;
        }
    };
    const favorHeight = (override) => {
        if (!override && maxH / ratio > maxW) favorWidth(true);
        else {
            canvas.style.width = 'auto';
            canvas.style.height = `${maxH}px`;
        }
    };
    const setSmallDisplay = () => {
        favorWidth(true);  
    };
    const setLargeDisplay = () => {
        if (window.innerWidth > window.innerHeight) favorHeight();
        else favorWidth();
    };

    const lgDisplayThreshold = 767;
    const horzDiff = 27;
    const vertDiff = 16;
    const rect = canvas.getBoundingClientRect();
    const maxW = window.innerWidth - rect.left - horzDiff;
    const maxH = window.innerHeight - rect.top - vertDiff;
    const ratio = canvas.height / canvas.width;
    
    if (window.innerWidth > lgDisplayThreshold) setLargeDisplay();
    else setSmallDisplay();
}

function refreshIndicator(canvas, image, pos, dim) {
    setDimensions(canvas);

    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.strokeRect(pos.x, pos.y, dim.x, dim.y);
    ctx.stroke();
}

export default class SpriteIndicator extends eControl {
    constructor(state, image, enableResize, maxDim) {
        super(SpriteIndicatorEvents);

        this.state = state;
        this.image = image;
        this.enableResize = enableResize;
        this.maxDim = maxDim;
        this.ignore.push('image', 'enableResize', 'maxDim');
    }

    reset(pos, dim) {
        this.pos = pos;
        this.dim = dim;

        if(dim.x > this.maxDim.x) this.maxDim.x = dim.x;
        if(dim.y > this.maxDim.y) this.maxDim.y = dim.y;

        refreshIndicator(this.canvas, this.image, this.pos, this.dim);
    }

    build() {
        const moveTo = (evt, absolute) => {
            isDragging = false;

            if (dragCnt > 0) {
                dragCnt = 0; 
                return;
            }

            this.pos = new Vec2(
                absolute 
                    ? Math.floor(this.canvas.width * evt.offsetX / this.canvas.clientWidth)
                    : this.dim.x * Math.floor(
                        (this.canvas.width * evt.offsetX / this.canvas.clientWidth) / this.dim.x),
                absolute
                    ? Math.floor(this.canvas.height * evt.offsetY / this.canvas.clientHeight)
                    : this.dim.y * Math.floor(
                        (this.canvas.height * evt.offsetY / this.canvas.clientHeight) / this.dim.y));
            this.reset(this.pos, this.dim);
            this.listeners.get('moveto')
                .forEach(cb => cb({ pos: this.pos }));
            this.state.spriteDirty = true;
        };
        const dragStart = (evt) => {
            isDragging = true;
            dragCnt = 0;
            this.pos = dragStartPos = new Vec2(
                Math.floor(this.canvas.width * evt.offsetX / this.canvas.clientWidth), 
                Math.floor(this.canvas.height * evt.offsetY / this.canvas.clientHeight));
        };
        const dragging = (evt) => {
            if (!isDragging) return;

            dragCnt++;

            let w = Math.floor(this.canvas.width * evt.offsetX / this.canvas.clientWidth);
            let h = Math.floor(this.canvas.height * evt.offsetY / this.canvas.clientHeight);

            if (w > dragStartPos.x) w -= dragStartPos.x; 
            else { this.pos.x = w; w = dragStartPos.x - w; }

            if (h > dragStartPos.y) h -= dragStartPos.y; 
            else { this.pos.y = h; h = dragStartPos.y - h; }

            if (w > this.maxDim.x) w = this.maxDim.x;
            if (h > this.maxDim.y) h = this.maxDim.y;

            this.dim = new Vec2(w, h);
            this.reset(this.pos, this.dim);
            this.listeners.get('dragging').forEach(
                cb => cb({ pos: this.pos, dim: this.dim }));
            this.state.spriteDirty = true;
        };
        const col = getDivWithClasses('col', 'text-center', 'p-0');
        let isDragging = false;
        let dragStartPos, dragCnt;
        
        this.container = getDivWithClasses('row', 'bg-dark', 'mb-0', 'p-0');
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;
        
        if (this.enableResize) {
            this.listenTo(this.canvas, 'mousedown', (evt) => dragStart(evt));
            this.listenTo(this.canvas, 'mousemove', (evt) => dragging(evt));
        }
        
        this.listenTo(this.canvas, 'click', (evt) => moveTo(evt, this.enableResize));
        col.appendChild(this.canvas);
        this.container.appendChild(col);
        this.built = true;

        window.addEventListener('resize', 
            () => refreshIndicator(this.canvas, this.image, this.pos, this.dim));
    }
}