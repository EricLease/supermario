import mControl from '../m-control.js';

const TopMenuEvents = ['newmap', 'openmap', 'savemap', 'savemapas'];

export default class TopMenu extends mControl {
    constructor(container) { 
        super('top-menu', container, TopMenuEvents); 
    }

    bind() {
        const newMap = async () => {
            let cancel = false;

            this.listeners.get('newmap').forEach(async cb => {
                if (cancel) return;

                const evt = { cancel: false };

                await cb(evt);
                cancel = evt.cancel || cancel;
            });
        };
        const openMap = async () => {};
        const saveMap = async () => {};
        const saveMapAs = async () => {};
        const height = this.container
            .querySelector('nav')
            .getBoundingClientRect()
            .height;

        document.body.style.marginTop = `${height}px`;
        this.container
            .querySelector('a.new-map')
            .addEventListener('click', async () => await newMap());
        this.container
            .querySelector('a.open-map')
            .addEventListener('click', async () => await openMap());
        this.container
            .querySelector('a.save-map')
            .addEventListener('click', async () => await saveMap());
        this.container
            .querySelector('a.save-map-as')
            .addEventListener('click', async () => await saveMapAs());        
        this.listeners.get('bound').forEach(cb => cb());
    }
}