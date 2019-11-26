import Modal from '../../common/modal.js'
import mControl from '../m-control.js';

const DialogEvents = [];
const DialogPlaceholders = [];

export default class Dialog extends mControl {
    constructor (ctlName, modalOptions) {
        super(`dialogs/${ctlName}`, {}, null, DialogPlaceholders, DialogEvents);
        
        this.options = _.merge({
            header: { show: false },
            body: { show: true },
            footer: { show: false }
        }, modalOptions || {});
        this.container = document.createElement('div');
    }

    reset() {}
    
    async show(details) { 
        if (!this.state.loaded) {
            await this.load();
            this.options.body.content = this.container;
            this.modal = new Modal(this.options);
        } else {
            this.reset();
            this.modal.removeEventListener('closed');
        }
    
        this.details = details;

        return new Promise(resolve => {
            this.modal.addEventListener('closed', () => resolve(this.details));
            this.modal.show();
        });
    }
}