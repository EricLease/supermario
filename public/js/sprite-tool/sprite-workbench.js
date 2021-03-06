import eControl from '../common/e-control.js';
import { bsHide, bsShow } from '../common/dom-utilities.js';

const SpriteWorkbenchEvents = ['spritesupdated', 'canceladd'];

export default class SpriteWorkbench extends eControl {
    constructor(...events) {
        super(SpriteWorkbenchEvents, ...events);
    }

    reset(evt) {
        console.warn('Override reset() in class that inherits SpriteWorkbench');
    }

    cleanup() {}
    open() { bsShow(this.container); }
    close() { bsHide(this.container); }
}