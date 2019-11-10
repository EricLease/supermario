export function getDataTransferData(evt) {
    return JSON.parse(evt.dataTransfer.getData('text'));
}

export function setDataTransferData(evt, dragId, contextId) {
    evt.dataTransfer.setData('text', JSON.stringify({
        dragId: dragId, contextId: contextId
    }));
}