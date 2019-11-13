import Timer from '../engine/timer.js';
import { guid } from '../common/guid.js';
import { 
    getDivWithClasses, 
    getButtonWithClasses, 
    getElementWithClasses } from '../common/dom-utilities.js';
import { ItemType, getItemTypeName } from '../common/item-type.js';
import { setDataTransferData } from '../common/drag-and-drop-utilities.js';

export function buildStaticListItem(tileMeta, sprites, scale = 1) {
    const li = getElementWithClasses('li', 'tile-detail', 'text-truncate');            
    const row = getDivWithClasses('row');
    const leftCol = getDivWithClasses('col', 'compact');
    const rightCol = getDivWithClasses('col');
    const c = document.createElement('canvas');
    const s = document.createElement('span');
    
    leftCol.appendChild(c);
    rightCol.appendChild(s);
    row.appendChild(leftCol);
    row.appendChild(rightCol);
    li.appendChild(row);
    
    li.dataset.itemType = tileMeta.isFrame 
        ? ItemType.Frame : ItemType.Tile;
    li.dataset.itemName = tileMeta.name;        
    s.innerText = tileMeta.name;
    c.width = tileMeta.width;
    c.height = tileMeta.height;
    c.style.width = `${c.width * scale}px`;
    c.style.height = `${c.height * scale}px`;
    c.style.border = '1px solid black';
    sprites.draw(tileMeta.name, c.getContext('2d'), 0, 0);
        
    return li;
}

export function buildStaticLists(sprites, scale = 1) {
    const tiles = [];
    const frames = [];

    sprites.tileMetas.forEach(tileMeta => {
        const li = buildStaticListItem(tileMeta, sprites, scale);
            
        tileMeta.isFrame ? frames.push(li) : tiles.push(li);
    });

    return [tiles, frames];
}

export function buildAnimationListItem(animationMeta, sprites, scale = 1) {
    const li = getElementWithClasses('li', 'tile-detail', 'text-truncate');
    const row = getDivWithClasses('row');
    const leftCol = getDivWithClasses('col', 'compact');
    const rightCol = getDivWithClasses('col');
    const c = document.createElement('canvas');
    const s = document.createElement('span');
    const animation = sprites.animations.get(animationMeta.name);
    let lifetime = 0;
    
    li.dataset.itemType = ItemType.Animation;
    li.dataset.itemName = animationMeta.name;
    leftCol.appendChild(c);
    rightCol.appendChild(s);
    row.appendChild(leftCol);
    row.appendChild(rightCol);
    li.appendChild(row);

    s.innerText = animationMeta.name;
    
    function updateLi(deltaTime) {
        const tileName = animation(lifetime += deltaTime);
        const tileMeta = sprites.tileMetas.get(tileName);
        
        if (!tileMeta) return;

        c.width = tileMeta.width;
        c.height = tileMeta.height;
        c.style.width = `${c.width * scale}px`;
        c.style.height = `${c.height * scale}px`;
        c.style.border = '1px solid black';
        sprites.draw(tileName, c.getContext('2d'), 0, 0);
    }

    const timer = new Timer(1/60);
    timer.update = updateLi;
        
    return {
        li: li,
        start: () => { timer.start(); },
        stop: () => { timer.pause(); }
    };
}

export function buildAnimationList(sprites, scale = 1) {
    const animations = [];

    sprites.animationMetas.forEach(animationMeta => 
        animations.push(
            buildAnimationListItem(animationMeta, sprites, scale)));

    return animations;
}

export const buildEditPanelListContainerClass = (type) => `edit-${type}`;
export const buildEditPanelCollapseButtonContent = (label, count) => `${label} (${count || 0})`;
export function buildEditPanel(eControl, list, itemType, opts) {
    const setMaxHeight = () => {
        setTimeout(() => { 
            let diff = opts.container.getBoundingClientRect().top + 19;
    
            opts.container.querySelectorAll('.card-header')
                .forEach(h => diff += h.clientHeight);
            opts.container.querySelectorAll('.card-body')
                .forEach(b => b.style.maxHeight = `calc(100vh - ${diff}px)`);
        });
    };

    opts = opts || {};

    if (typeof opts.enableAdd === 'undefined') opts.enableAdd = true;
    if (typeof opts.enableClick === 'undefined') opts.enableClick = true;
    if (typeof opts.enableDrag === 'undefined') opts.enableDrag = false;
    if (typeof opts.enableDrop === 'undefined') opts.enableDrop = false;
    if (typeof opts.expand === 'undefined') opts.expand = false;
    if (typeof opts.clickCb === 'undefined') opts.clickCb = () => {};
    if (typeof opts.addCb === 'undefined') opts.addCb = () => {};
    if (typeof opts.dropCb === 'undefined') opts.dropCb = () => {};
    if (typeof opts.container === 'undefined') opts.container = eControl.container;
    if (typeof opts.containerClass === 'undefined') opts.containerClass = `_${guid()}`;
    if (typeof opts.setMaxHeight === 'undefined') opts.setMaxHeight = true;
    if (typeof opts.collapsible === 'undefined') opts.collapsible = true;
    if (typeof opts.contextId === 'undefined') opts.contextId = opts.containerClass;

    const panel = getDivWithClasses('card');
    const header = getDivWithClasses('mb-0', 'card-header');
    const h5 = getElementWithClasses('h5', 'mb-0', 'float-left');
    const type = getItemTypeName(itemType);
    let listContainer;
    const listCardBody = getDivWithClasses('card-body');
    const ul = getElementWithClasses('ul', 'edit-list');

    if (opts.collapsible) {
        const listContainerClass = `${buildEditPanelListContainerClass(type)}-${opts.containerClass}`;
        const btnCollapse = getButtonWithClasses(null, 'btn', 'btn-link');
    
        btnCollapse.innerHTML = buildEditPanelCollapseButtonContent(opts.label || `${type}s`, list.length);
        btnCollapse.dataset.toggle = 'collapse';
        btnCollapse.dataset.target = `.${listContainerClass}`;    
        h5.appendChild(btnCollapse);
        listContainer = getDivWithClasses('collapse', listContainerClass);

        if (!opts.expand || !list.length) btnCollapse.classList.add('collapsed');
    } else {
        const panelHeader = getElementWithClasses('span', 'text-primary');

        panelHeader.innerText = buildEditPanelCollapseButtonContent(opts.label || `${type}s`, list.length);
        h5.appendChild(panelHeader);
        listContainer = document.createElement('div');
    }

    header.appendChild(h5);
    
    if (opts.enableAdd) {
        const btnAdd = getButtonWithClasses(null, 'btn', 'btn-outline-success', 'float-right');
        btnAdd.innerHTML = `Add ${type}`
        btnAdd.dataset.itemType = ItemType[type];
        btnAdd.addEventListener('click', opts.addCb);
        header.appendChild(btnAdd);
    }

    panel.appendChild(header);

    if (opts.expand && list.length) listContainer.classList.add('show');
    
    opts.container.classList.add(opts.containerClass);
    listContainer.dataset.parent = `.${opts.containerClass}`;
    list.forEach(li => {
        const el = li.li ? li.li : li;

        if (opts.enableClick) {
            el.dataset.listeningId = eControl.listenTo(
                el, 'click', opts.clickCb);
        }

        if (opts.enableDrag) {
            el.setAttribute('draggable', true);
            el.dataset.dragId = eControl.listenTo(
                el, 'dragstart', 
                (evt) => {
                    evt.dataTransfer.clearData();
                    setDataTransferData(
                        evt, 
                        evt.target.dataset.dragId, 
                        opts.contextId);
                });
        }

        if (opts.enableDrop) {
            el.dataset.dropId = eControl.listenTo(el, 'drop', opts.dropCb);
            el.dataset.dragOverId = eControl.listenTo(el, 'dragover', (evt) => evt.preventDefault());
        }

        ul.appendChild(el);
    });
    listCardBody.appendChild(ul);
    
    if (opts.enableDrop) {
        listCardBody.dataset.dragOverId = eControl.listenTo(listCardBody, 'dragover', (evt) => evt.preventDefault());
        listCardBody.dataset.dropId = eControl.listenTo(listCardBody, 'drop', opts.dropCb);
    }

    listContainer.appendChild(listCardBody);
    panel.appendChild(listContainer);
    opts.container.appendChild(panel);

    if (opts.setMaxHeight) setMaxHeight();
}