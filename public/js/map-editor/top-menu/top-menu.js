import mControl from '../m-control.js';

const TopMenuEvents = ['newmap', 'openmap', 'savemap', 'savemapas', 'closemap'];
const TopMenuPlaceholders = [];

export default class TopMenu extends mControl {
    constructor(state, container) { 
        super('top-menu', state, container, TopMenuPlaceholders, TopMenuEvents);
    }

    bind() {
        const enableSaveClose = () => {
            const children = [this.children.saveMap, this.children.saveMapAs, this.children.closeMap];

            if (this.state.fileOpen) children.forEach(c => c.classList.remove('disabled'));
            else children.forEach(c => c.classList.add('disabled'));
        };
        const raise = async (evtName) => {
            if (!await this.raiseAsync(evtName)) return;
            enableSaveClose();
        };
        const fixHeight = () => {
            const div = this.children.content;
            const navH = `${this.children.navBar.getBoundingClientRect().height}px`;
            
            div.style.maxHeight = div.style.height = `calc(100vh - ${navH})`;
            document.body.style.marginTop = navH;
        };
        
        this.children.newMap
            .addEventListener('click', async () => await raise('newmap'));
        this.children.openMap
            .addEventListener('click', async () => await raise('openmap'));
        this.children.saveMap
            .addEventListener('click', async () => await raise('savemap'));
        this.children.saveMapAs
            .addEventListener('click', async () => await raise('savemapas'));
        this.children.closeMap
            .addEventListener('click', async () => await raise('closemap'));
        this.children.toggler.addEventListener('click', () => {
            this.children.content.classList.toggle('open');
            fixHeight();
        });

        fixHeight();
    }
}