const NS = 'map-editor';
const symbol = s => Symbol.for(`${NS}.${s}`);

export default class SymbolStore {
    constructor() { throw new Error('SymbolStore is not to be instantiated'); }    
    
    static isAsync = (fn) => fn && fn[Symbol.toStringTag] === 'AsyncFunction';

    static get SystemFlag() { return symbol('system'); }
    static get DOMElementId() { return symbol('id'); }
}
