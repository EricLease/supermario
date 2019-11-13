export async function dirtyCheck(modal, evt, dirtyFlag) {
    return !dirtyFlag
        ? Promise.resolve(true)
        : await modal.confirm(
            'There are unsaved changes.  Discard?', 
            evt, {
                footer: {
                    btnOk: {
                        text: 'Discard',
                        class: 'btn-outline-danger'
                    }
                }
            });
};