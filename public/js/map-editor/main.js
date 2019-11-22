import Modal from '../common/modal.js';
import TopMenu from './top-menu/top-menu.js';
import Level from '../engine/level.js';
import NewMapDialog from './dialogs/new-map/new-map.js';
import Screen from './screen/screen.js';
import { dirtyCheck } from '../common/modal-utilities.js';
import { getInputWithClasses, extractFiles } from '../common/dom-utilities.js';
import { loadJSON, loadSpriteSheet } from '../engine/loaders.js';

function blankLevelSpec(spriteSheet) {
    return {
        spriteSheet: spriteSheet,
        patterns: {},
        layers: [{
            description: 'Base layer',
            tiles: []
        }],
        entities: []
    };
}

async function main() {
    const newMap = async (evt) => {
        if (!await dirtyCheck(modal, evt, state.dirty)) return;
        
        await newMapDialog.show(evt);

        if (evt.cancel) return;

        clearMap();
        state.dirty = true;
        state.fileOpen = true;
        mapName = evt.mapName;
        level = new Level();        
        levelSpec = blankLevelSpec(
            evt.spriteSheetName.split('.')[0]);
        sprites = evt.sprites;
        screen = new Screen(state, '.editor', level, levelSpec, sprites);
        await screen.load();
        screen.start();
    };
    const openMap = async (evt) => {
        const mapSelect = async () => {
            return new Promise(resolve => {
                const input = getInputWithClasses('file', 'file-input');
                
                input.setAttribute('accept', '.json');
                input.addEventListener('change', async (evt) => {
                    const loadlist = extractFiles(evt, /application\/json/);
                        
                    if (loadlist.length === 0) return;

                    clearMap();
                    state.fileOpen = true;
                    mapName = loadlist[0].name;
                    level = new Level();
                    levelSpec = await loadJSON(`/levels/${mapName}`);
                    sprites = await loadSpriteSheet(levelSpec.spriteSheet);            
                    screen = new Screen(state, '.editor', level, levelSpec, sprites);
                    await screen.load();
                    screen.start();
                    resolve();
                });
                input.click();
            });
        };

        if (!await dirtyCheck(modal, evt, state.dirty)) return;
        
        await mapSelect();
    };
    const saveMap = async (evt) => {
        if (!await dirtyCheck(modal, evt, state.dirty)) return;

        state.dirty = false;
    };
    const saveMapAs = async (evt) => {
        if (!await dirtyCheck(modal, evt, state.dirty)) return;

        state.dirty = false;
    };
    const closeMap = async (evt) => {
        if (!await dirtyCheck(modal, evt, state.dirty)) return;

        clearMap();
    };
    const clearMap = () => {
        if (!state.fileOpen) return;

        level = null;
        levelSpec = null;
        sprites = null;
        mapName = null;
        screen.stop();
        screen.unload();
        screen = null;
        state.dirty = false;
        state.fileOpen = false;
    };
    const state = {
        dirty: false,
        fileOpen: false
    };
    const modal = new Modal();
    const topMenu = new TopMenu(state, '.editor');
    const newMapDialog = new NewMapDialog();
    let level, levelSpec, mapName, sprites, screen;

    await topMenu.load();
    topMenu.addEventListener('newmap', async (evt) => await newMap(evt));
    topMenu.addEventListener('openmap', async (evt) => await openMap(evt));
    topMenu.addEventListener('savemap', async (evt) => await saveMap(evt));
    topMenu.addEventListener('savemapas', async (evt) => await saveMapAs(evt));
    topMenu.addEventListener('closemap', async (evt) => await closeMap(evt));
}

document.addEventListener('DOMContentLoaded', main);