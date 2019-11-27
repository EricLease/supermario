import Toolbox from '../../toolbox.js';

export default class LayersToolbox extends Toolbox {
    constructor(layers, state, container) {
        super('layers', state, container);

        // TODO: Implement expression interpolation
        // so the repeat becomes `{{:repeat:layers.length}}`
        this.layers = layers;
        this.layerCount = this.layers.length;
    }
}