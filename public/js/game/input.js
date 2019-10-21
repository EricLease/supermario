import KeyboardState from './keyboard-state.js';

export function setupKeyboard(mario) {
    const input = new KeyboardState();
    const moveLeft = keyState => mario.go.direction += keyState ? -1 : 1;
    const moveRight = keyState => mario.go.direction += keyState ? 1 : -1 ;
    const jump = keyState => keyState ? mario.jump.start() : mario.jump.cancel();
    const sprint = keyState => mario.sprint(keyState);

    // Left/Right directional control
    input.addMapping('ArrowLeft', moveLeft);
    input.addMapping('KeyA', moveLeft);
    input.addMapping('ArrowRight', moveRight);
    input.addMapping('KeyD', moveRight);
    
    // "A" button
    input.addMapping('Space', jump);
    input.addMapping('KeyP', jump);
    
    // "B" button
    input.addMapping('ShiftLeft', sprint);
    input.addMapping('ShiftRight', sprint);
    input.addMapping('KeyO', sprint);
    
    return input;
}