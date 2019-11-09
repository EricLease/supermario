import eControl from './e-control.js';
import { 
    getDivWithClasses, 
    getButtonWithClasses, 
    getElementWithClasses, 
    bsHide, bsShow } from './dom-utilities.js';

const ModalEvents = ['opened', 'closed'];

const ifDef = (val, defaultVal) => 
    typeof val === 'undefined' || val === null ? defaultVal : val;

function setOptions(options, fallback) {
    options = ifDef(options, {});
    options.header = ifDef(options.header, {});
    options.body = ifDef(options.body, {});
    options.footer = ifDef(options.footer, {});
    options.footer.btnOk = ifDef(options.footer.btnOk, {});
    options.footer.btnCancel = ifDef(options.footer.btnCancel, {});

    fallback = ifDef(fallback, {});
    fallback.header = ifDef(fallback.header, {});
    fallback.body = ifDef(fallback.body, {});
    fallback.footer = ifDef(fallback.footer, {});
    fallback.footer.btnOk = ifDef(fallback.footer.btnOk, {});
    fallback.footer.btnCancel = ifDef(fallback.footer.btnCancel, {});

    return {
        parent: options.parent, // this is determined during attach
        dismiss: ifDef(options.dismiss, ifDef(fallback.dismiss, null)),

        header: {
            show: ifDef(options.header.show, ifDef(fallback.header.show, true)),
            title: ifDef(options.header.title, ifDef(fallback.header.title, '')),
            cb: ifDef(options.header.cb, ifDef(fallback.header.cb, null))
        },
        body: {
            show: ifDef(options.body.show, ifDef(fallback.body.show, true)),
            content: ifDef(options.body.content, ifDef(fallback.body.content, ''))
        },
        footer: {
            show: ifDef(options.footer.show, ifDef(fallback.footer.show, true)),
            btnOk: {
                show: ifDef(options.footer.btnOk.show, ifDef(fallback.footer.btnOk.show, true)),
                text: ifDef(options.footer.btnOk.text, ifDef(fallback.footer.btnOk.text, 'Ok')),
                cb: ifDef(options.footer.btnOk.cb, ifDef(fallback.footer.btnOk.cb, () => {}))
            },
            btnCancel: {
                show: ifDef(options.footer.btnCancel.show, ifDef(fallback.footer.btnCancel.show, false)),
                text: ifDef(options.footer.btnCancel.text, ifDef(fallback.footer.btnCancel.text, 'Cancel')),
                cb: ifDef(options.footer.btnCancel.cb, ifDef(fallback.footer.btnCancel.cb, () => {}))
            }
        },

        // Following options are used by bootstrap modal
        backdrop: ifDef(options.backdrop, ifDef(fallback.backdrop, true)),
        keyboard: ifDef(options.keyboard, ifDef(fallback.keyboard, true)),
        focus: ifDef(options.focus, ifDef(fallback.focus, true)),
        show: false, // suppress bootstrap's show, control with attach/detach
    };
}

export default class Modal extends eControl {
    constructor(options, parent) {
        super(ModalEvents);

        this.shown = false;
        this.parent = parent || document.body;
        this.options = setOptions(options);
        this.ignore.push('parent', 'options');
    }

    show(options) {
        if (!this.built) this.build();

        options = setOptions(options, this.options);

        let parentChanged, parent;

        if (options.parent &&
            options.parent !== this.options.parent) {
            parentChanged = true;
            parent = options.parent;
        } else {
            parentChanged = false;
            parent = this.options.parent;
        }

        this.options = options;
        this.options.parent = parent;

        if (this.options.header.show) {            
            const id = this.btnDismiss.dataset.ignoreId;

            if (id) this.ignoreEvent(id);

            this.btnDismiss.dataset.ignoreId = this.listenTo(
                this.btnDismiss, 
                'click', 
                this.options.header.cb 
                    ? this.options.header.cb 
                    : () => { this.dismiss(); });
            this.title.innerText = this.options.header.title;
            bsShow(this.header);
        } else {
            bsHide(this.header);
        }

        if (this.options.body.show) {
            this.body.innerHTML = this.options.body.content;
            bsShow(this.body);
        } else {
            bsHide(this.body);
        }

        if (this.options.footer.show) {
            if (this.options.footer.btnOk.show) {
                this.btnOk.innerText = this.options.footer.btnOk.text;

                const id = this.btnOk.dataset.ignoreId;

                if (id) this.ignoreEvent(id);

                this.btnOk.dataset.ignoreId = this.listenTo(
                    this.btnOk, 'click', this.options.footer.btnOk.cb);
                bsShow(this.btnOk);
            } else {
                bsHide(this.btnOk);
            }

            if (this.options.footer.btnCancel.show) {
                this.btnCancel.innerText = this.options.footer.btnCancel.text;
                
                const id = this.btnCancel.dataset.ignoreId;

                if (id) this.ignoreEvent(id);

                this.btnCancel.dataset.ignoreId = this.listenTo(
                    this.btnCancel, 'click', this.options.footer.btnCancel.cb);
                bsShow(this.btnCancel);
            } else {
                bsHide(this.btnCancel);
            }

            bsShow(this.footer);
        } else {
            bsHide(this.footer);
        }

        const $modal = $(this.container);
        const onHide = () => {
            if (!this.hiding) {
                if (this.options.dismiss) this.options.dismiss();
                else this.dismiss();
            }

            this.hiding = false;
        };

        $modal.modal(this.options);
        $modal.off('hide.bs.modal')
            .on('hide.bs.modal', () => { onHide(); });

        if (this.shown) { 
            if (!parentChanged) return;
            
            this.detach({suppressEvt: true});
        }

        this.attach(this.options.parent);
        
        return;
    }

    dismiss(suppressEvt = false) { 
        if(!this.hiding) {
            this.hiding = true;
            this.detach(suppressEvt); 
        }
    }

    build() {
        if (this.built) return;

        const buildModalHeader = () => {
            const span = document.createElement('span');

            this.header = getDivWithClasses('modal-header');
            this.title = getElementWithClasses('h5', 'modal-title');
            this.header.appendChild(this.title);
            this.btnDismiss = getButtonWithClasses(null, 'close');
            this.btnDismiss.type = 'button';
            span.innerHTML = '&times;';
            this.btnDismiss.appendChild(span);
            this.header.appendChild(this.btnDismiss);

            return this.header;
        };
        const buildModalBody = () => 
            this.body = getDivWithClasses('modal-body');
        const buildModalFooter = () => {
            this.footer = getDivWithClasses('modal-footer');
            this.btnOk = getButtonWithClasses('OK', 'btn', 'btn-outline-success');
            this.footer.appendChild(this.btnOk);
            this.btnCancel = getButtonWithClasses('Cancel', 'btn', 'btn-outline-warning');
            this.footer.appendChild(this.btnCancel);

            return this.footer;
        };
        const modalDialog = getDivWithClasses('modal-dialog', 'modal-dialog-centered');
        const modalContent = getDivWithClasses('modal-content');
        
        modalDialog.setAttribute('role', 'document');
        modalContent.appendChild(buildModalHeader());
        modalContent.appendChild(buildModalBody());
        modalContent.appendChild(buildModalFooter());
        modalDialog.appendChild(modalContent);
        this.container = getDivWithClasses('modal', 'fade');
        this.container.setAttribute('tabindex', '-1');
        this.container.setAttribute('role', 'dialog');
        this.container.appendChild(modalDialog);        
        this.built = true;
    }
}

Modal.prototype.attach = function(parentSelector) {
    parentSelector = parentSelector || this.parent;
    eControl.prototype.attach.call(this, parentSelector);
    this.options.parent = parentSelector;
    $(this.container).modal('show');
    this.shown = true;
    this.listeners.get('opened').forEach(cb => cb());
};

Modal.prototype.detach = function(options) {
    options = options || {};
    options.retainParent = true;
    eControl.prototype.detach.call(this, options);
    $(this.container).modal('hide');
    this.shown = false;
    if (options.suppressEvt) return;
    this.listeners.get('closed').forEach(cb => cb());
};