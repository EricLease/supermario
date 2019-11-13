import Modal from '../common/modal.js';
import TopMenu from './top-menu/top-menu.js';
import { dirtyCheck } from '../common/modal-utilities.js';

async function main() {
    const newFile = async (evt) => {
        if(!await dirtyCheck(modal, evt, dirty)) return;
    };
    const openFile = async (evt) => {
        if(!await dirtyCheck(modal, evt, dirty)) return;
    };
    const saveFile = async (evt) => {
        if(!await dirtyCheck(modal, evt, dirty)) return;
    };
    const saveMapAs = async (evt) => {
        if(!await dirtyCheck(modal, evt, dirty)) return;
    };
    const modal = new Modal();
    const topMenu = new TopMenu('.editor');
    let dirty = true;
    
    await topMenu.load();
    topMenu.addEventListener('newmap', async (evt) => await newFile(evt));
    topMenu.addEventListener('openmap', async (evt) => await openFile(evt));
    topMenu.addEventListener('savemap', async (evt) => await saveFile(evt));
    topMenu.addEventListener('savemapas', async (evt) => await saveMapAs(evt));
}

document.addEventListener('DOMContentLoaded', main);