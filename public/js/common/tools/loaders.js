import { loadSpriteSheetFromSheetSpec } from '../../engine/loaders/sprite-sheet.js';

export function loadClientImage(file) {
    return new Promise(resolve => {
        var reader = new FileReader();

        reader.addEventListener('load', readerLoadEvent => {
            const image = new Image();

            image.addEventListener('load', () => {
                resolve(image);
            });
            image.src = readerLoadEvent.target.result;
        });
        reader.readAsDataURL(file);
    });
}

export function loadClientSpriteSheet(file) {
    return new Promise(resolve => {
        var reader = new FileReader();
        
        reader.addEventListener('loadend', async () => {
            resolve(
                await loadSpriteSheetFromSheetSpec(
                    JSON.parse(reader.result)));
        });
        reader.readAsText(file);
    });
}