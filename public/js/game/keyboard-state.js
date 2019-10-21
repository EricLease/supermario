const KeyPressed = 1;
const KeyReleased = 0;

export default class KeyboardState {
    constructor() {
        // Current state of a given key
        this.keyStates = new Map();
        // Callback when given key's state changes
        this.keyMap = new Map();
    }

    addMapping(code, callback) {
        this.keyMap.set(code, callback);
    }

    handleEvent(event) {
        const {code} = event;

        if (!this.keyMap.has(code)) return;

        event.preventDefault();

        const keyState = event.type === 'keydown' 
            ? KeyPressed : KeyReleased;

        if(this.keyStates.get(code) === keyState) return;

        this.keyStates.set(code, keyState);
        this.keyMap.get(code)(keyState);
    }

    listenTo(window) {
        ['keydown', 'keyup'].forEach(eventName => {
            window.addEventListener(eventName, event => {
                this.handleEvent(event);    
            });
        });
    }
}