import eControl from './e-control.js';
import { 
    buildStaticLists, 
    buildAnimationList, 
    buildEditPanel, 
    buildEditPanelListContainerClass, 
    buildEditPanelCollapseButtonContent } from './builders.js';
import { ItemType, getItemTypeName } from './item-type.js';
import { findParent, getDivWithClasses } from './dom-utilities.js';
import { guid } from './guid.js';

const SpriteListEvents = ['add', 'click', 'change'];

function findListItem(elem) {
    for (; elem && elem !== document; elem = elem.parentNode ) {
        if (elem.matches('li') && 
            elem.dataset && 
            elem.dataset.itemType) return elem;
        //if (elem.matches('li[data-item-type]')) return elem;
    }

    return null;
}

async function itemClick(evt) {
    const li = findListItem(evt.target);

    if (!li) {
        console.error('Could not find <li> associated with edit panel item');

        return;
    }

    const itemType = parseInt(li.dataset.itemType);
    let cancel = false;
    
    this.listeners.get('click').forEach(cb => { 
        let evt = { 
            cancel: false,
            itemName: li.dataset.itemName,
            itemType: itemType
        }; 
        cb(evt); 
        cancel = evt.cancel || cancel; 
    });

    if (cancel) return;

    const prev = document.querySelector('li.selected');
    
    if (prev !== li) {
        cancel = false;

        const promises = [];

        this.listeners.get('change').forEach(cb => {
            promises.push((async () => {
                const evt = { 
                    cancel: false,
                    itemName: li.dataset.itemName, 
                    itemType: itemType 
                }; 
    
                await cb(evt); 
                cancel = evt.cancel || cancel; 
            })());
        });

        await Promise.all(promises);

        if (cancel) return;

        if (prev) prev.classList.remove('selected');

        li.classList.add('selected');
    }
}

export default class SpriteList extends eControl {
    constructor(state, sprites) {
        super(SpriteListEvents);

        this.state = state;
        this.sprites = sprites;
        this.ignore.push('sprites');
    }

    update(evt) {
        let list;

        switch(evt.itemType) {
            case ItemType.Tile:
            case ItemType.Frame:
                const [tiles, frames] = buildStaticLists(this.sprites);

                list = evt.itemType === ItemType.Tile ? tiles : frames;
                break;
                
            case ItemType.Animation:
                list = buildAnimationList(this.sprites);
                break;

            default: 
                console.warn(`Invalid ItemType (${evt.itemType}) in update()`);
                return;
        }

        const type = getItemTypeName(evt.itemType);
        const ul = this.container.querySelector(
            `.${buildEditPanelListContainerClass(type)}-${this.containerClass} ul`);
        const lis = ul.querySelectorAll('li');

        lis.forEach(li => {
            this.ignoreEvent(li.dataset.listeningId);
            li.remove();
        });

        const prevLi = this.container.querySelector('li.selected');
        const prevPnl = this.container.querySelector('div.collapse.show');

        if (prevLi) prevLi.classList.remove('selected');
        if (prevPnl) prevPnl.classList.remove('show');

        findParent(ul, '.card').querySelector('h5 button')
            .innerHTML = buildEditPanelCollapseButtonContent(`${type}s`, list.length);
        findParent(ul, `.${buildEditPanelListContainerClass(type)}-${this.containerClass}`)
            .classList.add('show');

        list.forEach(li => {
            const el = li.li ? li.li : li;

            if (el.dataset.itemName === evt.itemName) {
                el.classList.add('selected');

                setTimeout(() => el.scrollIntoView());
            }

            el.dataset.listeningId = this.listenTo(
                el, 'click', (evt) => itemClick.call(this, evt));
            ul.appendChild(el);

            if (li.start) li.start();
        });
    }

    build() {
        const setEditPanelMaxHeight = () => {
            setTimeout(() => { 
                let diff = this.container.getBoundingClientRect().top + 19;
        
                document.querySelectorAll('.card-header')
                    .forEach(h => diff += h.clientHeight);
                document.querySelectorAll('.card-body')
                    .forEach(b => b.style.maxHeight = `calc(100vh - ${diff}px)`);
            });
        };
        const clickCb = (evt) => itemClick.call(this, evt);
        const addCb = (evt) => {
            let cancel = false;
    
            this.listeners.get('add').forEach(cb => { 
                let e = { 
                    cancel: false,
                    itemType: parseInt(evt.target.dataset.itemType)
                }; 
                cb(e); 
                cancel = e.cancel || cancel; 
            });
    
            if (cancel) return;
    
            const prev = this.container.querySelector('li.selected');
    
            if (!prev) return;
            
            prev.classList.remove('selected');
        }
        const [tiles, frames] = buildStaticLists(this.sprites);
        const animations = buildAnimationList(this.sprites);

        this.containerClass = `_${guid()}`;
        this.container = getDivWithClasses('accordion', this.containerClass);

        const staticOpts = { 
            containerClass: this.containerClass, 
            clickCb: clickCb,
            addCb: addCb, 
            expand: true, 
            setMaxHeight: false 
        };

        if (this.sprites.width && this.sprites.height) {
            buildEditPanel(this, tiles, ItemType.Tile, staticOpts);
        } else {
            buildEditPanel(this, frames, ItemType.Frame, staticOpts);
        }
        
        buildEditPanel(this, animations, ItemType.Animation, { 
            containerClass: this.containerClass, 
            clickCb: clickCb, 
            addCb: addCb 
        });
        animations.forEach(a => a.start());
        setEditPanelMaxHeight();
        this.built = true;
    }
}