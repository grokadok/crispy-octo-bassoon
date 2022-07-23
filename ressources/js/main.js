let login = new ClassLogin(),
    socket,
    main;

class ClassMain {
    static el;
    /**
     * Loads main content from successful login's data.
     * @param {Object[]} data
     * @param {Number[]} data.chat
     * @param {Number[]} data.tabs
     */
    constructor(data) {
        ClassMain.el = this;
        main = this.wrapper;
        // parse data
        this.user = {
            attempts: data.attempts_total,
            name: data.name,
            options: data.options,
        };
        this.wrapper = document.getElementsByTagName("main")[0];
        this.chat = new BopChat(document.getElementById("chat"), data.chat);
        this.tabs = {
            active: data.active_tab ?? 1,
            data: data.tabs,
            item: [],
            map: data.tabs_map,
        };
        this.navbar = {
            ul: document.createElement("ul"),
            wrapper: document.getElementsByClassName("navbar")[0],
        };
        const localNavbar = localStorage.getItem("navbarClass");
        this.navbar.wrapper.className =
            "navbar " + (localNavbar !== null ? localNavbar : "left");
        if (localNavbar === null || localNavbar.split(" ").length < 2)
            this.navbar.wrapper.setAttribute(
                "style",
                localStorage.getItem("navbarStyle") ?? ""
            );
        this.topbar = {
            react: document.createElement("ul"),
            static: document.createElement("ul"),
            wrapper: document.getElementsByClassName("topbar")[0],
        };
        this.topbar.static.innerHTML = `<li>
            New
            <ul>
                <li>Email</li>
                <li>Ticket</li>
                <li>Contact</li>
                <li>Company</li>
            </ul>
            </li>
            <li>
            Search
            </li>`;
        appendChildren(this.topbar.wrapper, [
            this.topbar.react,
            this.topbar.static,
        ]);
        this.topbar.static
            .querySelector("ul:first-of-type li:first-of-type")
            .addEventListener("click", () => loadNewEmail());
        this.topbar.static
            .querySelector("ul:first-of-type li:nth-of-type(2)")
            .addEventListener("click", () => loadNewTicket());
        this.topbar.static
            .querySelector("ul:first-of-type li:nth-of-type(3)")
            .addEventListener("click", () => loadNewContact());
        this.topbar.static
            .querySelector("ul:first-of-type li:nth-of-type(4)")
            .addEventListener("click", () => loadNewCompany());

        // login.head.classList.add("logged");
        loadIn([
            this.wrapper,
            this.navbar.wrapper,
            this.topbar.wrapper,
            this.chat.wrapper,
        ]);

        // setTimeout(function () {
        //     login.wrapper.className = "login hidden";
        //     // login destroy
        // }, 200);

        this.navbar.wrapper.insertAdjacentHTML(
            "beforeend",
            `<div class="nav-logo-back"></div>
            <div class="nav-logo">
                <span class="nav-title">s</span>
                <svg class="waves" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
                    <defs>
                        <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z">
                        </path>
                    </defs>
                    <g class="parallax">
                        <use href="#gentle-wave" x="48" y="0">
                        </use>
                        <use href="#gentle-wave" x="48" y="3">
                        </use>
                        <use href="#gentle-wave" x="48" y="5">
                        </use>
                        <use href="#gentle-wave" x="48" y="7">
                        </use>
                    </g>
                </svg>
            </div>`
        );
        this.navbar.wrapper.insertBefore(
            this.navbar.ul,
            this.navbar.wrapper.children[1]
        );
        setElementDraggable(this.navbar.wrapper, {
            constrain: true,
            magnet: true,
        });
        this.navbar.wrapper
            .getElementsByClassName("nav-logo")[0]
            .addEventListener("pointerdown", (e) => {
                e.stopPropagation();
            });
        this.navbar.ul.addEventListener("pointerdown", (e) => {
            e.stopPropagation();
        });
        this.navbar.wrapper.addEventListener("pointerup", () => {
            this.navbarRelease();
        });
        // parse tabs
        this.prepareTab(this.tabs.map);
        let theme = document.createElement("li");
        let themeText = document.createElement("span"),
            logout = document.createElement("li"),
            logoutText = document.createElement("span");
        themeText.textContent = "theme";
        theme.appendChild(themeText);
        theme.insertAdjacentHTML(
            "beforeend",
            `<svg viewBox="0 0 20 20">
              <path d="M5.114,5.726c0.169,0.168,0.442,0.168,0.611,0c0.168-0.169,0.168-0.442,0-0.61L3.893,3.282c-0.168-0.168-0.442-0.168-0.61,0c-0.169,0.169-0.169,0.442,0,0.611L5.114,5.726z M3.955,10c0-0.239-0.193-0.432-0.432-0.432H0.932C0.693,9.568,0.5,9.761,0.5,10s0.193,0.432,0.432,0.432h2.591C3.761,10.432,3.955,10.239,3.955,10 M10,3.955c0.238,0,0.432-0.193,0.432-0.432v-2.59C10.432,0.693,10.238,0.5,10,0.5S9.568,0.693,9.568,0.932v2.59C9.568,3.762,9.762,3.955,10,3.955 M14.886,5.726l1.832-1.833c0.169-0.168,0.169-0.442,0-0.611c-0.169-0.168-0.442-0.168-0.61,0l-1.833,1.833c-0.169,0.168-0.169,0.441,0,0.61C14.443,5.894,14.717,5.894,14.886,5.726 M5.114,14.274l-1.832,1.833c-0.169,0.168-0.169,0.441,0,0.61c0.168,0.169,0.442,0.169,0.61,0l1.833-1.832c0.168-0.169,0.168-0.442,0-0.611C5.557,14.106,5.283,14.106,5.114,14.274 M19.068,9.568h-2.591c-0.238,0-0.433,0.193-0.433,0.432s0.194,0.432,0.433,0.432h2.591c0.238,0,0.432-0.193,0.432-0.432S19.307,9.568,19.068,9.568 M14.886,14.274c-0.169-0.168-0.442-0.168-0.611,0c-0.169,0.169-0.169,0.442,0,0.611l1.833,1.832c0.168,0.169,0.441,0.169,0.61,0s0.169-0.442,0-0.61L14.886,14.274z M10,4.818c-2.861,0-5.182,2.32-5.182,5.182c0,2.862,2.321,5.182,5.182,5.182s5.182-2.319,5.182-5.182C15.182,7.139,12.861,4.818,10,4.818M10,14.318c-2.385,0-4.318-1.934-4.318-4.318c0-2.385,1.933-4.318,4.318-4.318c2.386,0,4.318,1.933,4.318,4.318C14.318,12.385,12.386,14.318,10,14.318 M10,16.045c-0.238,0-0.432,0.193-0.432,0.433v2.591c0,0.238,0.194,0.432,0.432,0.432s0.432-0.193,0.432-0.432v-2.591C10.432,16.238,10.238,16.045,10,16.045" />
            </svg>
            <svg viewBox="0 0 20 20">
              <path d="M10.544,8.717l1.166-0.855l1.166,0.855l-0.467-1.399l1.012-0.778h-1.244L11.71,5.297l-0.466,1.244H10l1.011,0.778L10.544,8.717z M15.986,9.572l-0.467,1.244h-1.244l1.011,0.777l-0.467,1.4l1.167-0.855l1.165,0.855l-0.466-1.4l1.011-0.777h-1.244L15.986,9.572z M7.007,6.552c0-2.259,0.795-4.33,2.117-5.955C4.34,1.042,0.594,5.07,0.594,9.98c0,5.207,4.211,9.426,9.406,9.426c2.94,0,5.972-1.354,7.696-3.472c-0.289,0.026-0.987,0.044-1.283,0.044C11.219,15.979,7.007,11.759,7.007,6.552 M10,18.55c-4.715,0-8.551-3.845-8.551-8.57c0-3.783,2.407-6.999,5.842-8.131C6.549,3.295,6.152,4.911,6.152,6.552c0,5.368,4.125,9.788,9.365,10.245C13.972,17.893,11.973,18.55,10,18.55 M19.406,2.304h-1.71l-0.642-1.71l-0.642,1.71h-1.71l1.39,1.069l-0.642,1.924l1.604-1.176l1.604,1.176l-0.642-1.924L19.406,2.304z" />
          </svg>`
        );
        theme.addEventListener("click", (e) => {
            e.stopPropagation();
            this.switchTheme();
        });
        this.theme = { element: theme, options: ["light", "dark"] };
        this.theme.value = this.theme.options.indexOf(document.body.className);
        this.setThemeIcon();
        logoutText.textContent = "logout";
        logout.appendChild(logoutText);
        logout.insertAdjacentHTML(
            "beforeend",
            `<svg class="svg-icon" viewBox="0 0 20 20">
                  <polygon points="18.198,7.95 3.168,7.95 3.168,8.634 9.317,9.727 9.317,19.564 12.05,19.564 12.05,9.727 18.198,8.634 "></polygon>
                  <path d="M2.485,10.057v-3.41H2.473l0.012-4.845h1.366c0.378,0,0.683-0.306,0.683-0.683c0-0.378-0.306-0.683-0.683-0.683H1.119c-0.378,0-0.683,0.306-0.683,0.683c0,0.378,0.306,0.683,0.683,0.683h0.683v4.845C1.406,6.788,1.119,7.163,1.119,7.609v2.733c0,0.566,0.459,1.025,1.025,1.025c0.053,0,0.105-0.008,0.157-0.016l-0.499,5.481l5.9,2.733h0.931C8.634,13.266,5.234,10.458,2.485,10.057z"></path>
                  <path d="M18.169,6.584c-0.303-3.896-3.202-6.149-7.486-6.149c-4.282,0-7.183,2.252-7.484,6.149H18.169z M15.463,3.187c0.024,0.351-0.103,0.709-0.394,0.977c-0.535,0.495-1.405,0.495-1.94,0c-0.29-0.268-0.418-0.626-0.394-0.977C13.513,3.827,14.683,3.827,15.463,3.187z"></path>
                  <path d="M18.887,10.056c-2.749,0.398-6.154,3.206-6.154,9.508h0.933l5.899-2.733L18.887,10.056z"></path>
						  </svg>`
        );
        logout.addEventListener("click", (e) => {
            e.stopPropagation();
            socket.close();
        });
        appendChildren(this.navbar.ul, [theme, logout]);
        // this.navbar.ul.appendChild(logout);

        // populate tabs
        this.loadTab(this.tabs.active);
        // populate nav

        this.tabs.data = {};
        // hide login show main
        loadOut([
            this.wrapper,
            this.navbar.wrapper,
            this.topbar.wrapper,
            this.chat.wrapper,
        ]);
        fadeIn(this.tabs.item[this.tabs.active].tab);
        // destroy login
        // show warning connection count
        if (data.attempts_total > 2)
            msg.new({
                content: `Bienvenue ${data.name} !
                    Pour information, ${data.attempts_total} tentatives de connexion
                    à votre compte ont échoué depuis la dernière connexion réussie.
                    Si ce nombre vous paraît anormal, vérifiez que votre compte soit bien sécurisé.`,
            });
    }
    /**
     * Appends a nav element to designated parent.
     * @param {Object} params
     * @param {Number} params.parent - ID of parent page.
     */
    appendNav(params) {}
    /**
     * Resets main, navbar and topbar elements, and chat object.
     */
    static destroy() {
        const main = ClassMain.el;
        main.chat.destroy();
        main.wrapper.innerHTML = "";
        main.navbar.wrapper.innerHTML = "";
        main.navbar.wrapper.className = "navbar left hidden loading";
        main.navbar.wrapper.style.top = "";
        main.navbar.wrapper.style.left = "";
        main.topbar.wrapper.innerHTML = "";
        main.topbar.wrapper.className = "topbar hidden loading";
        delete ClassMain.el;
    }
    getTab() {}
    logout() {
        // destroy everything
        // call login
    }
    /**
     * What happens when navbar is released from drag.
     */
    navbarRelease() {
        const navbarClasses = Array.from(this.navbar.wrapper.classList).filter(
            (x) => ["top", "right", "bottom", "left"].includes(x)
        );
        // store navbar settings in local
        navbarClasses.length === 1 &&
        (navbarClasses[0] === "top" || navbarClasses[0] === "bottom")
            ? localStorage.removeItem("navbarStyle")
            : localStorage.setItem(
                  "navbarStyle",
                  this.navbar.wrapper.getAttribute("style")
              );
        localStorage.setItem("navbarClass", navbarClasses.join(" "));
    }
    /**
     * Sets main element's class according to navbar position;
     */
    navbarSetMain() {
        this.wrapper.classList.remove("menu-left", "menu-right");
        if (this.navbar.wrapper.classList.contains("left")) {
            this.wrapper.classList.add("menu-left");
        } else if (this.navbar.wrapper.classList.contains("right")) {
            this.wrapper.classList.add("menu-right");
        }
    }
    parseTab(id, data) {
        this.tabs.data[id] = data;
        this.loadTab(id);
    }
    prepareTab(map, parentId = null) {
        for (const [id, children] of Object.entries(map)) {
            if (this.tabs.data[id]) {
                let newtab = document.createElement("div"),
                    newnav = document.createElement("li"),
                    navText = document.createElement("span");
                newtab.className =
                    this.tabs.active === id ? "tab" : "tab fadeout";
                navText.textContent = this.tabs.data[id].name;
                newnav.insertAdjacentHTML(
                    "beforeend",
                    this.tabs.data[id].icon.length > 0
                        ? this.tabs.data[id].icon
                        : `<svg class="svg-icon" viewBox="0 0 20 20">
                  <polygon points="18.198,7.95 3.168,7.95 3.168,8.634 9.317,9.727 9.317,19.564 12.05,19.564 12.05,9.727 18.198,8.634 "></polygon>
                  <path d="M2.485,10.057v-3.41H2.473l0.012-4.845h1.366c0.378,0,0.683-0.306,0.683-0.683c0-0.378-0.306-0.683-0.683-0.683H1.119c-0.378,0-0.683,0.306-0.683,0.683c0,0.378,0.306,0.683,0.683,0.683h0.683v4.845C1.406,6.788,1.119,7.163,1.119,7.609v2.733c0,0.566,0.459,1.025,1.025,1.025c0.053,0,0.105-0.008,0.157-0.016l-0.499,5.481l5.9,2.733h0.931C8.634,13.266,5.234,10.458,2.485,10.057z"></path>
                  <path d="M18.169,6.584c-0.303-3.896-3.202-6.149-7.486-6.149c-4.282,0-7.183,2.252-7.484,6.149H18.169z M15.463,3.187c0.024,0.351-0.103,0.709-0.394,0.977c-0.535,0.495-1.405,0.495-1.94,0c-0.29-0.268-0.418-0.626-0.394-0.977C13.513,3.827,14.683,3.827,15.463,3.187z"></path>
                  <path d="M18.887,10.056c-2.749,0.398-6.154,3.206-6.154,9.508h0.933l5.899-2.733L18.887,10.056z"></path>
						  </svg>`
                );
                newnav.appendChild(navText);

                // newnav.addEventListener("pointerdown", (e) => {
                //     e.stopPropagation();
                // });
                newnav.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.tabSwitch(id);
                });
                this.wrapper.appendChild(newtab);
                this.tabs.item[id] = { tab: newtab, li: newnav };
                if (this.tabs.data[id].actions?.length > 0) {
                    for (const value of this.tabs.data[id].actions) {
                        let newAction = document.createElement("li"),
                            text = document.createElement("span");
                        text.textContent = value.name;
                        newAction.insertAdjacentHTML(
                            "beforeend",
                            value.icon ??
                                `<svg viewBox="0 0 20 20">
							<path d="M17.645,7.262c-0.238-0.419-0.547-0.681-0.889-0.681C15.971,3.462,13.43,0.5,11.192,0.5C10.79,0.5,10.39,0.598,10,0.772C9.61,0.598,9.21,0.5,8.808,0.5c-2.238,0-4.779,2.962-5.564,6.08c-0.342,0-0.651,0.262-0.889,0.681C1.302,7.294,0.542,8.415,0.542,9.958c0,1.566,0.781,2.702,1.858,2.702c0.212,0,0.409-0.056,0.594-0.139c0.478,1.431,1.355,1.868,1.939,1.997v2.195c0,0.187,0.151,0.338,0.338,0.338c0.187,0,0.338-0.151,0.338-0.338v-0.778c0.488,0.874,1.471,1.566,2.702,1.903v0.564c0,0.187,0.151,0.338,0.338,0.338s0.338-0.151,0.338-0.338v-0.418c0.22,0.034,0.446,0.056,0.676,0.068v1.026c0,0.187,0.151,0.338,0.338,0.338s0.338-0.151,0.338-0.338v-1.026c0.23-0.012,0.456-0.033,0.676-0.068v0.418c0,0.187,0.151,0.338,0.338,0.338s0.338-0.151,0.338-0.338V17.84c1.232-0.337,2.215-1.029,2.702-1.903v0.778c0,0.187,0.151,0.338,0.338,0.338s0.338-0.151,0.338-0.338v-2.195c0.587-0.131,1.462-0.569,1.939-1.997c0.186,0.083,0.382,0.139,0.594,0.139c1.077,0,1.858-1.137,1.858-2.702C19.458,8.415,18.698,7.294,17.645,7.262z M2.4,11.647c-0.466,0-0.844-0.756-0.844-1.689c0-0.558,0.137-1.049,0.346-1.357c0.487,0.122,1.083,0.582,1.276,2.018C3.048,11.224,2.749,11.647,2.4,11.647z M12.094,7.98c0.171-0.171,0.737,0.119,1.264,0.647c0.528,0.528,0.817,1.094,0.647,1.264c-0.171,0.171-0.737-0.119-1.264-0.647C12.213,8.717,11.923,8.151,12.094,7.98z M6.66,8.627C7.188,8.099,7.754,7.81,7.924,7.98c0.171,0.171-0.119,0.737-0.647,1.264C6.75,9.772,6.184,10.062,6.013,9.891C5.843,9.721,6.132,9.155,6.66,8.627z M14.701,13.216c-0.04,0.005-0.08,0.008-0.12,0.008c-0.76,0-1.409-0.939-1.484-1.051c-1.236-1.855-3.078-1.876-3.097-1.876c-0.075,0.001-1.869,0.034-3.097,1.876c-0.079,0.118-0.798,1.144-1.604,1.043c-0.451-0.061-0.796-0.439-1.025-1.124l0.641-0.214c0.134,0.402,0.306,0.645,0.472,0.668c0.286,0.041,0.735-0.424,0.953-0.749C7.776,9.646,9.91,9.621,10,9.621s2.224,0.025,3.659,2.177c0.218,0.325,0.683,0.789,0.953,0.748c0.166-0.022,0.338-0.266,0.472-0.668l0.641,0.214C15.497,12.777,15.152,13.155,14.701,13.216z M17.6,11.647c-0.349,0-0.649-0.424-0.777-1.028c0.193-1.435,0.789-1.895,1.276-2.018c0.209,0.308,0.346,0.798,0.346,1.357C18.445,10.891,18.067,11.647,17.6,11.647z"></path>
						                </svg>`
                        );
                        newAction.appendChild(text);
                        newAction.addEventListener("pointerdown", (e) => {
                            e.stopPropagation();
                        });
                        newAction.addEventListener("click", (e) => {
                            e.stopPropagation();
                            eval(value.action);
                        });
                        if (!this.tabs.item[id].ul) {
                            const ul = document.createElement("ul");
                            newnav.appendChild(ul);
                            this.tabs.item[id].ul = ul;
                        }
                        this.tabs.item[id].ul.appendChild(newAction);
                    }
                }
                if (parentId) {
                    const parent = this.tabs.item[parentId];
                    if (!parent.ul) {
                        const ul = document.createElement("ul");
                        parent.li.appendChild(ul);
                        parent.ul = ul;
                    }
                    parent.ul.appendChild(newnav);
                } else this.navbar.ul.appendChild(newnav);
                if (typeof children === "object") {
                    this.prepareTab(children, id);
                }
            }
        }
    }
    setThemeIcon() {
        for (let [key, value] of this.theme.options.entries()) {
            const svg = this.theme.element.getElementsByTagName("svg")[key];
            key === this.theme.value
                ? svg.classList.remove("hide")
                : svg.classList.add("hide");
        }
    }
    switchTheme() {
        // set theme.value to next option if exist, else 0
        this.theme.value =
            this.theme.value < this.theme.options.length - 1
                ? this.theme.value + 1
                : 0;
        const theme = this.theme.options[this.theme.value];
        this.setThemeIcon();
        document.body.className = theme;
        localStorage.setItem("theme", theme);
    }
    tabSwitch(id) {
        // if tab not loaded, loadTab(id)
        if (this.tabs.item[id].tab.children.length === 0) this.loadTab(id);
        else {
            // this.title.textContent = this.tabs.data[id].name;
            this.topbar.react.innerHTML = this.tabs.data[id]?.toolbar ?? "";
        }
        localStorage.setItem("active_tab", id);
        fadeOut(this.tabs.item[this.tabs.active].tab);
        this.tabs.item[this.tabs.active].li.classList.remove("active");
        fadeIn(this.tabs.item[id].tab);
        this.tabs.item[id].li.classList.add("active");
        this.tabs.active = id;
    }
    loadTab(id) {
        if (this.tabs.data[id]?.fields) {
            let title = document.createElement("h1");
            title.textContent = this.tabs.data[id].name;
            this.tabs.item[id].tab.appendChild(title);
            // create fields and topbar elements
            for (const field of this.tabs.data[id].fields) {
                this.tabs.item[id].tab.appendChild(new Field(field).wrapper);
            }
            this.topbar.react.innerHTML = this.tabs.data[id].toolbar ?? "";
        } else {
            socket.send({
                f: 20,
                i: id,
            });
        }
    }
}

// function mainView(name, list) {
//     login.innerHTML = "";
//     let nav_links = "",
//         top_toolbar = "",
//         top_title = "";
//     list.forEach(function (num_page) {
//         nav_links =
//             nav_links +
//             `<li class="nav-item nav-tab">
//                 <a class="nav-link">
//                     ${pages[num_page]["icon"]}
//                     <span class="link-text">${pages[num_page]["name"]}</span>
//                 </a>
//             </li>`;
//         top_toolbar =
//             top_toolbar === ""
//                 ? `<ul class="toolbar">${pages[num_page]["toolbar"]}</ul>`
//                 : top_toolbar +
//                   `<ul class="toolbar hide">${pages[num_page]["toolbar"]}</ul>`;
//         if (top_title === "") top_title = pages[num_page]["name"];
//     });

//     main.innerHTML = "";

//     list.forEach(function (num_page) {
//         let tab = document.createElement("div");
//         tab.className = main.children.length === 0 ? "tab" : "tab fadeout";
//         pages[num_page].parent = tab;
//         for (const field of pages[num_page].fields)
//             tab.append(new Field(field).wrapper);
//         main.append(tab);
//     });
//     top_toolbar =
//         top_toolbar +
//         `<ul id="static-topbar">
//             <li>
//             New
//             <ul>
//                 <li>Email</li>
//                 <li>Ticket</li>
//                 <li>Contact</li>
//                 <li>Company</li>
//             </ul>
//             </li>
//             <li>
//             Search
//             </li>
//         </ul>`;

//     navbar.innerHTML = `<div class="nav-logo">
//       <span class="nav-title">SEADESK</span>
//       <svg class="waves" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
//         <defs>
//           <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z">
//           </path>
//         </defs>
//         <g class="parallax">
//           <use href="#gentle-wave" x="48" y="0">
//           </use>
//           <use href="#gentle-wave" x="48" y="3">
//           </use>
//           <use href="#gentle-wave" x="48" y="5">
//           </use>
//           <use href="#gentle-wave" x="48" y="7">
//           </use>
//         </g>
//       </svg>
//     </div>
//     <ul class="nav-top">
//       ${nav_links}
//     </ul>
//     <ul class="nav-bottom">
//       <li class="nav-item">
//         <a class="nav-link">
//           <svg class="svg-icon" viewBox="0 0 20 20">
//             <path fill="none" d="M10,10.9c2.373,0,4.303-1.932,4.303-4.306c0-2.372-1.93-4.302-4.303-4.302S5.696,4.223,5.696,6.594C5.696,8.969,7.627,10.9,10,10.9z M10,3.331c1.801,0,3.266,1.463,3.266,3.263c0,1.802-1.465,3.267-3.266,3.267c-1.8,0-3.265-1.465-3.265-3.267C6.735,4.794,8.2,3.331,10,3.331z" style="--darkreader-inline-fill: none;" data-darkreader-inline-fill=""></path>
//             <path fill="none" d="M10,12.503c-4.418,0-7.878,2.058-7.878,4.685c0,0.288,0.231,0.52,0.52,0.52c0.287,0,0.519-0.231,0.519-0.52c0-1.976,3.132-3.646,6.84-3.646c3.707,0,6.838,1.671,6.838,3.646c0,0.288,0.234,0.52,0.521,0.52s0.52-0.231,0.52-0.52C17.879,14.561,14.418,12.503,10,12.503z" style="--darkreader-inline-fill: none;" data-darkreader-inline-fill=""></path>
//           </svg>
//           <span class="link-text">Compte</span>
//         </a>
//       </li>
//       <li class="nav-item">
//         <a class="nav-link">
//         <svg class="svg-icon" viewBox="0 0 20 20">
//           <path d="M8.627,7.885C8.499,8.388,7.873,8.101,8.13,8.177L4.12,7.143c-0.218-0.057-0.351-0.28-0.293-0.498c0.057-0.218,0.279-0.351,0.497-0.294l4.011,1.037C8.552,7.444,8.685,7.667,8.627,7.885 M8.334,10.123L4.323,9.086C4.105,9.031,3.883,9.162,3.826,9.38C3.769,9.598,3.901,9.82,4.12,9.877l4.01,1.037c-0.262-0.062,0.373,0.192,0.497-0.294C8.685,10.401,8.552,10.18,8.334,10.123 M7.131,12.507L4.323,11.78c-0.218-0.057-0.44,0.076-0.497,0.295c-0.057,0.218,0.075,0.439,0.293,0.495l2.809,0.726c-0.265-0.062,0.37,0.193,0.495-0.293C7.48,12.784,7.35,12.562,7.131,12.507M18.159,3.677v10.701c0,0.186-0.126,0.348-0.306,0.393l-7.755,1.948c-0.07,0.016-0.134,0.016-0.204,0l-7.748-1.948c-0.179-0.045-0.306-0.207-0.306-0.393V3.677c0-0.267,0.249-0.461,0.509-0.396l7.646,1.921l7.654-1.921C17.91,3.216,18.159,3.41,18.159,3.677 M9.589,5.939L2.656,4.203v9.857l6.933,1.737V5.939z M17.344,4.203l-6.939,1.736v9.859l6.939-1.737V4.203z M16.168,6.645c-0.058-0.218-0.279-0.351-0.498-0.294l-4.011,1.037c-0.218,0.057-0.351,0.28-0.293,0.498c0.128,0.503,0.755,0.216,0.498,0.292l4.009-1.034C16.092,7.085,16.225,6.863,16.168,6.645 M16.168,9.38c-0.058-0.218-0.279-0.349-0.498-0.294l-4.011,1.036c-0.218,0.057-0.351,0.279-0.293,0.498c0.124,0.486,0.759,0.232,0.498,0.294l4.009-1.037C16.092,9.82,16.225,9.598,16.168,9.38 M14.963,12.385c-0.055-0.219-0.276-0.35-0.495-0.294l-2.809,0.726c-0.218,0.056-0.351,0.279-0.293,0.496c0.127,0.506,0.755,0.218,0.498,0.293l2.807-0.723C14.89,12.825,15.021,12.603,14.963,12.385"></path>
//         </svg>
//           <span class="link-text">Services</span>
//         </a>
//       </li>
//       <li class="nav-item">
//         <a class="nav-link">
//           <svg class="svg-icon" viewBox="0 0 20 20">
//             <path fill="none" d="M10.032,8.367c-1.112,0-2.016,0.905-2.016,2.018c0,1.111,0.904,2.014,2.016,2.014c1.111,0,2.014-0.902,2.014-2.014C12.046,9.271,11.143,8.367,10.032,8.367z M10.032,11.336c-0.525,0-0.953-0.427-0.953-0.951c0-0.526,0.427-0.955,0.953-0.955c0.524,0,0.951,0.429,0.951,0.955C10.982,10.909,10.556,11.336,10.032,11.336z" style="--darkreader-inline-fill: none;" data-darkreader-inline-fill=""></path>
//             <path fill="none" d="M17.279,8.257h-0.785c-0.107-0.322-0.237-0.635-0.391-0.938l0.555-0.556c0.208-0.208,0.208-0.544,0-0.751l-2.254-2.257c-0.199-0.2-0.552-0.2-0.752,0l-0.556,0.557c-0.304-0.153-0.617-0.284-0.939-0.392V3.135c0-0.294-0.236-0.532-0.531-0.532H8.435c-0.293,0-0.531,0.237-0.531,0.532v0.784C7.582,4.027,7.269,4.158,6.966,4.311L6.409,3.754c-0.1-0.1-0.234-0.155-0.376-0.155c-0.141,0-0.275,0.055-0.375,0.155L3.403,6.011c-0.208,0.207-0.208,0.543,0,0.751l0.556,0.556C3.804,7.622,3.673,7.935,3.567,8.257H2.782c-0.294,0-0.531,0.238-0.531,0.531v3.19c0,0.295,0.237,0.531,0.531,0.531h0.787c0.105,0.318,0.236,0.631,0.391,0.938l-0.556,0.559c-0.208,0.207-0.208,0.545,0,0.752l2.254,2.254c0.208,0.207,0.544,0.207,0.751,0l0.558-0.559c0.303,0.154,0.616,0.285,0.938,0.391v0.787c0,0.293,0.238,0.531,0.531,0.531h3.191c0.295,0,0.531-0.238,0.531-0.531v-0.787c0.322-0.105,0.636-0.236,0.938-0.391l0.56,0.559c0.208,0.205,0.546,0.207,0.752,0l2.252-2.254c0.208-0.207,0.208-0.545,0.002-0.752l-0.559-0.559c0.153-0.303,0.285-0.615,0.389-0.938h0.789c0.295,0,0.532-0.236,0.532-0.531v-3.19C17.812,8.495,17.574,8.257,17.279,8.257z M16.747,11.447h-0.653c-0.241,0-0.453,0.164-0.514,0.398c-0.129,0.496-0.329,0.977-0.594,1.426c-0.121,0.209-0.089,0.473,0.083,0.645l0.463,0.465l-1.502,1.504l-0.465-0.463c-0.174-0.174-0.438-0.207-0.646-0.082c-0.447,0.262-0.927,0.463-1.427,0.594c-0.234,0.061-0.397,0.271-0.397,0.514V17.1H8.967v-0.652c0-0.242-0.164-0.453-0.397-0.514c-0.5-0.131-0.98-0.332-1.428-0.594c-0.207-0.123-0.472-0.09-0.646,0.082l-0.463,0.463L4.53,14.381l0.461-0.463c0.169-0.172,0.204-0.434,0.083-0.643c-0.266-0.461-0.467-0.939-0.596-1.43c-0.06-0.234-0.272-0.398-0.514-0.398H3.313V9.319h0.652c0.241,0,0.454-0.162,0.514-0.397c0.131-0.498,0.33-0.979,0.595-1.43c0.122-0.208,0.088-0.473-0.083-0.645L4.53,6.386l1.503-1.504l0.46,0.462c0.173,0.172,0.437,0.204,0.646,0.083c0.45-0.265,0.931-0.464,1.433-0.597c0.233-0.062,0.396-0.274,0.396-0.514V3.667h2.128v0.649c0,0.24,0.161,0.452,0.396,0.514c0.502,0.133,0.982,0.333,1.433,0.597c0.211,0.12,0.475,0.089,0.646-0.083l0.459-0.462l1.504,1.504l-0.463,0.463c-0.17,0.171-0.202,0.438-0.081,0.646c0.263,0.448,0.463,0.928,0.594,1.427c0.061,0.235,0.272,0.397,0.514,0.397h0.651V11.447z" style="--darkreader-inline-fill: none;" data-darkreader-inline-fill=""></path>
//           </svg>
//           <span class="link-text">Réglages</span>
//         </a>
//       </li>
//       <div class="nav-dropdown">
//         <div class="nav-section">
//           <h2 class="nav-section-title">Compte</h2>
//           <span class="nav-section-field">Nom</span>
//           <input type="text" placeholder="Nom">
//           <span class="nav-section-field">Prénom</span>
//           <input type="text" placeholder="Prénom">
//           <span class="nav-section-field">Adresse email</span>
//           <input type="email" id="email" pattern="^[\\w!#$%&’*+/=?\`{|}~^-]+(?:\\.[\\w!#$%&’*+/=?\`{|}~^-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,6}$" placeholder="Veuillez entrer votre adresse email">
//           <span class="nav-section-field">Téléphone portable</span>
//           <input type="tel" id="phone">
//         </div>
//         <div class="nav-section">
//           <h2 class="nav-section-title">Services</h2>
//           <ul>
//             <li>Ticketing</li>
//             <li>eMailing</li>
//             <li>SMSing</li>
//             <li>Permanence téléphonique</li>
//             <li>Téléprospection</li>
//             <li>Suivi de livraisons</li>
//           </ul>
//         </div>
//         <div class="nav-section">
//           <h2 class="nav-section-title">réglages</h2>
//           <ul>
//             <li>
//               <a id="solar" href="#" class="nav-link">
//                 <svg aria-hidden="true" focusable="false" data-prefix="fad" data-icon="sunglasses" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
//                   <g class="fa-group">
//                     <path fill="currentColor" d="M574.09 280.38L528.75 98.66a87.94 87.94 0 0 0-113.19-62.14l-15.25 5.08a16 16 0 0 0-10.12 20.25L395.25 77a16 16 0 0 0 20.22 10.13l13.19-4.39c10.87-3.63 23-3.57 33.15 1.73a39.59 39.59 0 0 1 20.38 25.81l38.47 153.83a276.7 276.7 0 0 0-81.22-12.47c-34.75 0-74 7-114.85 26.75h-73.18c-40.85-19.75-80.07-26.75-114.85-26.75a276.75 276.75 0 0 0-81.22 12.45l38.47-153.8a39.61 39.61 0 0 1 20.38-25.82c10.15-5.29 22.28-5.34 33.15-1.73l13.16 4.39A16 16 0 0 0 180.75 77l5.06-15.19a16 16 0 0 0-10.12-20.21l-15.25-5.08A87.95 87.95 0 0 0 47.25 98.65L1.91 280.38A75.35 75.35 0 0 0 0 295.86v70.25C0 429 51.59 480 115.19 480h37.12c60.28 0 110.38-45.94 114.88-105.37l2.93-38.63h35.76l2.93 38.63c4.5 59.43 54.6 105.37 114.88 105.37h37.12C524.41 480 576 429 576 366.13v-70.25a62.67 62.67 0 0 0-1.91-15.5zM203.38 369.8c-2 25.9-24.41 46.2-51.07 46.2h-37.12C87 416 64 393.63 64 366.11v-37.55a217.35 217.35 0 0 1 72.59-12.9 196.51 196.51 0 0 1 69.91 12.9zM512 366.13c0 27.5-23 49.87-51.19 49.87h-37.12c-26.69 0-49.1-20.3-51.07-46.2l-3.12-41.24a196.55 196.55 0 0 1 69.94-12.9A217.41 217.41 0 0 1 512 328.58z" class="fa-secondary">
//                     </path>
//                     <path fill="currentColor" d="M64.19 367.9c0-.61-.19-1.18-.19-1.8 0 27.53 23 49.9 51.19 49.9h37.12c26.66 0 49.1-20.3 51.07-46.2l3.12-41.24c-14-5.29-28.31-8.38-42.78-10.42zm404-50l-95.83 47.91.3 4c2 25.9 24.38 46.2 51.07 46.2h37.12C489 416 512 393.63 512 366.13v-37.55a227.76 227.76 0 0 0-43.85-10.66z" class="fa-primary">
//                     </path>
//                   </g>
//                 </svg>
//                 <span class="link-text">
//                   Solar
//                 </span>
//               </a>
//             </li>
//           </ul>
//         </div>
//       </div>
//       <li class="nav-item" id="themeButton">
//         <a id="themify" href="#" class="nav-link">
//           <svg id="darkIcon" aria-hidden="true" focusable="false" data-prefix="fad" data-icon="moon-stars" role="img" viewBox="0 0 20 20">
//             <g class="fa-group">
//               <path fill="currentColor" d="M10.544,8.717l1.166-0.855l1.166,0.855l-0.467-1.399l1.012-0.778h-1.244L11.71,5.297l-0.466,1.244H10l1.011,0.778L10.544,8.717z M15.986,9.572l-0.467,1.244h-1.244l1.011,0.777l-0.467,1.4l1.167-0.855l1.165,0.855l-0.466-1.4l1.011-0.777h-1.244L15.986,9.572z M7.007,6.552c0-2.259,0.795-4.33,2.117-5.955C4.34,1.042,0.594,5.07,0.594,9.98c0,5.207,4.211,9.426,9.406,9.426c2.94,0,5.972-1.354,7.696-3.472c-0.289,0.026-0.987,0.044-1.283,0.044C11.219,15.979,7.007,11.759,7.007,6.552 M10,18.55c-4.715,0-8.551-3.845-8.551-8.57c0-3.783,2.407-6.999,5.842-8.131C6.549,3.295,6.152,4.911,6.152,6.552c0,5.368,4.125,9.788,9.365,10.245C13.972,17.893,11.973,18.55,10,18.55 M19.406,2.304h-1.71l-0.642-1.71l-0.642,1.71h-1.71l1.39,1.069l-0.642,1.924l1.604-1.176l1.604,1.176l-0.642-1.924L19.406,2.304z" class="fa-primary">
//               </path>
//             </g>
//           </svg>
//           <svg id="lightIcon" aria-hidden="true" focusable="false" data-prefix="fad" data-icon="sun" role="img" viewBox="0 0 20 20">
//             <g class="fa-group">
//               <path fill="currentColor" d="M5.114,5.726c0.169,0.168,0.442,0.168,0.611,0c0.168-0.169,0.168-0.442,0-0.61L3.893,3.282c-0.168-0.168-0.442-0.168-0.61,0c-0.169,0.169-0.169,0.442,0,0.611L5.114,5.726z M3.955,10c0-0.239-0.193-0.432-0.432-0.432H0.932C0.693,9.568,0.5,9.761,0.5,10s0.193,0.432,0.432,0.432h2.591C3.761,10.432,3.955,10.239,3.955,10 M10,3.955c0.238,0,0.432-0.193,0.432-0.432v-2.59C10.432,0.693,10.238,0.5,10,0.5S9.568,0.693,9.568,0.932v2.59C9.568,3.762,9.762,3.955,10,3.955 M14.886,5.726l1.832-1.833c0.169-0.168,0.169-0.442,0-0.611c-0.169-0.168-0.442-0.168-0.61,0l-1.833,1.833c-0.169,0.168-0.169,0.441,0,0.61C14.443,5.894,14.717,5.894,14.886,5.726 M5.114,14.274l-1.832,1.833c-0.169,0.168-0.169,0.441,0,0.61c0.168,0.169,0.442,0.169,0.61,0l1.833-1.832c0.168-0.169,0.168-0.442,0-0.611C5.557,14.106,5.283,14.106,5.114,14.274 M19.068,9.568h-2.591c-0.238,0-0.433,0.193-0.433,0.432s0.194,0.432,0.433,0.432h2.591c0.238,0,0.432-0.193,0.432-0.432S19.307,9.568,19.068,9.568 M14.886,14.274c-0.169-0.168-0.442-0.168-0.611,0c-0.169,0.169-0.169,0.442,0,0.611l1.833,1.832c0.168,0.169,0.441,0.169,0.61,0s0.169-0.442,0-0.61L14.886,14.274z M10,4.818c-2.861,0-5.182,2.32-5.182,5.182c0,2.862,2.321,5.182,5.182,5.182s5.182-2.319,5.182-5.182C15.182,7.139,12.861,4.818,10,4.818M10,14.318c-2.385,0-4.318-1.934-4.318-4.318c0-2.385,1.933-4.318,4.318-4.318c2.386,0,4.318,1.933,4.318,4.318C14.318,12.385,12.386,14.318,10,14.318 M10,16.045c-0.238,0-0.432,0.193-0.432,0.433v2.591c0,0.238,0.194,0.432,0.432,0.432s0.432-0.193,0.432-0.432v-2.591C10.432,16.238,10.238,16.045,10,16.045" class="fa-primary">
//               </path>
//             </g>
//           </svg>
//           <span id="theme-text" class="link-text">
//             Light
//           </span>
//         </a>
//       </li>
//     </ul>`;
//     topbar.innerHTML = `<div class="title">${top_title}</div>${top_toolbar}`;
// }

// function staticTopbarListeners() {
//     const topbarStatic = document.getElementById("static-topbar"),
//         newEmail = topbarStatic.firstElementChild.firstElementChild.children[0],
//         newTicket =
//             topbarStatic.firstElementChild.firstElementChild.children[1],
//         newContact =
//             topbarStatic.firstElementChild.firstElementChild.children[2],
//         newCompany =
//             topbarStatic.firstElementChild.firstElementChild.children[3];
//     // topbarSearch = topbarStatic.children[1],
//     // topbarUser = topbarStatic.children[2];

//     newCompany.addEventListener("click", function () {
//         loadNewCompany();
//     });
//     newContact.addEventListener("click", function () {
//         loadNewContact();
//     });
//     newEmail.addEventListener("click", function () {
//         loadNewEmail();
//     });
//     newTicket.addEventListener("click", function () {
//         loadNewTicket();
//     });
// }
/**
 *
 * @param {Number[]} [idchat]
 */
// function loadMain(idchat) {
//     const logo = navbar.getElementsByClassName("nav-logo")[0],
//         phone = document.getElementById("phone"),
//         navBottomLinks = navbar
//             .getElementsByClassName("nav-bottom")[0]
//             .getElementsByClassName("nav-item"),
//         navSections = navbar.getElementsByClassName("nav-section");

//     intlTel = intlTelInput(phone, {
//         utilsScript: "./assets/intlTelInput/js/utils.js",
//         initialCountry: "fr",
//         preferredCountries: ["fr"],
//         onlyCountries: ["de", "fr", "es", "it", "ch", "gb"],
//         localizedCountries: {
//             de: "Deutschland",
//             ch: "Schweiz",
//             it: "Italia",
//             es: "España",
//         },
//     });
//     chat = new BopChat(mainChat, idchat);

//     // Event listeners
//     logo.addEventListener("click", () => {
//         if (socket.readyState() !== 3) socket.close("Tagada");
//     });
//     navTabs();
//     staticTopbarListeners();
//     for (let i = 0; i < navBottomLinks.length; i++) {
//         const link = navBottomLinks[i];
//         link.addEventListener("mouseover", function () {
//             for (let j = 0; j < navSections.length; j++) {
//                 j === i
//                     ? navSections[j].classList.remove("hide")
//                     : navSections[j].classList.add("hide");
//             }
//         });
//     }
//     themifyListeners();
// }

themifyCache();

// function initialView() {
//     if (topbar.getAttribute("data-name")) {
//         loadIn([main, navbar, topbar, mainChat]);
//         mainView(
//             topbar.getAttribute("data-name"),
//             pageSelector(topbar.getAttribute("data-role").split(","))
//         );
//         removeAttributes(topbar);
//         loadMain();
//         loadOut([main, navbar, topbar, mainChat]);
//     } else {
//         loginView();
//         loadLogin();
//     }
// }
// initialView();

login.load();

// Onload
window.onload = document.body.classList.remove("loading");
