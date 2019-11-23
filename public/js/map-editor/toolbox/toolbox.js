import mControl from '../m-control.js';

const ToolboxEvents = [];

export default class Toolbox extends mControl {
    constructor(state, container) {
        super('toolbox', state, container, ToolboxEvents);
    }

    bind() {
        const fixHeight = () => {
            const ul = this.children.mainPanel.querySelector('ul');
            
            ul.style.maxHeight = ul.style.height
                = `calc(100vh - ${this.container.getBoundingClientRect().height}px)`;
        };

        this.children.toggler.addEventListener('click', () => {
            this.children.mainPanel.classList.toggle('open');
            fixHeight();
        });

        fixHeight();
    }
}