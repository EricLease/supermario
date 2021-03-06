export function createSpriteLayer(entities, width = 64, height = 64) {
    const spriteBuffer = document.createElement('canvas');
    spriteBuffer.width = width; // MAX SPRITE WIDTH
    spriteBuffer.height = height; // MAX SPRITE HEIGHT

    const spriteContext = spriteBuffer.getContext('2d');
    
    return function drawSpriteLayer(context, camera) { 
        entities.forEach(entity => {
            spriteContext.clearRect(0, 0, width, height)
            entity.draw(spriteContext);
            context.drawImage(
                spriteBuffer,
                entity.pos.x - camera.pos.x,
                entity.pos.y - camera.pos.y)
        })
    };
}