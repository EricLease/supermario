export default class Compositor {
    constructor() {
        this.layers = [];
    }

    draw(context, camera) {
        this.layers.forEach(async layer =>
            layer[Symbol.toStringTag] === 'AsyncFunction'
                ? await layer(context, camera)
                : layer(context, camera));
    }
}