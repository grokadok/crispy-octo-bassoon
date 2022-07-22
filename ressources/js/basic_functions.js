const is_explorer = navigator.userAgent.indexOf("MSIE") > -1,
    is_firefox = navigator.userAgent.indexOf("Firefox") > -1,
    is_opera = navigator.userAgent.toLowerCase().indexOf("op") > -1;
let is_chrome = navigator.userAgent.indexOf("Chrome") > -1,
    is_safari = navigator.userAgent.indexOf("Safari") > -1;
if (is_chrome && is_safari) {
    is_safari = false;
}
if (is_chrome && is_opera) {
    is_chrome = false;
}

/**
 * Appends several elements to parent.
 * @param {HTMLElement} parent
 * @param {HTMLElement[]} children
 */
function appendChildren(parent, children) {
    for (const child of children) {
        parent.appendChild(child);
    }
}
/**
 * Compares two arrays, and returns elements presents in only one of them.
 * @param {Iterable} array_1
 * @param {Iterable} array_2
 * @returns
 */
function arrayCompare(array_1, array_2) {
    let only_1 = [],
        only_2 = [],
        both = [];
    for (el of array_1) {
        if (array_2.includes(el)) both.push(el);
        else only_1.push(el);
    }
    for (el of array_2) if (!array_1.includes(el)) only_2.push(el);
    return {
        only_1: only_1,
        only_2: only_2,
        both: both,
    };
}
/**
 * Adds class "blurred" (filter:blur(2px) grayscale(.6);pointer-events:none) to element(s).
 * @param {(HTMLElement|HTMLElement[])} el - Element(s) to blur.
 */
function blurElements(el) {
    const action = (el) => el.classList.add("blurred");
    if (Array.isArray(el)) {
        for (let e of el) action(e);
    } else action(el);
}
/**
 * Capitalize first letter of provided string's words.
 * @param {String} str
 * @returns {String}
 */
function capitalize(str) {
    let array = [];
    for (const s of str.split(" ")) {
        array.push(s.charAt().toUpperCase() + s.slice(1));
    }
    return array.join(" ");
}
/**
 * Clones and replaces elements (e.g. to get rid of eventlisteners).
 * @param {HTMLElement|HTMLElement[]} el - Element or array of elements to clone & replace
 * @returns {HTMLElement|HTMLElement[]} Element or array of elements freshly cloned.
 */
function cloneAndReplace(el) {
    let newEl;
    if (Array.isArray(el)) {
        newEl = [];
        for (const e of el) {
            newEl.push(e.parentNode.replaceChild(e.cloneNode(true), e));
        }
    } else {
        newEl = el.parentNode.replaceChild(el.cloneNode(true), el);
    }
    return newEl;
}
/**
 * Add class "up" to element.
 * @param {HTMLElement} el - Element to add "up" to.
 */
function commentUp(el) {
    el.classList.add("up");
}
/**
 * Removes class "up" to element(s).
 * @param {(HTMLElement|HTMLElement[])} el - Element or array of elements which will lose "up"
 */
function commentDown(el) {
    Array.isArray(el)
        ? el.forEach((e) => e.classList.remove("up"))
        : el.classList.remove("up");
}
function convertRemToPixels(rem) {
    return (
        rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
    );
}
/**
 * Sets disabled=true to element(s).
 * @param {HTMLElement|HTMLElement[]} el - Element or array of elements to be disabled.
 */
function disable(el) {
    const action = (el) => (el.disabled = true);
    if (Array.isArray(el)) {
        for (let e of el) {
            action(e);
        }
    } else {
        action(el);
    }
}
/**
 * Simple timer to enable elements after a short time (e.g. to avoid mistype)
 * @param {HTMLElement|HTMLElement[]} el
 */
function elEnableTimer(el) {
    const action = (el) => {
        if (el.hidden === false)
            setTimeout(function () {
                enable(el);
            }, 20);
    };
    if (Array.isArray(el)) for (const e of el) action(e);
    else action(el);
}
/**
 * Adds classes "hidden" & "loading" and sets textContent="" to element(s).
 * @param {(HTMLElement|HTMLElement[])} el - Element or array of elements to be emptied.
 */
function emptyEl(el) {
    if (Array.isArray(el)) {
        for (const e of el) {
            e.classList.add("hidden", "loading");
            e.textContent = "";
        }
    } else {
        el.classList.add("hidden", "loading");
        el.textContent = "";
    }
}
/**
 * Resets previously loaded modal, keeping it's elements but emptying them.
 * @param {HTMLElement} el - Modal element.
 */
function emptyModal(el) {
    let modalFields = Array.from(el.getElementsByTagName("input")).concat(
            Array.from(el.getElementsByTagName("textarea"))
        ),
        modalSelected = Array.from(
            el.getElementsByClassName("selectize-selected")
        );
    resetFields(modalFields);
    removeChildren(modalSelected, true);
}
/**
 * Sets disabled=false to element.
 * @param {HTMLElement} el - Element to be enabled.
 */
function enable(el) {
    const action = (el) => (el.disabled = false);
    if (Array.isArray(el)) {
        for (let e of el) {
            action(e);
        }
    } else {
        action(el);
    }
}
/**
 * Removes class "fadeout" & "hidden"
 * @param {(HTMLElement|HTMLElement[])} el - The element(s) to fade in.
 * @param {Object} options - hide:boolean, dropdown:HTMLElement
 */
function fadeIn(el, options) {
    const action = (el) => {
        el.hidden = false;
        el.disabled = false;
        if (el.getElementsByTagName("input").length > 0)
            enable(el.getElementsByTagName("input")[0]);
        if (el.id === "phone-container") {
            el.getElementsByClassName("iti__selected-flag")[0].setAttribute(
                "tabindex",
                "0"
            );
        }
        setTimeout(el.classList.remove("fadeout"), 50);
        if (options && options["dropdown"]) {
            hideOnClickOutside(el, el.closest("fieldset"));
        }
    };
    if (Array.isArray(el)) {
        for (let e of el) action(e);
    } else {
        action(el);
    }
}
/**
 * Fades out (margin,padding,height,opacity:0 & pointer-events:none) and optionnaly hides (display=none) element(s)
 * @param {(HTMLElement|HTMLElement[])} el - The element or array of elements to fade out.
 * @param {Object} [options]
 * @param {Boolean} [options.hide] - Adds hidden=true.
 */
function fadeOut(el, options) {
    const action = (el) => {
        el.disabled = true;
        el.classList.add("fadeout");
        if (el.getElementsByTagName("input").length > 0)
            disable(el.getElementsByTagName("input")[0]);
        if (typeof options !== "undefined" && options["hide"] === true) {
            setTimeout(() => {
                el.hidden = true;
            }, 600);
        }
        if (el.id === "phone-container") {
            el.getElementsByClassName("iti__selected-flag")[0].removeAttribute(
                "tabindex"
            );
        }
    };
    if (Array.isArray(el)) {
        for (let e of el) {
            action(e);
        }
    } else {
        action(el);
    }
}
/**
 * Sets interval of 50ms between requests on input change of element, then proceeds to the request.
 * @param {HTMLElement} el
 * @param {Object} type
 */
function fetchDataTimer(el, type) {
    clearTimeout(timer);
    if (type.selectize !== undefined) {
        if (el.value) {
            fetchIt();
        } else {
            clearTimeout(timer);
            let ul = el.parentNode.getElementsByTagName("ul")[0];
            fadeOut(ul);
            removeChildren(ul, true);
        }
    }
    function fetchIt() {
        timer = setTimeout(() => {
            fetchSelectizeData(el, type.selectize);
        }, 50);
    }
}
/**
 * Adds an eventlistener on document to fadeOut element on click outside of itself or it's ancestor.
 * @param {HTMLElement} el - Element to fadeOut on click.
 * @param {HTMLElement} [anc=el] - Optional ancestor, defaults to el itself.
 */
function hideOnClickOutside(el, anc = el) {
    const outsideClickListener = (event) => {
        if (!anc.contains(event.target) && !el.classList.contains("fadeout")) {
            fadeOut(el);
        }
        removeClickListener();
    };
    function removeClickListener() {
        document.removeEventListener("click", outsideClickListener);
    }
    document.addEventListener("click", outsideClickListener);
}
/**
 * Highlights (unstyled <mark>) searched text in element(s).
 * @param {HTMLElement|HTMLElement[]} el - Element or array of elements to apply text highlight.
 * @param {String|String[]} needle - String or array of strings to highlight.
 */
function highlightSearch(el, needle) {
    if (Array.isArray(needle)) {
        needle = needle
            .filter((e) => {
                return e !== "";
            })
            .join("|");
    }
    const regex = new RegExp(`((^|\\b|\\w+)(${needle})($|\\b|\\w+))`, "gi");
    // const regex = new RegExp(needle, "gi");
    if (Array.isArray(el)) {
        for (let e of el) {
            e.innerHTML = e.innerHTML.replace(/(<mark>|<\/mark>)/gim, "");
            e.innerHTML = e.textContent.replace(regex, "<mark>$&</mark>");
        }
    } else {
        let text = el.innerHTML;
        text = text.replace(/(<mark>|<\/mark>)/gim, "");
        const newText = e.textContent.replace(regex, "<mark>$&</mark>");
        el.innerHTML = newText;
    }
}
/**
 * Removes class "valid", adds class "invalid" to element.
 * @param {HTMLElement} el - Element to be invalidated
 */
function invalidate(el) {
    el.classList.contains("valid")
        ? el.classList.replace("valid", "invalid")
        : el.classList.add("invalid");
}
/**
 * Adds class "loading" and removes class "hidden" to element(s).
 * @param {(HTMLElement|HTMLElement[])} el - Element or array of elements to load in.
 */
function loadIn(el) {
    if (Array.isArray(el)) {
        for (let i = 0; i < el.length; i++) {
            el[i].classList.add("loading");
            el[i].classList.remove("hidden");
        }
    } else {
        el.classList.add("loading");
        el.classList.remove("hidden");
    }
}
/**
 * Removes class "loading" to element(s).
 * @param {(HTMLElement|HTMLElement[])} el - The element or array of elements to load out.
 */
function loadOut(el) {
    if (Array.isArray(el)) {
        for (let i = 0; i < el.length; i++) {
            el[i].classList.remove("loading");
        }
    } else {
        el.classList.remove("loading");
    }
}
/**
 * Normalize string, removes accents, trims spaces, locale lowercase.
 * @param {String} string
 * @returns normalized string
 */
function normalizePlus(string) {
    return string
        .trim()
        .toLocaleLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}
/**
 * Refresh data from tabulators from element.
 * @param {HTMLElement} el - Parent containing tabulators to refresh.
 * @param {[Number]} [t] - Array of data-task to select which tables to refresh, or all tables by omitting it.
 */
function refreshTabData(el, t) {
    const tables = Tabulator.findTable(".tabulator");
    if (tables) {
        for (const table of tables) {
            const task = table["element"]
                .closest("fieldset")
                .getAttribute("data-t");
            if (
                (!t || t.includes(parseInt(task))) &&
                el.contains(table["element"])
            ) {
                const message = {
                    f: parseInt(6),
                    t: parseInt(task),
                };
                socket.send(message);
            }
        }
    }
}
/**
 * Removes attributes from element.
 * @param {HTMLElement} el - Element to be cleaned.
 * @param {String[]} [att] - Attributes to be removed, if not set, removes all attributes.
 */
function removeAttributes(el, att) {
    if (typeof att !== "undefined") {
        for (const a of att) {
            el.removeAttribute(a);
        }
    } else {
        let a = [];
        for (let i = 0; i < el.attributes.length; i++) {
            let b = el.attributes[i].name;
            if (b != "class") a.push(b);
        }
        a.forEach((c) => el.removeAttribute(c));
    }
}
/**
 * Removes all but first child from element, removes it too if all = true.
 * @param {HTMLElement} el - Element whose options will be removed
 * @param {Boolean} [all=false] - false: removes all but first, true: removes all
 */
function removeChildren(el, all = false) {
    action = (e) => {
        let i,
            L = e.children.length - 1,
            a = all === false ? 0 : -1;
        for (i = L; i > a; i--) {
            e.children[i].remove();
        }
    };

    if (Array.isArray(el)) {
        for (let e of el) {
            action(e);
        }
    } else {
        action(el);
    }
}
/**
 * Removes all but first option from element, removes it too if all = true.
 * @param {HTMLElement} el - Element whose options will be removed
 * @param {Boolean} [all=false] - false: removes all but first, true: removes all
 */
function removeOptions(el, all = false) {
    let i,
        L = el.options.length - 1,
        a = all === false ? 0 : -1;
    if (L >= 0) {
        for (i = L; i > a; i--) {
            el.options[i].remove();
        }
    }
}
/**
 * Resets value of element(s).
 * @param {(HTMLElement|HTMLElement[])} el - The element or array of elements to reset.
 */
function resetFields(el) {
    if (Array.isArray(el)) {
        for (let i = 0; i < el.length; i++) {
            el[i].value = "";
        }
    } else el.value = "";
}
/**
 * Resets value of all input elements.
 */
function resetAllFields() {
    Array.from(document.getElementsByTagName("input")).forEach(
        (e) => (e.value = "")
    );
}
/**
 * Removes all elements from modal except title and the footer, removes attributes.
 * @param {HTMLElement} el - Element (modal) to reset.
 * @returns {HTMLElement} - Reseted modal
 */
function resetModal(el) {
    tabuDestroy(el);
    removeAttributes(el);
    el.getElementsByTagName("h2")[0].textContent = "";
    for (let i = 1; el.children.length > 2; ) {
        el.children[i].remove();
    }
    return el;
}
/**
 * Selects text inside element if possible.
 * @param {HTMLElement} node
 */
function selectText(node) {
    if (document.body.createTextRange) {
        const range = document.body.createTextRange();
        range.moveToElementText(node);
        range.select();
    } else if (window.getSelection) {
        const selection = window.getSelection(),
            range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        console.warn("Could not select text in node: Unsupported browser.");
    }
}
/**
 * Set attributes from array to element.
 * @param {HTMLElement} el - Element to apply attributes to
 * @param {Array} att - Array of attributes to apply to element
 */
function setElementAttributes(el, att) {
    for (let [key, value] of att) {
        el.setAttribute(key, value);
    }
}
/**
 * Sets an element draggable.
 * @param {HTMLElement} el
 * @param {Object} [param]
 * @param {Boolean} [param.constrain=false] If true, constrains to offsetParent.
 * @param {Boolean} [param.magnet=false] If true, hop to border if close enough, and set corresponding class.
 * @param {Boolean} [param.parent] Sets the parent element to constrain and/or magnetize the element in, default if offsetParent.
 */
function setElementDraggable(el, param) {
    if (
        el.style.position === "absolute" ||
        getComputedStyle(el).position === "absolute"
    ) {
        el.classList.add("drag");
        // variables for variant using translate:transform() :
        // let translateX = 0,
        //     translateY = 0;

        el.onpointerdown = function (event) {
            if (
                ["div", "ul", "li", "nav"].includes(
                    event.target.tagName.toLowerCase()
                )
            ) {
                const elRect = el.getBoundingClientRect(),
                    paRect = param?.parent
                        ? param.parent.getBoundingClientRect()
                        : el.offsetParent.getBoundingClientRect(),
                    elShiftX = event.clientX - elRect.left,
                    elShiftY = event.clientY - elRect.top,
                    paShiftX = paRect.x,
                    paShiftY = paRect.y;
                el.classList.add("up");
                el.classList.remove("left", "right", "top", "bottom");

                function moveAt(pageX, pageY) {
                    el.classList.remove("left", "right", "top", "bottom");
                    let x, y;
                    if (paRect && param?.constrain) {
                        const calcX = pageX - elShiftX - paShiftX,
                            calcY = pageY - elShiftY - paShiftY,
                            parentRight =
                                paRect.right - el.offsetWidth - paShiftX,
                            parentBottom =
                                paRect.bottom - el.offsetHeight - paShiftY;
                        if (calcX < 0) x = 0;
                        else if (calcX > parentRight) x = parentRight;
                        else x = calcX;
                        if (calcY < 0) y = 0;
                        else if (calcY > parentBottom) y = parentBottom;
                        else y = calcY;
                    } else {
                        x = pageX - elShiftX - paShiftX;
                        y = pageY - elShiftY - paShiftY;
                    }
                    if (param?.magnet) {
                        if (pageX - paRect.left < 100) {
                            x = 0;
                            el.classList.add("left");
                        }
                        // if boxRight - parentRight < 75, x=parentRight-boxWidth
                        if (paRect.right - pageX < 100) {
                            x = paRect.right - el.offsetWidth;
                            el.classList.add("right");
                        }
                        // if y - parentY < 75, y = parentTop
                        if (pageY - paRect.top < 100) {
                            y = 0;
                            el.classList.add("top");
                        }
                        // if boxBottom - parentBottom < 75, y = parentBottom - boxHeight
                        if (paRect.bottom - pageY < 100) {
                            y = paRect.bottom - el.offsetHeight;
                            el.classList.add("bottom");
                        }
                    }
                    el.style.left = x + "px";
                    el.style.top = y + "px";
                }

                // variant using transform:translate(), but doesn't seem to perform as well as using top/left;
                // function moveAt(movementX, movementY) {
                //     translateX += movementX;
                //     translateY += movementY;
                //     el.style.transform = `translate(${translateX}px, ${translateY}px)`;
                // }
                // function onPointerMove(event) {
                //     // console.log(event);
                //     moveAt(event.movementX, event.movementY);
                // }

                function onPointerMove(event) {
                    event.preventDefault();
                    moveAt(event.pageX, event.pageY);
                }
                moveAt(event.pageX, event.pageY);
                // move the el on pointermove
                document.addEventListener("pointermove", onPointerMove);

                const release = (el) => {
                    el.classList.remove("up");
                    if (param?.magnet) {
                        if (
                            el.classList.contains("left") ||
                            el.classList.contains("right")
                        )
                            el.style.left = "";
                        if (
                            el.classList.contains("top") ||
                            el.classList.contains("bottom")
                        ) {
                            el.style.top = "";
                            el.style.left = "";
                        }
                    }
                };
                // drop the el, remove listeners.
                document.addEventListener(
                    "pointerup",
                    () => {
                        document.removeEventListener(
                            "pointermove",
                            onPointerMove
                        );
                        release(el);
                    },
                    { once: true }
                );
                document.body.addEventListener(
                    "pointerleave",
                    () => {
                        document.removeEventListener(
                            "pointermove",
                            onPointerMove
                        );
                        release(el);
                    },
                    { once: true }
                );
            }
        };

        el.ondragstart = () => {
            return false;
        };
    } else
        return msg.new({
            content: "Element must have position set to absolute.",
            type: "danger",
        });
}
/**
 * Sets element resizable, duh.
 * @param {HTMLElement} el
 * @param {String} side - From which side(s) the element is resizable.
 */
function setElementResizable(el, side) {
    // to be dealt with.
}
/**
 * Destroys tabulator(s) from element(s).
 * @param {HTMLElement|HTMLElement[]} el - Element(s) from which every tabulator will be destroyed.
 */
function tabuDestroy(el) {
    let tables = Tabulator.findTable(".tabulator");
    const action = (node) => {
        for (const table of tables) {
            if (node.contains(table["element"])) table.destroy();
        }
    };
    if (tables) {
        if (Array.isArray(el)) {
            for (const e of el) {
                action(e);
            }
        } else action(el);
    }
}
/**
 * Toggles between classes (useful when wanting to toggle between more than two classes)
 * @param {HTMLElement} el
 * @param {Object} options
 * @param {Array} options.classes - Classes to loop through
 * @param {Boolean} [options.none] - Insert in the loop the 'no class' state
 */
function toggleClasses(el, options) {
    for (const cla of options.classes) {
        if (el.classList.contains(cla)) {
            const index = options.classes.indexOf(cla);
            el.classList.remove(cla);
            if (index + 1 === options.classes.length && !options.none) {
                el.classList.add(options.classes[0]);
            } else if (index + 1 < options.classes.length)
                el.classList.add(options.classes[index + 1]);
            return;
        }
    }
    options.none
        ? el.classList.add(options.classes[0])
        : console.error(
              "toggleClasses: no class present on element and none:false."
          );
}
/**
 * Switches attribute "type" of element between "password" & "text"
 * @param {HTMLElement} el - The element which type will be changed.
 */
function togglePw(el) {
    const a = el.getElementsByTagName("input")[0],
        b = a.getAttribute("type"),
        c = el.getElementsByTagName("svg")[0].getElementsByTagName("path");
    if (b === "password") {
        a.setAttribute("type", "text");
        c[0].classList.add("hide");
        c[1].classList.remove("hide");
    } else if (b === "text") {
        a.setAttribute("type", "password");
        c[0].classList.remove("hide");
        c[1].classList.add("hide");
    }
}
/**
 * Removes class "blurred" from element(s).
 * @param {(HTMLElement|HTMLElement[])} el - The element or array of elements to unblur.
 */
function unblurElements(el) {
    const action = (el) => el.classList.remove("blurred");
    if (Array.isArray(el)) {
        for (const e of el) action(e);
    } else {
        action(el);
    }
}
/**
 * Unsets draggable to element, duh.
 * @param {HTMLElement} el
 */
function unsetElementDraggable(el) {
    el.onmousedown = null;
    el.classList.remove("drag", "up");
}
/**
 * Adds class "valid" and removes class "invalid" from element.
 * @param {HTMLElement} el - Element to validate.
 */
function validate(el) {
    el.classList.contains("invalid")
        ? el.classList.replace("invalid", "valid")
        : el.classList.add("valid");
}
