import $$ from '../common/symbol-store.js';

export default class Compositor {
    constructor() {
        this.layers = [];
    }

    draw(context, camera) {
        this.layers.forEach(async layer =>
            $$.isAsync(layer)
                ? await layer(context, camera)
                : layer(context, camera));
    }
}