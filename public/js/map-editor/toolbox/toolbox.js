import mControl from '../m-control.js';

const ToolboxEvents = [];
const ToolboxPlaceholders = ['MainContent'];

export default class Toolbox extends mControl {
    constructor(type, state, container) {
        super('toolbox', state, container, ToolboxPlaceholders, ToolboxEvents);

        this.placeholders.set('MainContent', {
            name: type,
            path: `toolbox/toolboxes/${type}`
        });
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