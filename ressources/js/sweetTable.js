class SweetTable {
    static tables = [];
    /**
     * Creates a table, duh. Needs either param.rows or param.task to be created and populated.
     * @param {Object} param - SweetTable properties.
     * @param {Object[]} param.cols - Column properties.
     * @param {String} [param.cols.datatype] - Type to determine sorting of the rows according to column data.
     * @param {Boolean|Number} [param.cols.groupby=false] - Number to set hierarchical grouping of rows (from 0=highest), else false.
     * @param {Boolean} param.cols.hidden - Columns hidden or not on load.
     * @param {Number} param.cols.id - Column id, sets initial display order.
     * @param {Boolean} param.cols.multi - True if cell value is an array.
     * @param {String} param.cols.name - Column name showed in header.
     * @param {String} [param.cols.options] - When row data is an id, this links the pool to get the data from.
     * @param {Number} [param.cols.sortby] - 0=key or 1=value.Sets either key or value to sort the column by.
     * @param {Number} [param.cols.sorting] - 0=asc or 1=desc.Sets the sorting direction of the column.
     * @param {Function} [param.cols.structure] - How data is structured inside the cell. If not set, data is simply thrown into the cell div.
     * @param {Object} param.header - Header properties.
     * @param {Number} param.header.height - Header height.
     * @param {Boolean} param.header.search - Search table or not.
     * @param {Number} [param.height] - Total height of the table in rem, if not set, will fill the available space. (JS will have to listen for height change)
     * @param {String} param.name - Table name/short description.
     * @param {Number} [param.pagination] - If set to x>0, pagination active with x rows per page. If set to 0, pagination fits table height to avoid overflow. Overrides scroll setting.
     * @param {Object} [param.row] - Row properties
     * @param {Number} [param.row.height=2] - Sets fixed row height, default = 2rem. (handled in css?)
     * @param {Boolean} [param.row.selectable=false] - Selectability of rows, default = false.
     * @param {Object[]} [param.rows] - Rows data.
     * @param {String} [param.scroll=infinite] - Scroll type, accepts fixed,infinite,normal.
     * @param {Number} [param.task] - Table task.
     * @param {Object} param.tHead - Columns header properties.
     * @param {Boolean} [param.tHead.fixed=true] - Columns header fixed on top of the table or not. DEPRECATED
     * @param {Boolean} [param.tHead.hidden=false] - Columns header hidden or not.
     * @param {HTMLElement} param.wrapper - Table wrapper.
     */
    constructor(param) {
        // Server side note: create DOM element before querying data, so that the table can request only displayed data to server.
        if (
            typeof param.task === "undefined" &&
            typeof param.rows === "undefined"
        )
            return console.error("Sweettable: no data set.");
        if (SweetTable.tables.length === 0)
            document.addEventListener("click", SweetTable.hideMenuListener);
        SweetTable.tables.push(this);
        this.wrapper = param.wrapper;
        this.header = document.createElement("div");
        this.table = document.createElement("div");
        this.table.setAttribute("role", "table");
        this.thead = document.createElement("div");
        this.tbody = document.createElement("div");
        // this.tfoot = document.createElement("div");
        this.footer = document.createElement("div");
        this.rowHeight = param.row?.height ?? 2;
        this.wrapper.className = "sweettable";
        this.menu = {};
        this.menu.wrapper = document.createElement("ul");
        this.menu.search = document.createElement("li");
        this.menu.colsDrop = document.createElement("ul");
        this.menu.icons = document.createElement("li");
        let cols = document.createElement("li"),
            searchInput = document.createElement("span");
        this.menu.icons.innerHTML = `<div class="show">
            <svg viewBox="0 0 24 23" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" tabindex="0">
                <g>
                    <path d="M17.882,18.297C16.123,19.413 14.083,20.003 12,20C6.608,20 2.122,16.12 1.181,11C1.611,8.671 2.783,6.543 4.521,4.934L1.392,1.808L2.807,0.393L22.606,20.193L21.191,21.607L17.882,18.297ZM5.935,6.35C4.576,7.586 3.629,9.209 3.223,11C3.535,12.367 4.162,13.641 5.054,14.723C5.946,15.804 7.078,16.663 8.36,17.229C9.641,17.796 11.038,18.056 12.438,17.988C13.838,17.92 15.203,17.526 16.424,16.838L14.396,14.81C13.533,15.354 12.51,15.588 11.496,15.475C10.482,15.361 9.537,14.906 8.816,14.185C8.094,13.463 7.639,12.518 7.526,11.504C7.412,10.49 7.646,9.467 8.19,8.604L5.935,6.35ZM12.914,13.328L9.672,10.086C9.494,10.539 9.452,11.034 9.552,11.51C9.651,11.987 9.887,12.424 10.231,12.768C10.575,13.112 11.012,13.348 11.489,13.448C11.965,13.547 12.46,13.505 12.913,13.327L12.914,13.328ZM20.807,15.592L19.376,14.162C20.045,13.209 20.52,12.135 20.777,11C20.505,9.81 19.994,8.687 19.275,7.701C18.556,6.714 17.644,5.884 16.594,5.261C15.544,4.638 14.378,4.234 13.168,4.076C11.957,3.917 10.727,4.006 9.552,4.338L7.974,2.76C9.221,2.27 10.58,2 12,2C17.392,2 21.878,5.88 22.819,11C22.513,12.666 21.824,14.238 20.807,15.592ZM11.723,6.508C12.36,6.469 12.997,6.565 13.594,6.791C14.19,7.017 14.732,7.367 15.182,7.818C15.634,8.268 15.983,8.81 16.209,9.407C16.435,10.003 16.531,10.641 16.492,11.277L11.723,6.508Z" style="fill-rule:nonzero;"/>
                </g>
                <g transform="matrix(1,0,0,1,1,2)">
                    <path d="M11,0C16.392,0 20.878,3.88 21.819,9C20.879,14.12 16.392,18 11,18C5.608,18 1.122,14.12 0.181,9C1.121,3.88 5.608,0 11,0ZM11,16C13.04,16 15.018,15.307 16.613,14.035C18.207,12.764 19.323,10.988 19.777,9C19.321,7.013 18.205,5.24 16.611,3.97C15.016,2.7 13.038,2.009 11,2.009C8.962,2.009 6.984,2.7 5.389,3.97C3.795,5.24 2.679,7.013 2.223,9C2.677,10.988 3.793,12.764 5.387,14.035C6.982,15.307 8.961,16 11,16ZM11,13.5C9.807,13.5 8.662,13.026 7.818,12.182C6.974,11.338 6.5,10.194 6.5,9C6.5,7.807 6.974,6.662 7.818,5.818C8.662,4.974 9.807,4.5 11,4.5C12.194,4.5 13.338,4.974 14.182,5.818C15.026,6.662 15.5,7.807 15.5,9C15.5,10.194 15.026,11.338 14.182,12.182C13.338,13.026 12.194,13.5 11,13.5ZM11,11.5C11.663,11.5 12.299,11.237 12.768,10.768C13.237,10.299 13.5,9.663 13.5,9C13.5,8.337 13.237,7.701 12.768,7.232C12.299,6.763 11.663,6.5 11,6.5C10.337,6.5 9.701,6.763 9.232,7.232C8.763,7.701 8.5,8.337 8.5,9C8.5,9.663 8.763,10.299 9.232,10.768C9.701,11.237 10.337,11.5 11,11.5Z" style="fill-rule:nonzero;"/>
                </g>
            </svg>
        </div>
        <div>
            <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 0V2H17L12 9.5V18H6V9.5L1 2H0V0H18ZM3.404 2L8 8.894V16H10V8.894L14.596 2H3.404Z"/>
            </svg>
            <span></span>
        </div>
        <div>
            <svg viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/">
                <g transform="matrix(1.20101,0,0,1.33333,-2.41206,-4)">
                    <path d="M11.95,7.95L10.536,9.364L8,6.828L8,20L6,20L6,6.828L3.465,9.364L2.05,7.95L7,3L11.95,7.95Z"/>
                </g>
                <g transform="matrix(1.20101,0,0,1.33333,-2.41206,-4)">
                    <path d="M21.95,16.05L17,21L12.05,16.05L13.464,14.636L16.001,17.172L16,4L18,4L18,17.172L20.536,14.636L21.95,16.05Z"/>
                </g>
            </svg>
        </div>`;
        cols.textContent = "Columns";
        searchInput.placeholder = "search...";
        searchInput.contentEditable = "true";
        searchInput.spellcheck = "false";
        searchInput.setAttribute("role", "textbox");
        searchInput.addEventListener("input", (e) => {
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
            SweetTable.find(e.target).search(e.target.textContent);
        });
        this.menu.search.appendChild(searchInput);
        cols.appendChild(this.menu.colsDrop);
        appendChildren(this.menu.wrapper, [
            this.menu.icons,
            this.menu.search,
            cols,
        ]);
        this.menu.wrapper.className = "hide";
        this.menu.wrapper.addEventListener("pointerup", (e) => {
            if (this.menu.wrapper.classList.contains("up")) {
                this.menu.observer?.disconnect();
                // delete this.menu.observer;
                const table = SweetTable.find(e.target),
                    box = table.menu.wrapper.getBoundingClientRect(),
                    thead = table.thead.getBoundingClientRect(),
                    yMin = thead.y - 2 * thead.height,
                    yMax = thead.y + 2 * thead.height;

                // if close to some col head, stick to it etc
                if (box.y > yMin && box.y < yMax) {
                    const boxMiddle = box.x + box.width / 2,
                        theadMiddle = thead.x + thead.width / 2;
                    let heads = table.cols
                            .filter((x) => x.width !== "0fr")
                            .map((x) => [x.head, x.id]),
                        last;
                    if (boxMiddle > theadMiddle) heads.reverse();
                    for (const head of heads) {
                        const headRect = head[0].getBoundingClientRect(),
                            headMiddle = headRect.x + headRect.width / 2,
                            diff = Math.abs(boxMiddle - headMiddle);
                        if (typeof last === "number" && diff > last) {
                            // stick menu to closest col.head.
                            return table.menuToHead(
                                heads[heads.indexOf(head) - 1][1]
                            );
                        } else last = diff;
                    }
                } else {
                    this.menuMove();
                    const wrap = table.menu.wrapper;
                    wrap.classList.add("solo");
                    wrap.style.width = "";
                    wrap.getElementsByTagName("ul")[0].style.width = "";
                    delete table.menu.col;
                }
            }
        });

        // if param.task then request data
        if (typeof param.task !== "undefined") {
            this.task = param.task;
            socket.send({
                f: 2501,
                i: SweetTable.tables.indexOf(this),
                t: this.task,
            });
            // incomplete server side version
            if (1 === 0) {
                // get the height of the table
                const fontSize =
                        parseInt(
                            window
                                .getComputedStyle(
                                    document.getElementsByTagName("html")[0]
                                )
                                .getPropertyValue("font-size")
                                .match(/\d+/)[0]
                        ) ?? 16,
                    height =
                        param.height ?? this.wrapper.offsetHeight / fontSize;
                rows = (height / this.rowHeight) * 2;

                // then request data from server according to height
                socket.message({
                    c: [], // columns to get data from, 0 based
                    // d: 0, // direction: 0 down, 1 up // NOT NEEDED ?
                    f: 2501, // global fetch table data task
                    // g: [], // grouping columns
                    i: SweetTable.tables.indexOf(this), // index of table object
                    p: 0, // array of primary ids of table rows to get data for.
                    r: rows, // number of rows to request
                    s: [1], // grouping & sorting columns (last has to be 1, preceded by the sorting column), 1 based
                    t: this.task, // specific table fetch data task
                    v: 0, // sorting direction: 0 down, 1 up
                });
                // ACHTUNG : offset applied after sorting direction.
                // solution : if direction change, calculate correct offset according to total rows and direction before sending request.
                // <- irrelevant without use of OFFSET
            }
        } else {
            // parse data from param
            this.rows = param.rows;
            this.cols = param.cols;
            this.options = param.options;
        }
        appendChildren(this.table, [this.thead, this.tbody]);
        appendChildren(this.wrapper, [
            this.header,
            this.table,
            this.footer,
            this.menu.wrapper,
        ]);
    }
    colGrid() {
        const fontSize =
            parseInt(
                window
                    .getComputedStyle(document.getElementsByTagName("html")[0])
                    .getPropertyValue("font-size")
                    .match(/\d+/)[0]
            ) ?? 16;
        let cols = this.cols.map((x) => x.width ?? "1fr"),
            frs = 0,
            // pxs = 0,
            remain = this.table.getBoundingClientRect().width;
        if (cols.filter((x) => x !== "0fr").length === 1) {
            for (const [index, col] of cols.entries())
                if (col !== "0fr") cols[index] = "1fr";
        } else {
            for (let [index, col] of cols.entries()) {
                if (col.slice(-3) === "rem") {
                    const value = fontSize * parseFloat(col);
                    cols[index] = value + "px";
                    remain -= value;
                } else if (col.slice(-2) === "px") remain -= parseFloat(col);
                else if (col.slice(-2) === "fr") frs += parseFloat(col);
            }
            let smallest;
            if (frs > 0) {
                const fr = remain / frs;
                for (const [index, col] of cols.entries()) {
                    if (col.slice(-2) === "px") {
                        const value = parseFloat(col) / fr;
                        cols[index] = value + "fr";
                        if (value > 0) {
                            if (smallest && value < parseFloat(cols[smallest]))
                                smallest = index;
                            else if (!smallest) smallest = index;
                        }
                    } else {
                        if (parseFloat(col) > 0) {
                            if (
                                smallest &&
                                parseFloat(col) < parseFloat(cols[smallest])
                            )
                                smallest = index;
                            else if (!smallest) smallest = index;
                        }
                    }
                }
                const factor = 1 / parseFloat(cols[smallest]);
                for (let col of cols) col = parseFloat(col) * factor + "fr";
            } else {
                for (const [index, col] of cols.entries())
                    if (col.slice(-2) === "px" && parseFloat(col) > 0) {
                        if (
                            smallest &&
                            parseFloat(col) < parseFloat(cols[smallest])
                        )
                            smallest = index;
                        else if (!smallest) smallest = index;
                    }
                const factor = 1 / parseFloat(cols[smallest]);
                for (const [index, col] of cols.entries())
                    if (col.slice(-2) === "px")
                        cols[index] = parseFloat(col) * factor + "fr";
            }
        }

        const str = cols.join(" ");
        this.thead.style.gridTemplateColumns = str;
        this.tbody.style.gridTemplateColumns = str;
        this.cols.map((x) => x.head.classList.remove("last"));
        this.cols
            .filter((x) => x.width !== "0fr")
            .pop()
            .head.classList.add("last");
    }
    /**
     * Removes table element and object.
     */
    destroy() {
        this.menu.observer?.disconnect();
        this.wrapper.remove();
        SweetTable.tables.splice(SweetTable.tables.indexOf(this), 1);
        if (SweetTable.tables.length === 0)
            document.removeEventListener("click", SweetTable.hideMenuListener);
    }
    static destroyAll() {
        for (const table of SweetTable.tables) table.destroy();
    }
    /**
     * Finds table object from element within it.
     * @param {HTMLElement} el
     * @returns Table object or false.
     */
    static find(el) {
        for (const table of SweetTable.tables)
            if (table.wrapper.contains(el) || table.wrapper === el)
                return table;
        return false;
    }
    /**
     * Finds column object from element.
     * @param {HTMLElement} el
     * @returns Column objet of false.
     */
    findCol(el) {
        for (const col of this.cols)
            if (col.head === el || col.head.contains(el)) return col;
        return false;
    }
    headClick(col) {
        const box = this.menu.wrapper;
        if (col.id === this.menu.col && !box.classList.contains("hide"))
            return box.classList.add("hide");
        this.menuToHead(col.id);
        // if menu hidden, show it and add event listener to hide it again
        box.classList.remove("hide");
    }
    headOver(col) {
        if (
            !this.menu.wrapper.classList.contains("hide") &&
            this.menu.col !== col.id
        )
            this.headClick(col);
        else if (this.menu.col === col.id) {
            this.menuToHead();
        }
    }
    static hideMenuListener(event) {
        SweetTable.tables.map((table) => {
            if (
                !table.menu.wrapper.contains(event.target) &&
                !table.thead.contains(event.target) &&
                !table.menu.wrapper.classList.contains("hide")
            )
                table.menu.wrapper.classList.add("hide");
        });
    }
    hightlightSearch() {
        // for each drawn cell
        // for each searched term
        // find words matching term
        // if word not highlighted yet, highlight it.
    }
    /**
     * Load more data down the table.
     */
    loadDown() {
        // when remaining scroll down < 1 table height, load more rows
    }
    /**
     * Load more data up the table.
     */
    loadUp() {
        // when remaining scroll up < 1 table height, load more rows
    }
    async menuMove() {
        if (this.timeout) clearTimeout(this.timeout);
        const menu = this.menu.wrapper.classList;
        menu.add("move");
        const action = () => {
            menu.remove("move");
        };
        this.timeout = setTimeout(action, 500);
    }
    menuToHead(param) {
        this.menu.observer?.disconnect();
        this.menuMove();
        if (typeof param === "number") this.menu.col = param;
        const col = this.cols[this.menu.col],
            box = this.menu.wrapper,
            parent = box.offsetParent.getBoundingClientRect(),
            head = col.head.getBoundingClientRect();
        // if (
        //     is_safari &&
        //     this.wrapper.previousElementSibling.tagName.toLowerCase() ===
        //         "legend"
        // ) {
        //     const legend = this.wrapper.previousElementSibling.offsetHeight;
        //     box.style.top =
        //         Math.floor(
        //             head.y +
        //                 head.height -
        //                 col.head.offsetTop -
        //                 parent.y -
        //                 legend
        //         ) + "px";
        // } else
        // box.style.top =
        //     head.y + head.height - col.head.offsetTop - parent.y + "px";
        box.style.top =
            Math.floor(head.y + head.height - col.head.offsetTop - parent.y) +
            "px";
        this.menu.wrapper.classList.remove("solo");
        this.menu.icons.innerHTML =
            this.menu.colsDrop.children[col.id].children[1].innerHTML;
        this.menu.icons.children[0].addEventListener("click", () => {
            SweetTable.find(box).toggleColVis(col);
        });
        this.menu.icons.children[1].addEventListener("click", () => {
            SweetTable.find(box).setGroupBy(col.id);
        });
        this.menu.icons.children[2].addEventListener("click", () => {
            SweetTable.find(box).setSortBy(col.id);
        });
        this.menu.observer = new ResizeObserver((entries) => {
            if (!box.classList.contains("hide")) {
                for (const entry of entries) {
                    const head = entry.target.getBoundingClientRect(),
                        limit = convertRemToPixels(7);
                    let left,
                        width = head.width > limit ? head.width : limit;
                    box.style.width =
                        head.width > limit ? head.width + "px" : "";
                    box.getElementsByTagName("ul")[0].style.width =
                        box.style.width;
                    const offset = (head.width - limit) / 2,
                        x =
                            head.width > limit
                                ? head.x - parent.x
                                : head.x - parent.x + offset;
                    if (x < 0) left = head.x - parent.x;
                    else if (x > parent.width - width)
                        left = parent.width - width;
                    else left = x;
                    box.style.left = Math.floor(left - 1) + "px";
                }
            }
        });
        this.menu.observer.observe(this.cols[this.menu.col].head);
    }
    /**
     * Add rows for testing purposes.
     * @param {Number} num - How many rows to add
     */
    multiplyRows(num) {
        for (let i = 0; i < num; i++) {
            this.rows.push(
                this.rows[
                    Math.floor(
                        Math.random() * (Math.floor(37) - Math.ceil(0) + 1)
                    ) + Math.ceil(0)
                ]
            );
        }
    }
    /**
     * Loads table data into object, then populate table.
     * @param {Array[]} data
     */
    static parseData(data) {
        const table = SweetTable.tables[data.i];
        table.rows = data.response.rows;
        table.cols = data.response.cols;
        table.options = data.response.options;
        table.populate();
        setElementDraggable(table.menu.wrapper);
        // incomplete server side version
        if (1 === 0) {
            if (typeof data.d === "undefined") {
                // first load
                table.cols = data.response.cols;
                for (const [index, value] of table.cols.entries()) {
                    let th = document.createElement("th");
                    th.textContent = value;
                    th.addEventListener("click", table.sort(index));
                    table.cols.push({ id: index, name: value, head: th });
                }
                // create columns with event listeners for sorting
                // create rows with event listeners according to
            } else {
                // data add to existing table
            }
            // for each column
            // if no sorter explicitely set
            // get type and set sorter accordingly
            // for each sorter arrow
            // set eventlistener on click get data according to sorter.
        }
    }
    /**
     * Load data into table.
     * @param {[]} - Rows
     */
    populate() {
        // if thead empty = first load.
        if (this.thead.children.length === 0) {
            this.thead.innerHTML = "";
            this.menu.colsDrop.innerHTML = "";
            this.menu.colsDrop.addEventListener("pointerdown", (e) => {
                e.stopPropagation();
            });
            for (const col of this.cols) {
                if (
                    typeof col.width === "undefined" &&
                    typeof col.groupby === "number"
                )
                    col.width = "0fr";
                col.oriWidth =
                    typeof col.width === "undefined" || col.width == "0fr"
                        ? "1fr"
                        : col.width;
                // populate menu colsdrop
                let menuRow = document.createElement("li"),
                    handle = document.createElement("button"),
                    icons = document.createElement("div");
                menuRow.textContent = col.name;
                col.width === "0fr"
                    ? menuRow.classList.add("shrunk")
                    : menuRow.classList.remove("shrunk");
                icons.innerHTML = this.menu.icons.innerHTML;
                icons.addEventListener("click", (e) => {
                    e.stopPropagation();
                });
                col.visIcon = icons.children[0];
                col.groupIcon = icons.children[1];
                col.sortIcon = icons.children[2];
                handle.textContent = "↕";
                handle.addEventListener("click", (e) => {
                    e.stopPropagation();
                });
                appendChildren(menuRow, [handle, icons]);
                menuRow.appendChild(icons);
                // set eventlisteners
                // menuRow.addEventListener("pointerdown", (e) => {
                //     e.stopPropagation();
                // });
                menuRow.addEventListener("click", () => {
                    this.toggleColVis(col);
                });
                col.visIcon.addEventListener("click", () => {
                    SweetTable.find(icons).toggleColVis(col);
                });
                col.groupIcon.addEventListener("click", () => {
                    SweetTable.find(icons).setGroupBy(col.id);
                });
                col.sortIcon.addEventListener("click", () => {
                    SweetTable.find(icons).setSortBy(col.id);
                });
                this.menu.colsDrop.appendChild(menuRow);
                // create col header
                let head = document.createElement("div");
                head.setAttribute("role", "columnheader");
                col.head = head;
                head.textContent = col.name;
                // on click show menu under head with proper icons.
                head.addEventListener("click", () => {
                    this.headClick(col);
                });
                head.addEventListener("mouseover", () => {
                    this.headOver(col);
                });
                this.thead.appendChild(head);
                if (this.cols.indexOf(col) < this.cols.length - 1) {
                    let resize = document.createElement("div");
                    resize.addEventListener("pointerdown", () => {
                        this.resizeCol(col);
                    });
                    resize.addEventListener("click", (e) => {
                        e.stopPropagation(); // not enough
                    });
                    head.appendChild(resize);
                }
                // prepare rows according to sortby value
                if (
                    typeof col.options === "string" &&
                    typeof col.sortby === "number" &&
                    col.sortby === 1
                ) {
                    for (const row of this.rows) {
                        if (Array.isArray(row[col.id])) {
                            row[col.id] = row[col.id].map(
                                (x) => this.options[col.options][x].name
                            );
                            // .join(",");
                        } else {
                            row[col.id] =
                                this.options[col.options][row[col.id]]?.name ??
                                "";
                        }
                    }
                }
            }
            this.colGrid();
            this.sort();
        } else {
            // get row quantity by calc table height and row height.

            // always observe 2-3 rows, around intersection element, to load next-previous rows when necessary.
            // set intersection observer on top of the table, for next tenth row.
            // on intersection
            // if row<last, load previous 10 rows, empty next 10 rows, observe previous tenth row, unobserve next tenth row
            // of row>last, load next 10 rows, empty previous 10 rows, observe next tenth row, unobserve previous tenth row
            // store intersected row as last

            const start = performance.now();
            this.tbody.innerHTML = "";
            let last = this.tbody,
                groups = [],
                limit = 0;
            // set rows
            for (const rowData of this.search.rows ?? this.rows) {
                if (limit < 100) {
                    // move limit according to table height/row height + 10 rows
                    if (Array.isArray(rowData)) {
                        let row = document.createElement("div");
                        row.setAttribute("role", "row");
                        for (const col of this.cols) {
                            let cell = document.createElement("div");
                            cell.setAttribute("role", "cell");
                            cell.style.gridColumn = col.id + 1;
                            if (Array.isArray(rowData[col.id])) {
                                let values = [];
                                for (const value of rowData[col.id])
                                    values.push(
                                        typeof value === "number" &&
                                            typeof col.options === "string"
                                            ? this.options[col.options][value]
                                                  .name
                                            : value
                                    );
                                cell.textContent = values.join(",");
                            } else
                                cell.textContent =
                                    typeof rowData[col.id] === "number" &&
                                    typeof col.options === "string"
                                        ? this.options[col.options][
                                              rowData[col.id]
                                          ].name
                                        : rowData[col.id] ?? "";
                            if (typeof col.groupby === "number")
                                cell.width = "0fr";
                            // set event listener
                            if (typeof col.action !== "undefined") {
                                for (const [key, value] of Object.entries(
                                    col.action
                                )) {
                                    cell.addEventListener(key, eval(value));
                                }
                            }
                            row.appendChild(cell);
                        }
                        last.appendChild(row);
                    } else {
                        if (!groups.includes(rowData.col))
                            groups.push(rowData.col);
                        const id = groups.indexOf(rowData.col);
                        let parent = this.tbody,
                            wrapper = document.createElement("div"),
                            divider = document.createElement("button");
                        wrapper.setAttribute("role", "presentation");
                        last = document.createElement("div");
                        if (id > 0)
                            for (let i = 0; i < id; i++) {
                                parent = parent.lastElementChild;
                            }
                        // set divider text content
                        if (
                            rowData.name &&
                            typeof this.cols[rowData.col].options ===
                                "string" &&
                            (typeof this.cols[rowData.col].sortby ===
                                "undefined" ||
                                this.cols[rowData.col].sortby === 0)
                        ) {
                            divider.textContent =
                                this.options[this.cols[rowData.col].options][
                                    rowData.name
                                ].name;
                        } else divider.textContent = rowData.name ?? "";

                        // find aria role for group dividers
                        wrapper.addEventListener("click", (e) => {
                            e.currentTarget.nextElementSibling.classList.toggle(
                                "collapsed"
                            );
                        });
                        wrapper.appendChild(divider);
                        appendChildren(parent, [wrapper, last]);
                    }
                    limit++;
                }
                // add observer to tenth row:
                // if tenth row intersect with table top
                // load the ten next rows
                //
            }
            console.log(performance.now() - start + "ms draw");
        }
    }
    reset() {
        // delete this.sortCol;
        delete this.sorted;
        socket.send({
            f: 2501,
            i: SweetTable.tables.indexOf(this),
            t: this.task,
        });
    }
    /**
     * Resize column with next column.
     * @param {Number} col
     */
    resizeCol(col) {
        const table = this;
        let nextCol;
        for (let i = col.id + 1; i < this.cols.length; i++)
            if (this.cols[i].head.offsetWidth > 0) {
                nextCol = i;
                console.log(i);
                break;
            }
        const bothWidth =
            col.head.offsetWidth + this.cols[nextCol].head.offsetWidth;

        this.table.classList.add("resize");
        this.menu.wrapper.classList.add("hide");

        // on pointerdown convert every fr into px
        // apply modification of col as difference with next visible col width
        // on release, convert back to fr

        const onPointerMove = (e) => {
            const width = e.pageX - col.head.getBoundingClientRect().left,
                nextWidth = bothWidth - width;
            if (width > 32 && nextWidth > 32) {
                table.cols[col.id].width = `${width}px`;
                table.cols[nextCol].width = `${nextWidth}px`;
                table.colGrid();
            }
        };
        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener(
            "pointerup",
            () => {
                document.removeEventListener("pointermove", onPointerMove);
                this.table.classList.remove("resize");
            },
            { once: true }
        );
        document.body.addEventListener(
            "pointerleave",
            () => {
                document.removeEventListener("pointermove", onPointerMove);
                this.table.classList.remove("resize");
            },
            { once: true }
        );
    }
    /**
     * Searches the table for provided string. If id, then limit the search to column[id].
     * @param {String} str
     * @param {Number} [id]
     */
    search(str, id) {
        const start = performance.now();
        delete this.search.rows;
        delete this.search.string;
        delete this.search.col;
        if (str) {
            this.rows = this.rows.filter(
                (row) => Array.isArray(row) && !this.tempRows?.includes(row)
            );
            delete this.tempRows;
            this.search.string = str;
            // if (id) this.search.col = id;
            this.search.col = id ?? this.menu.col ?? undefined;
            let match;
            const words = str.split(" ").map((x) => normalizePlus(x)),
                compare = (string) => {
                    for (let i = match.length - 1; i >= 0; i--) {
                        if (normalizePlus(string).includes(match[i]))
                            match.splice(i, 1);
                    }
                },
                checkCell = (param, index) => {
                    if (!param) return;
                    switch (typeof param) {
                        case "number":
                            typeof this.cols[index].options === "string"
                                ? compare(
                                      this.options[this.cols[index].options][
                                          `${param}`
                                      ].name
                                  )
                                : compare(`${param}`);
                            break;
                        case "object":
                            typeof param[0] === "number" &&
                            typeof this.cols[index].options === "string"
                                ? param.some((value) =>
                                      compare(
                                          this.options[
                                              this.cols[index].options
                                          ][`${value}`].name
                                      )
                                  )
                                : param.some((value) => compare(`${value}`));
                            break;
                        default:
                            compare(param);
                    }
                },
                checkRow = (row, cols) => {
                    match = [...words];
                    cols.map((col) => checkCell(row[col], col));
                };
            this.search.rows = this.rows.filter((row) => {
                const cols = this.search.col
                    ? [this.search.col]
                    : this.cols.map((x) => x.id);
                checkRow(row, cols);
                return match.length > 0 ? false : true;
            });
        }
        console.log(performance.now() - start + "ms search");
        this.sort();
    }
    setGroupBy(id) {
        const groups = this.setGroups().map((x) => x[1]);
        // if (groups.length === 0) this.cols[id].groupby = 0;else
        if (groups.includes(id)) {
            const index = groups.indexOf(id);
            if (index > 0) {
                this.cols[id].groupby = index - 1;
                this.cols[groups[index - 1]].groupby = index;
            } else {
                groups.map((x, index) => (this.cols[x].groupby = index - 1));
                delete this.cols[id].groupby;
            }
        } else {
            this.cols[id].groupby =
                groups.length > 0
                    ? this.cols[groups[groups.length - 1]].groupby + 1
                    : 0;
        }
        if (typeof this.cols[id].sorting === "undefined")
            this.cols[id].sorting = 0;
        this.sort();
    }
    setGroups() {
        let groups = [];
        for (const col of this.cols) {
            if (typeof col.groupby === "number")
                groups.push({
                    col: col.id,
                    dir: col.sorting ?? 0,
                    id: col.groupby,
                });
        }
        return quicksort(groups, [[0, "id"]]).map((x) => [x.dir, x.col]);
    }
    setSortBy(id) {
        for (const col of this.cols) {
            if (col.id === id) {
                if (typeof col.groupby === "number")
                    col.sorting =
                        typeof col.sorting === "number" && col.sorting === 0
                            ? 1
                            : 0;
                else if (typeof col.sorting === "undefined") col.sorting = 0;
                else if (col.sorting === 0) col.sorting = 1;
                else {
                    delete col.sorting;
                    this.cols[0].sorting = 0;
                }
            } else {
                if (
                    typeof col.groupby === "undefined" &&
                    typeof col.sorting === "number"
                )
                    delete col.sorting;
            }
        }
        this.sort();
    }
    /**
     * Sorts rows and apply result to table. If array provided, sorts this one instead of default data.
     * @param {Array[]} [arr]
     */
    sort() {
        // Set menu icons and values
        let sortCol = [0, 0],
            groups = [];
        // groupRows = [];
        for (const col of this.cols) {
            col.sortIcon.className = "";
            if (typeof col.groupby === "number") {
                groups.push({
                    col: col.id,
                    dir: col.sorting ?? 0,
                    id: col.groupby,
                });
                col.groupIcon.className = "on";
                col.groupIcon.lastElementChild.textContent = col.groupby;
                col.sortIcon.className =
                    typeof col.sorting === "number" && col.sorting === 1
                        ? "up"
                        : "down";
            } else {
                col.groupIcon.className = "";
                col.groupIcon.lastElementChild.textContent = "";
                if (typeof col.sorting === "number") {
                    sortCol = [col.sorting, col.id];
                }
            }
            col.visIcon.className =
                typeof col.width === "string" && col.width === "0fr"
                    ? "hide"
                    : "show";
        }
        this.cols[sortCol[1]].sortIcon.className =
            sortCol[0] === 1 ? "up" : "down";
        if (typeof this.menu.col === "number") {
            this.menu.icons.children[0].className =
                this.cols[this.menu.col].visIcon.className;
            this.menu.icons.children[1].className =
                this.cols[this.menu.col].groupIcon.className;
            this.menu.icons.children[1].lastElementChild.textContent =
                this.cols[this.menu.col].groupIcon.lastElementChild.textContent;
            this.menu.icons.children[2].className =
                this.cols[this.menu.col].sortIcon.className;
        }

        groups = quicksort(groups, [[0, "id"]]).map((x) => [x.dir, x.col]);
        // console.log(groups);
        let newSort = [...groups, [sortCol[0], sortCol[1]]];
        if (sortCol[1] !== 0) newSort.push([0, 0]);

        const action = (array) => {
            // strip dividers from rows
            array = array.filter(
                (row) => Array.isArray(row) && !this.tempRows?.includes(row)
            );
            delete this.tempRows;
            if (array.length > 0) {
                if (
                    typeof this.sorted === "undefined" ||
                    newSort !== this.sorted
                ) {
                    const groupsMulti = groups.filter(
                        (group) => this.cols[group[1]].multi
                    );
                    if (groupsMulti.length > 0) {
                        this.tempRows = [];
                        // for each of those groups with col.multi
                        for (const group of groupsMulti) {
                            // duplicate x time the row, with cell values reorder so that each value is first one time.
                            array.map((row) => {
                                if (row[group[1]].length > 1) {
                                    // for each value except first (length)
                                    let a = [],
                                        b = [...row[group[1]]];
                                    for (
                                        let i = 1;
                                        i < row[group[1]].length;
                                        i++
                                    ) {
                                        // push duplicate row with row[group[1]]=array(last is first)
                                        b.splice(0, 0, b.pop());
                                        // console.log(b);
                                        a.push([...row]);
                                        a[i - 1][group[1]] = [...b];
                                    }
                                    this.tempRows.push(...a);
                                }
                            });
                        }
                        // console.warn(this.tempRows);
                        array = [...array, ...this.tempRows];
                    }
                    this.sorted = newSort;
                    quicksort(array, newSort);
                    // console.log(array);
                }
                // for each group col ASC, insert divider including VALUE, ROW INDEX, ID COL
                if (groups.length > 0) {
                    const firstRow = array[0];
                    let i = 0,
                        dividers = {},
                        last;
                    // on value change, add end:rowindex-1 to last divider, insert new divider at rowindex with start:rowindex+1
                    for (const [index, group] of groups.entries()) {
                        array.splice(i, 0, {
                            col: group[1],
                            name: Array.isArray(firstRow[group[1]])
                                ? firstRow[group[1]][0]
                                : firstRow[group[1]],
                            start: i + 1,
                            value: firstRow[group[1]],
                        });
                        dividers[group[1]] = {
                            last: i++,
                            value: Array.isArray(firstRow[group[1]])
                                ? firstRow[group[1]][0]
                                : firstRow[group[1]],
                        };
                        last = index;
                    }
                    // insert groups' dividers
                    for (const [id, row] of array.entries()) {
                        if (Array.isArray(row)) {
                            i = id;
                            for (const [index, group] of groups.entries()) {
                                const value = Array.isArray(row[group[1]])
                                    ? row[group[1]][0]
                                    : row[group[1]];
                                if (
                                    last < index ||
                                    value !== dividers[group[1]].value
                                ) {
                                    array[dividers[group[1]].last].end = id - 1;
                                    array.splice(i, 0, {
                                        col: group[1],
                                        name: Array.isArray(row[group[1]])
                                            ? row[group[1]][0]
                                            : row[group[1]],
                                        start: i + 1,
                                        value: row[group[1]],
                                    });
                                    dividers[group[1]] = {
                                        last: i++,
                                        value: value,
                                    };
                                    last = index;
                                }
                            }
                        }
                    }
                }
            }
            this.search.rows ? (this.search.rows = array) : (this.rows = array);
            this.populate();
        };
        action(this.search.rows ?? this.rows);
    }
    toggleColVis(col) {
        col.width =
            typeof col.width === "string" && col.width === "0fr"
                ? col.oriWidth
                : "0fr";
        // set colsDrop
        col.width === "0fr"
            ? this.menu.colsDrop.children[col.id].classList.add("shrunk")
            : this.menu.colsDrop.children[col.id].classList.remove("shrunk");
        // set icons
        this.cols.map((x) => {
            x.visIcon.className =
                typeof x.width === "string" && x.width === "0fr"
                    ? "hide"
                    : "show";
            if (x.id === this.menu.col)
                this.menu.icons.children[0].className = x.visIcon.className;
        });
        this.colGrid();
    }
}
