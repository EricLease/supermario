import SheetSelection from './sheet-selection.js';
import SheetEditor from './sheet-editor.js';

function main() {
    function selectSheet() {
        if (sheetEditor) {
            sheetEditor.dispose();
            sheetEditor = null;
        }
        
        sheetSelection = new SheetSelection();
        sheetSelection.addEventListener('sheetselected', sheetSelected, { once: true });
        sheetSelection.attach('#tool');
    }

    function sheetSelected(e) {
        sheetSelection.dispose();
        sheetSelection = null;
        sheetEditor = new SheetEditor(e.fileName, e.sprites, e.new);
        sheetEditor.attach('#tool');
        sheetEditor.addEventListener('done', selectSheet, { once: true });
    }

    let sheetSelection, sheetEditor;

    selectSheet();
}

document.addEventListener('DOMContentLoaded', main);