import SheetSelection from './sheet-selection.js';
import SheetEditor from './sheet-editor.js';

function main() {
    function selectSheet() {
        if (sheetEditor) {
            sheetEditor.dispose();
            sheetEditor = null;
        } else {
            sheetSelection = new SheetSelection('#tool');
            sheetSelection.addEventListener('sheetselected', sheetSelected);
        }

        sheetSelection.show();
    }

    function sheetSelected(e) {
        sheetSelection.hide();
        sheetEditor = new SheetEditor(e.fileName, e.sprites, e.new);
        sheetEditor.attach('#tool');
        sheetEditor.addEventListener('done', selectSheet, { once: true });
    }

    let sheetSelection, sheetEditor;

    selectSheet();
}

document.addEventListener('DOMContentLoaded', main);