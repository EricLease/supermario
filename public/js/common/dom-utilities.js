export const extractFiles = (e, p) => 
    [...e.target.files].filter(f => f.type.match(p));

export function removeChildren(el) {
    while(el.firstChild) el.firstChild.remove();
}

export function findParent(el, selector) {
    for (; el  && el !== document; el = el.parentNode ) {
        if (el.matches(selector)) return el;
    }

    return null;
}

export function getNodeIndex(el) { 
    const children = el.parentNode.children;
     
    for (let idx = 0; idx < children.length; idx++) {
        if (children[idx] === el)  return idx;
    }
}

export function getNumberInput(min, max, val, step, placeholder, onchange, disabled = true) {
    const input = getInputWithClasses('number', 'form-control');
    
    if (typeof min !== 'undefined' && min !== null) input.min = min >= 0 ? min : 0;
    if (typeof max !== 'undefined' && max !== null) input.max = max > min ? max : min;
    if (typeof val !== 'undefined' && val !== null) input.value = val < min ? min : val > max ? max : val;    
    if (typeof step !== 'undefined' && step !== null) input.step = step;
    if (typeof placeholder !== 'undefined' && placeholder !== null) input.placeholder = placeholder;    
    if (typeof onchange !== 'undefined' && onchange !== null) { input.addEventListener('change', onchange); }
    
    if (disabled) {
        input.setAttribute('disabled', true);
    } else {
        input.removeAttribute('disabled');
    }

    return input;
}

export function getDivWithClasses(...classes) {
    return getElementWithClasses('div', ...classes);
}

export function getButtonWithClasses(text, ...classes) {
    const btn = getElementWithClasses('button', ...classes);

    btn.type = 'button';
    btn.innerText = text ? text : undefined;

    return btn;
}

export function getInputWithClasses(type, ...classes) {
    const input = getElementWithClasses('input', ...classes);

    input.type = type;

    return input;
}

export function getElementWithClasses(elType, ...classes) {
    const el = document.createElement(elType);

    el.classList.add(...classes);

    return el;
}

const BsHideClass = 'd-none';

export function bsHide(el) {
    el.classList.add(BsHideClass);
}

export function bsShow(el) {
    el.classList.remove(BsHideClass);
}

export function bsSwap(el1, el2) {
    el1.classList.toggle(
        BsHideClass, 
        !el2.classList.toggle(BsHideClass));
}

export function bsToggle(el) {
    el.classList.toggle(BsHideClass);
}

export function debounce(fn) {
    let timeout;

    return function() {
        if (timeout) {
            window.cancelAnimationFrame(timeout);
        }

        timeout = window.requestAnimationFrame(fn);
    };
}