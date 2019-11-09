import eControl from './e-control.js';
import { getDivWithClasses } from './dom-utilities.js';

const SpriteIndicatorEvents = [];

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
    constructor(state, image) {
        super(SpriteIndicatorEvents);

        this.state = state;
        this.image = image;
        this.ignore.push('image');
    }

    reset(pos, dim) {
        this.pos = pos;
        this.dim = dim;

        refreshIndicator(this.canvas, this.image, this.pos, this.dim);
    }

    build() {
        const col = getDivWithClasses('col', 'text-center', 'p-0');

        this.container = getDivWithClasses('row', 'bg-dark', 'mb-0', 'p-0');
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;
        col.appendChild(this.canvas);
        this.container.appendChild(col);
        this.built = true;

        window.addEventListener('resize', 
            () => refreshIndicator(this.canvas, this.image, this.pos, this.dim));
    }
}