import mControl from '../m-control.js';

const ToolboxEvents = [];

export default class Toolbox extends mControl {
    constructor(state, container) {
        super('toolbox', state, container, ToolboxEvents);
    }

    bind() {
        const fixHeight = () => {
            const div = this.children.mainPanel;
            
            div.style.maxHeight = div.style.height
                = `calc(100vh - ${this.container.getBoundingClientRect().height}px)`;
        };

        this.children.toggler.addEventListener('click', () => {
            this.children.mainPanel.classList.toggle('open');
            fixHeight();
        });

        fixHeight();
    }
}