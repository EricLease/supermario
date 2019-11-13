export const ItemType = {
    Tile: 0,
    Frame: 1,
    Animation: 2
};

export function getItemTypeName(itemType, opts) {    
    let name;

    opts = opts || {};
    
    switch(parseInt(itemType)) {
        case ItemType.Tile: name = 'Tile'; break;
        case ItemType.Frame: name = 'Frame'; break;
        case ItemType.Animation: name = 'Animation'; break;
        default: 
            console.warn(`Unknown ItemType (${itemType}) @ getItemTypeName()`);
            return `UnknownType (${itemType})`;
    }

    if (opts.plural) name += 's';
    if (opts.toLower) name = name.toLowerCase();

    return name;
}