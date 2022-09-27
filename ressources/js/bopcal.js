/**
 * Creates calendar in specified wrapper, with the ability to generate clones.
 */
class BopCal {
    static bopcals = [];
    static fullCalendars = [];
    static calendars = {};
    static events = [];
    /**
     *
     * @param {HTMLElement} element
     */
    constructor(element) {
        BopCal.bopcals.push(this);
        this.id = BopCal.bopcals.indexOf(this);
        this.controller = new AbortController();
        this.wrapper = element;
        this.wrapper.classList.add("bopcal");
        this.menu = document.createElement("div");
        this.menu.className = "menu";
        this.minical = {
            cal: document.createElement("div"),
            years: {},
            cursor: document.createElement("div"),
        };
        this.minical.cal.className = "mini";
        this.minical.cursor.className = "cursor";
        this.minical.cal.append(this.minical.cursor);
        this.bigcal = {
            cal: document.createElement("div"),
            layout: document.createElement("div"),
            wrapper: document.createElement("div"),
            years: {},
            info: document.createElement("div"),
        };
        this.bigcal.wrapper.className = "bigcal";
        this.bigcal.info.append(document.createElement("span"));
        this.bigcal.info.firstElementChild.textContent = "W##";
        this.bigcal.layout.append(document.createElement("div"));
        this.bigcal.wrapper.append(
            this.bigcal.layout,
            this.bigcal.info,
            this.bigcal.cal
        );
        this.toggle = document.createElement("button");
        this.toggle.textContent = "calendar";
        this.toggle.addEventListener("click", () => {
            this.bigcal.lock = false;
            this.bigcal.wrapper.classList.remove("locked");
            this.minicalFocus(new Date());
            this.toggle.blur();
            this.wrapper.classList.toggle("toggle");
        });
        this.weekstart = 1; // 0 = sunday
        // later get week info (start, weekend, etc.) according to locale browser settings
        // this.userLocale =
        //     navigator.languages && navigator.languages.length
        //         ? navigator.languages[0]
        //         : navigator.language;
        // get locale info from db for found userLocale.

        // layout
        // create 24 divs
        for (let i = 0; i < 24; i++) {
            let hour = document.createElement("div");
            hour.setAttribute("data-hour", convertIntToHour(i));
            this.bigcal.layout.firstElementChild.append(hour);
        }
        let isScrolling;
        const stopScrolling = () => {
            const x =
                    this.bigcal.info.offsetWidth +
                    this.bigcal.wrapper.offsetLeft,
                y = this.bigcal.wrapper.offsetTop + this.wrapper.offsetTop;
            const element = document
                .elementFromPoint(x + 1, y + 1)
                .closest("[data-date]");
            if (element) {
                // set week number
                this.bigcal.info.firstElementChild.textContent = `W${element
                    .closest("[data-week]")
                    .getAttribute("data-week")}`;
                let date = new Date(
                    parseInt(
                        element
                            .closest("[data-month]")
                            .getAttribute("data-value")
                    )
                );
                date.setDate(element.getAttribute("data-date"));
                if (element.classList.contains("fade")) {
                    element.getAttribute("data-date") > 15
                        ? date.setMonth(date.getMonth() - 1)
                        : date.setMonth(date.getMonth() + 1);
                }
                this.minicalFocus(date);
            }
        };
        this.bigcal.cal.addEventListener("scroll", (e) => {
            this.bigcal.layout.firstElementChild.style.top = `-${this.bigcal.cal.scrollTop}px`;
            this.editorHide();
            if (typeof this.bigcal.focus !== "undefined")
                delete this.bigcal.focus;
            // set timeout
            clearTimeout(isScrolling);
            isScrolling = setTimeout(() => {
                stopScrolling(
                    this.bigcal.cal.scrollLeft,
                    this.bigcal.cal.scrollTop
                );
            }, 100);
        });
        document.addEventListener("click", (e) => this.clickEvents(e), {
            signal: this.controller.signal,
        });
        this.bigcal.cal.addEventListener("dblclick", (e) => {
            // if day, create event on day, at time if view = week or day, else allday if month
            if (
                e.target.parentNode.getAttribute("data-date") &&
                e.target !== e.target.parentNode.firstElementChild
            ) {
                if (this.active) {
                    if (this.calendars[this.active].visible)
                        this.newEvent(this.getCursorDate(e));
                    else
                        msg.new({
                            type: "theme",
                            content:
                                "Le calendrier actif est caché, le révéler pour pouvoir créer un événement ?",
                            btn1listener: () => {
                                this.toggleCalVisibility(this.active);
                                msg.close();
                            },
                            btn1style: "success",
                            btn1text: "révéler",
                        });
                } else
                    msg.new({
                        type: "warning",
                        content:
                            "Aucun calendrier sélectionné pour la création d'un nouvel événement.",
                    });
            }
        });
        this.bigcal.cal.addEventListener("pointerdown", (e) => {
            // if target is event and event not focus, focus it
            if (e.target.closest("[data-uid]")) {
                const componentElement = e.target.closest("[data-uid]"),
                    idcal = componentElement.getAttribute("data-cal"),
                    uid = componentElement.getAttribute("data-uid"),
                    component = this.calendars[idcal].components[uid],
                    handleStart =
                        componentElement.getElementsByTagName("div")[0],
                    handleEnd = componentElement.getElementsByTagName("div")[1];
                if (this.focus && this.focus !== component) {
                    Object.values(this.focus.elements).forEach((x) =>
                        x.classList.remove("focus")
                    );
                    // this.focus.classList.remove("focus");
                }
                // componentElement.classList.add("focus");
                this.focus = component;
                Object.values(this.focus.elements).forEach((x) =>
                    x.classList.add("focus")
                );
                // move editor towards componentElement and fill with component's data;
                this.editorFocus(idcal, uid, componentElement);

                if (e.target === handleStart) {
                    const cal = this,
                        limit = this.bigcal.cal.getBoundingClientRect(),
                        origin = [component.start, component.end];
                    let applied = false;
                    // on mouse drag
                    function onPointerMove(e) {
                        if (
                            e.clientX > limit.left &&
                            e.clientX < limit.right &&
                            e.clientY > limit.top &&
                            e.clientY < limit.bottom
                        ) {
                            const newDate = dateGetClosestQuarter(
                                cal.getCursorDate(e)
                            );
                            // if cursor date < end date
                            if (newDate < component.end) {
                                // set start date to cursor date
                                // apply to object
                                component.start = newDate;
                                // apply to element
                                cal.placeComponent(idcal, uid);
                            }
                        }
                    }
                    document.addEventListener("pointermove", onPointerMove);
                    document.addEventListener(
                        "pointerup",
                        () => {
                            document.removeEventListener(
                                "pointermove",
                                onPointerMove
                            );
                            if (
                                !applied &&
                                (component.start.valueOf() !==
                                    origin[0].valueOf() ||
                                    component.end.valueOf() !==
                                        origin[1].valueOf())
                            ) {
                                // apply to db
                                // send function, start/stop, uid, modified
                                cal.componentApplyRange(idcal, uid);
                                applied = true;
                            }
                        },
                        { once: true }
                    );
                    document.addEventListener(
                        "pointerleave",
                        () => {
                            document.removeEventListener(
                                "pointermove",
                                onPointerMove
                            );
                            if (
                                !applied &&
                                (component.start.valueOf() !==
                                    origin[0].valueOf() ||
                                    component.end.valueOf() !==
                                        origin[1].valueOf())
                            ) {
                                // apply to db
                                cal.componentApplyRange(idcal, uid);
                                applied = true;
                            }
                        },
                        { once: true }
                    );
                } else if (e.target === handleEnd) {
                    // on mouse drag
                    const cal = this,
                        limit = this.bigcal.cal.getBoundingClientRect(),
                        origin = [component.start, component.end];
                    let applied = false;
                    // on mouse drag
                    function onPointerMove(e) {
                        if (
                            e.clientX > limit.left &&
                            e.clientX < limit.right &&
                            e.clientY > limit.top &&
                            e.clientY < limit.bottom
                        ) {
                            const newDate = dateGetClosestQuarter(
                                cal.getCursorDate(e)
                            );
                            // if cursor date > start date
                            if (newDate > component.start) {
                                // set end date to cursor date
                                // apply to element
                                component.end = newDate;
                                // apply to element
                                cal.placeComponent(idcal, uid);
                            }
                        }
                    }
                    document.addEventListener("pointermove", onPointerMove);
                    document.addEventListener(
                        "pointerup",
                        () => {
                            document.removeEventListener(
                                "pointermove",
                                onPointerMove
                            );
                            if (
                                !applied &&
                                (component.start.valueOf() !==
                                    origin[0].valueOf() ||
                                    component.end.valueOf() !==
                                        origin[1].valueOf())
                            ) {
                                // apply to db
                                cal.componentApplyRange(idcal, uid);
                                applied = true;
                            }
                        },
                        { once: true }
                    );
                    document.addEventListener(
                        "pointerleave",
                        () => {
                            document.removeEventListener(
                                "pointermove",
                                onPointerMove
                            );
                            if (
                                !applied &&
                                (component.start.valueOf() !==
                                    origin[0].valueOf() ||
                                    component.end.valueOf() !==
                                        origin[1].valueOf())
                            ) {
                                // apply to db
                                cal.componentApplyRange(idcal, uid);
                                applied = true;
                            }
                        },
                        { once: true }
                    );
                } else {
                    let cal = this,
                        limit = this.bigcal.cal.getBoundingClientRect(),
                        applied = false,
                        origin = [component.start, component.end];
                    const clone = componentElement.cloneNode(),
                        duration = component.end - component.start,
                        offset =
                            e.clientY -
                            componentElement.getBoundingClientRect().y;
                    componentElement.classList.add("dragging"); // transparent element
                    clone.classList.add("clone", "hidden");
                    clone.style.outlineColor = clone.style.backgroundColor;
                    clone.style.backgroundColor = "";
                    componentElement.parentNode.append(clone);
                    function onPointerMove(e) {
                        // to avoid event start to jump to cursor
                        // change to add/remove time on Y
                        // change to add/remove day on X

                        e.preventDefault();
                        if (
                            e.clientX > limit.left &&
                            e.clientX < limit.right &&
                            e.clientY > limit.top &&
                            e.clientY < limit.bottom
                        ) {
                            const newDate = dateGetClosestQuarter(
                                cal.getCursorDate(e, offset)
                            );
                            if (
                                newDate.valueOf() !== component.start.valueOf()
                            ) {
                                component.start = newDate;
                                component.end = new Date(
                                    component.start.valueOf() + duration
                                );
                                clone.classList.remove("hidden");
                                cal.editorHide();
                                cal.placeComponent(idcal, uid, newDate);
                            }
                        }

                        // get Y to set hour if !=
                        // get target to set date if !=
                        // set component's new dates (new start + duration)
                        // place component accordingly
                    }
                    const release = () => {
                        componentElement.classList.remove("dragging");
                        clone?.remove();
                        if (
                            !applied &&
                            (component.start.valueOf() !==
                                origin[0].valueOf() ||
                                component.end.valueOf() !== origin[1].valueOf())
                        )
                            cal.componentApplyRange(idcal, uid);
                        applied = true;
                    };
                    document.addEventListener("pointermove", onPointerMove);
                    // on mouseup, remove clone, move original to pointer.target date pointerY time.
                    document.addEventListener(
                        "pointerup",
                        () => {
                            document.removeEventListener(
                                "pointermove",
                                onPointerMove
                            );
                            release();
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
                        },
                        { once: true }
                    );
                }
            }
        });

        // event editor
        this.editor = {
            modified: false,
            wrapper: document.createElement("div"),

            // input summary
            summary: document.createElement("input"),

            // date :
            date: {
                wrapper: document.createElement("div"),
                // span summary
                summary: document.createElement("span"),
                // checkbox allday
                allday: {
                    wrapper: document.createElement("div"),
                    span: document.createElement("span"),
                    input: document.createElement("input"),
                },
                // input start
                start: new Field({
                    compact: true,
                    name: "Start",
                    required: true,
                    type: "datepicker",
                }),
                // input end
                end: new Field({
                    compact: true,
                    name: "End",
                    required: true,
                    type: "datepicker",
                }),
            },

            // repeat :
            repeat: {
                wrapper: document.createElement("div"),
                // span summary
                summary: document.createElement("span"),
                // select interval (select custom opens custom repeat menu)
                interval: new Field({
                    compact: true,
                    name: "interval",
                    type: "select",
                    options: {
                        0: "none",
                        1: "every day",
                        2: "every week",
                        3: "every month",
                        4: "every year",
                        5: "custom",
                    },
                }),

                // custom repeat menu
                menu: {
                    wrapper: document.createElement("div"),
                    // select frequency
                    frequency: new Field({
                        compact: true,
                        name: "frequency",
                        type: "select",
                        options: {
                            0: "daily",
                            1: "weekly",
                            2: "monthly",
                            3: "yearly",
                            4: "custom",
                        },
                    }),
                    // dayly :
                    // input every x days
                    every: {
                        // use same for weeks, months, years
                        wrapper: document.createElement("div"),
                        span: document.createElement("span"),
                        input: document.createElement("input"), // type number
                        value: document.createElement("span"),
                    },
                    // weekly :
                    // input every x weeks
                    // toggle on week days
                    picker: document.createElement("div"), // use same picker for weekdays, dates, months
                    // monthly :
                    // input every x months
                    // toggle each date
                    // on the
                    onThe: {
                        wrapper: document.createElement("div"),
                        span: document.createElement("span"),
                        // select first, second, third, fourth, fifth, last
                        which: new Field({
                            compact: true,
                            name: "which",
                            type: "select",
                            options: {
                                0: "first",
                                1: "second",
                                2: "third",
                                3: "fourth",
                                4: "fifth",
                                5: "last",
                            },
                        }),
                        // select day, weekend day, monday, ..., sunday
                        what: new Field({
                            compact: true,
                            name: "what",
                            type: "select",
                            options: {
                                0: "day",
                                1: "week day",
                                2: "weekend day",
                                3: "monday",
                                4: "tuesday",
                                5: "wednesday",
                                6: "thursday",
                                7: "friday",
                                8: "saturday",
                                9: "sunday",
                            },
                        }),
                    },
                    // yearly :
                    // input every x years
                    // toggle months
                    // on the
                    // select first, second, third, fourth, fifth, last
                    // select day, weekend day, monday, ..., sunday
                },
            },

            // end repeat :
            endRepeat: {
                wrapper: document.createElement("div"),
                // span summary
                summary: document.createElement("span"),
                // select type (after, on date)
                type: new Field({
                    compact: true,
                    name: "type",
                    type: "select",
                    options: { 0: "never", 1: "after", 2: "on date" },
                }),
                // select times (number." time(s)")
                times: document.createElement("input"), // type number, max 9999, min 1
                // select date
                date: new Field({
                    compact: true,
                    name: "date",
                    type: "datepicker",
                }),
            },

            // alerts :
            alerts: {
                wrapper: document.createElement("div"),
                // select time, custom opens menu, none value removes line if other alert line present
                time: new Field({
                    compact: true,
                    name: "time",
                    type: "select",
                    options: {
                        0: "15 minutes before (default)",
                        1: "none",
                        2: "5 minutes before",
                        3: "10 minutes before",
                        4: "30 minutes before",
                        5: "1 hour before",
                        6: "2 hours before",
                        7: "1 day before",
                        8: "2 days before",
                        9: "custom",
                    },
                }),
                // button + to add line
                // alert custom menu :
                menu: {
                    wrapper: document.createElement("div"),
                    // select type
                    type: new Field({
                        compact: true,
                        name: "type",
                        type: "select",
                        options: { 0: "notification", 1: "Email", 2: "Sms" },
                    }),
                    // input x select time before/after, on date value changes input into datetime-local
                    times: document.createElement("input"), // type number, min: 1, max: 9999
                    value: new Field({
                        compact: true,
                        name: "value",
                        type: "select",
                        options: {
                            0: "At time of event",
                            1: "minutes before",
                            2: "hours before",
                            3: "days before",
                            4: "minutes after",
                            5: "hours after",
                            6: "days after",
                            7: "on date",
                        },
                    }), // at time of event hides times input, on date hides times input shows date picker
                    date: new Field({
                        compact: true,
                        name: "date",
                        type: "datepicker",
                    }),
                },
            },

            invitees: {
                wrapper: document.createElement("div"),
                // selectize invitee
                selectize: new Field({
                    compact: true,
                    name: "invitees",
                    type: "selectize",
                    task: 0,
                    multi: true,
                    placeholder: "invitees...",
                }), // select creates line with fields below
                // span invitee's name, hover color: red, click remove
                // select role (client, ...)
                // select status
                // button send email
            },

            // add attachement with select who can access (role, user,...)

            // appointment
            appointment: {
                wrapper: document.createElement("div"),
                // select appointment type
                type: new Field({
                    compact: true,
                    name: "appointment type",
                    type: "select",
                    options: { 0: "" },
                }), // select populated with preconfigured appointment types for calendar's client/owner
                // span datetime of next available
                next: document.createElement("span"),
            },

            // options
            options: {
                wrapper: document.createElement("div"),
                // textarea||quill description
                description: new Field({
                    compact: true,
                    name: "description",
                    placeholder: "description...",
                    type: "quill",
                }),
                // checkbox show busy
                busy: {
                    wrapper: document.createElement("div"),
                    span: document.createElement("span"),
                    input: document.createElement("input"),
                },
                // checkbox transparency
                transparency: {
                    wrapper: document.createElement("div"),
                    span: document.createElement("span"),
                    input: document.createElement("input"),
                },
            },
        };

        this.editor.wrapper.className = "editor";

        // summary
        this.editor.summary.placeholder = "New event";
        this.editor.summary.addEventListener("input", () => {
            if (this.focus) {
                this.editor.modified = true;
                // update component.summary
                this.focus.summary = this.editor.summary.value;
                // for each element, change summary
                for (const element of Object.values(this.focus.elements))
                    element.getElementsByTagName("span")[1].textContent =
                        this.editor.summary.value;
            }
        });

        //date
        this.editor.date.wrapper.append(
            this.editor.date.summary,
            this.editor.date.allday.wrapper,
            this.editor.date.start.wrapper,
            this.editor.date.end.wrapper
        );
        // summary

        // hide dateSummary, show other elements > set class to wrapper
        // on click on anywhere else than inside date elements, reverse hide.

        // allday
        this.editor.date.allday.input.type = "checkbox";
        this.editor.date.allday.wrapper.append(this.editor.date.allday.input);
        this.editor.date.allday.input.addEventListener("change", (e) => {
            console.log(e.target.checked);
        });
        // start event listener :
        // on date change, set min to end
        // end event listener :
        // on date change, set max to start

        // repeat
        this.editor.repeat.wrapper.append(
            this.editor.repeat.summary,
            this.editor.repeat.interval.wrapper,
            this.editor.repeat.menu.wrapper
        );
        // repeat menu
        this.editor.repeat.menu.wrapper.append(
            this.editor.repeat.menu.frequency.wrapper,
            this.editor.repeat.menu.every.wrapper,
            this.editor.repeat.menu.picker,
            this.editor.repeat.menu.onThe.wrapper
        );
        // repeat menu every
        this.editor.repeat.menu.every.wrapper.append(
            this.editor.repeat.menu.every.span,
            this.editor.repeat.menu.every.input,
            this.editor.repeat.menu.every.value
        );
        // repeat menu onThe
        this.editor.repeat.menu.onThe.wrapper.append(
            this.editor.repeat.menu.onThe.span,
            this.editor.repeat.menu.onThe.which.wrapper,
            this.editor.repeat.menu.onThe.what.wrapper
        );

        // end repeat
        this.editor.endRepeat.wrapper.append(
            this.editor.endRepeat.summary,
            this.editor.endRepeat.type.wrapper,
            this.editor.endRepeat.times,
            this.editor.endRepeat.date.wrapper
        );

        // alerts
        this.editor.alerts.wrapper.append(
            this.editor.alerts.time.wrapper,
            this.editor.alerts.menu.wrapper
        );
        // alerts menu
        this.editor.alerts.menu.wrapper.append(
            this.editor.alerts.menu.type.wrapper,
            this.editor.alerts.menu.times,
            this.editor.alerts.menu.value.wrapper,
            this.editor.alerts.menu.date.wrapper
        );

        //invitees
        this.editor.invitees.wrapper.append(
            this.editor.invitees.selectize.wrapper
        );

        // appointment
        this.editor.appointment.wrapper.append(
            this.editor.appointment.type.wrapper,
            this.editor.appointment.next
        );

        // options
        this.editor.options.wrapper.append(
            this.editor.options.description.wrapper,
            this.editor.options.busy.wrapper,
            this.editor.options.transparency.wrapper
        );

        // busy
        this.editor.options.busy.input.type = "checkbox";
        this.editor.options.busy.wrapper.append(this.editor.options.busy.input);
        this.editor.options.busy.input.addEventListener("change", (e) => {
            console.log(e.target.checked);
        });
        // transparency
        this.editor.options.transparency.input.type = "checkbox";
        this.editor.options.transparency.wrapper.append(
            this.editor.options.transparency.input
        );
        this.editor.options.transparency.input.addEventListener(
            "change",
            (e) => {
                console.log(e.target.checked);
            }
        );

        this.editor.wrapper.append(
            this.editor.summary,
            document.createElement("hr"),
            this.editor.date.wrapper,
            this.editor.repeat.wrapper,
            this.editor.endRepeat.wrapper,
            this.editor.alerts.wrapper,
            document.createElement("hr"),
            this.editor.invitees.wrapper,
            document.createElement("hr"),
            this.editor.appointment.wrapper,
            document.createElement("hr"),
            this.editor.options.wrapper
        );

        // minicalendar menu
        let todayButton = document.createElement("button"),
            calAdd = document.createElement("button");
        this.minical.selector = document.createElement("ul"); // menu with toggle to show cal, color selector, and remove/suppr if owner button.
        this.minical.selector.textContent = "🗓";
        todayButton.textContent = "🩴";
        todayButton.addEventListener("click", () =>
            this.minicalFocus(new Date())
        );
        calAdd.textContent = "🧉";
        calAdd.addEventListener("click", () => this.newCalendar());
        this.menu.append(todayButton, this.minical.selector, calAdd);
        this.getCalendars();
        this.generateCalendar();
        this.wrapper.append(
            this.toggle,
            this.menu,
            this.editor.wrapper,
            this.minical.cal,
            this.bigcal.wrapper
        );
    }
    addCalendar(calendar) {
        // add calendar to this.calendars
        this.calendars[calendar.id] = {
            name: calendar.name,
            description: calendar.description,
            color: calendar.color ?? undefined,
            owner: calendar.owner,
            read_only: calendar.read_only,
            components: {},
            visible: calendar.visible,
        };
        this.minicalAddCalendar(`${calendar.id}`);
    }
    /**
     * Adds event to calendar from object data.
     */
    addComponent(idcal, component) {
        if (!this.calendars[idcal].components)
            this.calendars[idcal].components = {};
        this.calendars[idcal].components[component.uid] = {
            id: component.idcal_component,
            modified: component.modified,
            start: new Date(`${component.start.replace(" ", "T")}Z`),
            end: new Date(`${component.end.replace(" ", "T")}Z`),
            allday: component.allday,
            elements: {},
            summary: component.summary,
            type: component.type,
            transparency: component.transparency,
            sequence: component.sequence,
            rrule: component.rrule,
            rdates: component.rdates,
            r_id:
                component.rrule || component.rdates?.length
                    ? component.recur_id
                    : undefined,
            thisandfuture:
                component.rrule || component.rdates?.length
                    ? component.thisandfuture
                    : undefined,
            exceptions: component.exceptions,
            alarms: component.alarms,
        };
        this.placeComponent(idcal, component.uid);
    }
    /**
     * Add month to calendars.
     * @param {Date} date
     * @return {HTMLElement} minical month
     */
    addMonth(date) {
        // month = first week to last week, including other monthes days
        // => this, but with the option to hide duplicate weeks to show a compact view.
        const year = date.getFullYear(),
            month = date.getMonth(),
            now = new Date(),
            start = toMYSQLDTString(new Date(year, month)),
            end = toMYSQLDTString(new Date(year, month + 1));
        socket.send({
            f: 22,
            s: start,
            e: end,
        });
        for (let cal of [this.minical, this.bigcal]) {
            // if year not in calendar, create it with its months.
            if (!cal.years[year]) {
                let yearWrapper = document.createElement("div");
                yearWrapper.setAttribute("data-year", year);
                cal.years[year] = { months: {}, wrapper: yearWrapper };
                for (let i = 0; i < 12; i++) {
                    const monthDate = new Date(year, i);
                    let monthWrapper = document.createElement("div");
                    setElementAttributes(monthWrapper, [
                        [
                            "data-month",
                            monthDate.toLocaleString("default", {
                                month: "long",
                            }) + ` ${year}`,
                        ],
                        ["data-value", monthDate.valueOf()],
                    ]);
                    monthWrapper.className = "hidden";
                    cal.years[year].months[i] = monthWrapper;
                    if (cal === this.minical) {
                        monthWrapper.addEventListener("click", () => {
                            this.bigcalFocus(monthDate, "month", true);
                        });
                    }
                    yearWrapper.append(monthWrapper);
                }
                // set a way to insert year in right place.
                cal.cal.children.length &&
                year < cal.cal.firstElementChild.getAttribute("data-year")
                    ? cal.cal.prepend(yearWrapper)
                    : cal.cal.append(yearWrapper);
            }
            // fill month
            let monthWrapper = cal.years[year].months[month],
                day = getFirstDayOfWeek(date),
                weekWrapper;
            if (!monthWrapper.innerHTML) {
                monthWrapper.classList.remove("hidden");
                while (day <= getLastDayOfWeek(new Date(year, month + 1, 0))) {
                    const dayDate = new Date(
                        day.getFullYear(),
                        day.getMonth(),
                        day.getDate()
                    );
                    // if first day of week, create week
                    if (day.getDay() === this.weekstart) {
                        const weekNumber = getWeekNumber(day);
                        weekWrapper = document.createElement("div");
                        weekWrapper.setAttribute("data-week", weekNumber);
                        if (cal === this.minical) {
                            weekWrapper.addEventListener("click", (e) => {
                                e.stopPropagation();
                                this.bigcalFocus(dayDate, "week", true);
                            });
                        }
                        monthWrapper.append(weekWrapper);
                    }
                    let dayWrapper = document.createElement("div"),
                        info = document.createElement("div"),
                        allday = document.createElement("div"),
                        regular = document.createElement("div");
                    info.append(document.createElement("span"));
                    info.firstElementChild.textContent =
                        new Intl.DateTimeFormat("fr", {
                            weekday: "short",
                            day: "numeric",
                        }).format(day);
                    dayWrapper.append(info, allday, regular);
                    dayWrapper.setAttribute("data-date", day.getDate());
                    if (dayDate.getMonth() !== date.getMonth())
                        dayWrapper.classList.add("fade");
                    if (dayDate.toDateString() === now.toDateString())
                        dayWrapper.classList.add("today");
                    if (cal === this.minical) {
                        dayWrapper.addEventListener("click", (e) => {
                            e.stopPropagation();
                            this.bigcalFocus(dayDate, "day", true);
                        });
                    }
                    weekWrapper.append(dayWrapper);
                    day.setDate(day.getDate() + 1);
                }
            } else console.info(`Month ${month}-${year} already created.`);
        }

        // request month events if not in object.

        return this.minical.years[year].months[month];
    }
    /**
     * Focus bigcal on date and show it.
     * @param {Date} date
     * @param {String} type Values: "year","month","week","day".
     * @param {Boolean} lock
     */
    bigcalFocus(date, type, lock = false) {
        // if bigcal locked && same date, remove lock.
        if (
            this.bigcal.lock &&
            this.bigcal.wrapper.classList.contains(type) &&
            this.bigcal.focus?.date === date
        )
            this.bigcalLock();
        else {
            this.bigcal.focus = { date: date, type: type };
            this.bigcalLock(lock);
        }
        // set type by applying class to bigcal
        for (const t of ["year", "month", "week", "day"])
            type === t
                ? this.bigcal.wrapper.classList.add(t)
                : this.bigcal.wrapper.classList.remove(t);
        // focus to date
        let target, x, y;
        switch (type) {
            case "year":
                target = this.bigcal.years[date.getFullYear()].wrapper;
                break;
            case "month":
                target =
                    this.bigcal.years[date.getFullYear()].months[
                        date.getMonth()
                    ];
                x =
                    target.offsetLeft +
                    target.offsetParent.offsetLeft +
                    target.offsetParent.offsetParent.offsetLeft;
                y =
                    target.offsetTop +
                    target.offsetParent.offsetTop +
                    target.offsetParent.offsetParent.offsetTop;
                break;
            case "week":
            case "day":
                const infoWidth = convertRemToPixels(
                    parseFloat(
                        window
                            .getComputedStyle(this.bigcal.wrapper)
                            .getPropertyValue("--info-width")
                    )
                );
                target = this.bigcal.years[date.getFullYear()].months[
                    date.getMonth()
                ].querySelector(
                    `[data-week="${getWeekNumber(
                        date
                    )}"] [data-date="${date.getDate()}"]`
                );
                x =
                    target.offsetLeft +
                    target.offsetParent.offsetLeft +
                    target.offsetParent.offsetParent.offsetLeft -
                    infoWidth;
                break;
        }
        this.bigcal.cal.scrollTo({ top: y, left: x, behavior: "auto" });
    }
    /**
     * Applies/removes lock property and class to bigcal.
     * @param {Boolean} [lock] Default: false.
     */
    bigcalLock(lock = false) {
        this.bigcal.lock = lock;
        lock
            ? this.bigcal.wrapper.classList.add("locked")
            : this.bigcal.wrapper.classList.remove("locked");
    }
    /**
     * @param {Date} start
     * @param {Date} end
     */
    calcEventHeight(start, end) {
        return `${
            ((end.valueOf() - start.valueOf()) / 1000 / 60 / 60) *
            this.bigcal.layout.firstElementChild.firstElementChild.offsetHeight
        }px`;
    }
    /**
     * @param {Date} date
     */
    calcEventTop(date) {
        return `${
            this.bigcal.layout.firstElementChild.firstElementChild
                .offsetHeight *
            (date.getHours() + date.getMinutes() / 60)
        }px`;
    }
    /**
     * Removes events and cal from app.
     * @param {Number} idcal
     */
    calRemove(idcal) {
        // remove cal components
        if (this.calendars[idcal].components)
            for (const component of Object.values(
                this.calendars[idcal].components
            ))
                for (const element of Object.values(component.elements))
                    element.remove();
        // remove cal from minical
        this.calendars[idcal].li.remove();
        // remove cal from bopcal
        delete this.calendars[idcal];
        // set active on next calendar, else undefined
        this.active =
            this.active === idcal && this.calendars.length
                ? Object.keys(this.calendars)[0]
                : undefined;
    }
    calUnsubscribe(idcal) {
        // if cal owner, alert removal = deleting events no return
        if (this.calendars[idcal].owner) {
            msg.new({
                type: "danger",
                content:
                    "Supprimer définitivement ce calendrier et tous ses évènements ?",
                btn1text: "confirmer",
                btn1listener: () => {
                    console.log("Big Badaboum !");
                    // send kill message to server
                    socket.send({ f: 29, c: idcal });
                    // close
                    msg.close();
                },
            });
        } else {
            msg.new({
                type: "warning",
                content: "Vous désabonner de ce calendrier ?",
                btn1text: "confirmer",
                btn1listener: () => {
                    // remove cal from user_has_cal
                    socket.send({ f: 30, c: idcal });
                    // remove calendar and events from app
                    this.calRemove(idcal);
                    // close
                    msg.close();
                },
            });
        }
    }
    calUpdateColor(idcal, color) {
        // update events color in app.
        this.calendars[idcal].color = color;
        if (this.calendars[idcal].components)
            for (const component of Object.values(
                this.calendars[idcal].components
            )) {
                for (const element of Object.values(component.elements))
                    element.style.setProperty("--event-color", color);
            }
        // update calendar color in db
        socket.send({
            f: 28,
            c: idcal,
            x: color,
        });
    }
    clickEvents(e) {
        // if target is in bigcal calendar
        if (this.bigcal.cal.contains(e.target)) {
            // if target is an event
            if (e.target.closest("[data-uid]")) {
                const componentElement = e.target.closest("[data-uid]"),
                    idcal = componentElement.getAttribute("data-cal"),
                    uid = componentElement.getAttribute("data-uid"),
                    component = this.calendars[idcal].components[uid];
                // if target has focus, open editor
                if (component === this.focus) this.editorShow();
                return;
            }
            // if target is a day
            if (e.target.closest("[data-date")) {
                const dayDate = new Date(
                    parseInt(
                        e.target
                            .closest("[data-month]")
                            .getAttribute("data-value")
                    )
                );
                dayDate.setDate(
                    parseInt(
                        e.target
                            .closest("[data-date]")
                            .getAttribute("data-date")
                    )
                );
                // if target is info
                if (
                    e.target
                        .closest("[data-date]")
                        .getElementsByTagName("div")[0]
                        .contains(e.target)
                )
                    // bigcal focus day
                    this.bigcalFocus(dayDate, "day", true);
            }

            // if number (day, week, month), set view to corresponding date.
            // if event, set focus to it
        }
        // if target is in bigcal week info
        if (
            this.bigcal.info.contains(e.target) &&
            this.bigcal.info.firstElementChild.textContent !== "W##"
        ) {
            const weekElement = this.bigcal.cal.querySelector(
                `[data-week="${this.bigcal.info.firstElementChild.textContent.slice(
                    1
                )}"`
            );
            let weekDate = new Date(
                parseInt(
                    weekElement
                        .closest("[data-month]")
                        .getAttribute("data-value")
                )
            );
            weekDate.setDate(
                weekElement
                    .querySelector("[data-date]:not(.fade)")
                    .getAttribute("data-date")
            );
            weekDate = getFirstDayOfWeek(weekDate);
            this.bigcalFocus(weekDate, "week", true);
        }
        if (e.target.closest(".editor")) {
            this.editor.date.wrapper.contains(e.target)
                ? this.editor.date.wrapper.classList.add("expanded")
                : this.editor.date.wrapper.classList.remove("expanded");
            this.editor.repeat.wrapper.contains(e.target)
                ? this.editor.repeat.wrapper.classList.add("expanded")
                : this.editor.repeat.wrapper.classList.remove("expanded");
            this.editor.endRepeat.wrapper.contains(e.target)
                ? this.editor.endRepeat.wrapper.classList.add("expanded")
                : this.editor.endRepeat.wrapper.classList.remove("expanded");
            this.editor.alerts.wrapper.contains(e.target)
                ? this.editor.alerts.wrapper.classList.add("expanded")
                : this.editor.alerts.wrapper.classList.remove("expanded");
            this.editor.invitees.wrapper.contains(e.target)
                ? this.editor.invitees.wrapper.classList.add("expanded")
                : this.editor.invitees.wrapper.classList.remove("expanded");
            this.editor.appointment.wrapper.contains(e.target)
                ? this.editor.appointment.wrapper.classList.add("expanded")
                : this.editor.appointment.wrapper.classList.remove("expanded");
            this.editor.options.wrapper.contains(e.target)
                ? this.editor.options.wrapper.classList.add("expanded")
                : this.editor.options.wrapper.classList.remove("expanded");

            // date edition
            // if target = datesummary
            // if (this.editor.date.summary.contains(e.target))
            //     this.editor.wrapper.classList.add("date-edition");
            // // else if date-edition and target not in date editor
            // else if (
            //     this.editor.wrapper.classList.contains("date-edition") &&
            //     !this.editor.dateEdition.contains(e.target)
            // )
            //     this.editor.wrapper.classList.remove("date-edition");
            return;
        } else this.editorHide();
        if (this.focus)
            Object.values(this.focus.elements).forEach((x) =>
                x.classList.remove("focus")
            );
        delete this.focus;
    }
    /**
     * Applys new range to component in db.
     * @param {Number} idcal
     * @param {String} uid
     */
    componentApplyRange(idcal, uid) {
        const component = this.calendars[idcal].components[uid];
        socket.send({
            c: idcal,
            e: toMYSQLDTString(component.end),
            f: 32,
            i: component.id,
            m: component.modified,
            s: toMYSQLDTString(component.start),
            u: uid,
        });
    }
    // componentFocus(el) {
    //     if (this.focus && this.focus === el) {
    //         delete this.focus;
    //         el.classList.remove("focus");
    //         return;
    //     } else {
    //         if (this.focus) this.focus.classList.remove("focus");
    //         el.classList.add("focus");
    //         this.focus = el;
    //     }
    // }
    componentRemove(idcal, uid) {
        socket.send({
            c: idcal,
            f: 33,
            i: this.calendars[idcal].components[uid].id,
            u: uid,
        });
    }
    componentUpdate(data) {
        const component = cal.calendars[data.c].components[data.u];
        // apply component update
        // place component

        // for (let element of Object.values(component.elements)) element.classList.remove('applying');
    }
    destroy() {
        this.minical.observer?.disconnect();
        this.wrapper.innerHTML = "";
        this.wrapper.className = "loading hidden";
        BopCal.bopcals.splice(this.id, 1);
    }
    static destroyAll() {
        for (let cal of BopCal.bopcals) {
            cal.controller.abort();
            cal.destroy();
        }
    }
    editorApply(idcal, uid) {
        const component = this.calendars[idcal].components[uid],
            elements = Object.values(component.elements);
        // apply loading to component's elements
        for (const element of elements) element.classList.add("applying");
        this.editor.modified = false;
        // send modifications to db
        socket.send({
            f: 34,
            c: idcal,
            e: {
                id: component.id,
                start: toMYSQLDTString(component.start),
                end: toMYSQLDTString(component.end),
                allday: component.allday ?? undefined,
                type: component.type,
                description: component.description ?? undefined,
                class: component.class !== 1 ? component.class : undefined,
                location: component.location ?? undefined,
                priority:
                    component.priority !== 2 ? component.priority : undefined,
                status: component.status !== 1 ? component.status : undefined,
                transparency:
                    component.transparency !== 0
                        ? component.transparency
                        : undefined,
                rrule: component.rrule !== 0 ? component.rrule : undefined,
                rdates: component.rdates ?? undefined,
                exceptions: component.exceptions ?? undefined,
                tags: component.tags ?? undefined,
                invitees: component.invitees ?? undefined,
                alarms: component.alarms ?? undefined,
            },
            m: component.modified,
            u: uid,
        });
    }
    editorFocus(idcal, uid, element) {
        if (this.editor.modified)
            this.editorApply(this.editor.idcal, this.editor.uid);
        this.editor.idcal = idcal;
        this.editor.uid = uid;
        const component = this.calendars[idcal].components[uid],
            targetX =
                element.getBoundingClientRect().x -
                this.editor.wrapper.offsetParent.offsetLeft -
                this.editor.wrapper.offsetWidth -
                convertRemToPixels(1),
            targetY =
                element.getBoundingClientRect().y +
                element.offsetHeight / 2 -
                this.editor.wrapper.offsetParent.offsetTop -
                this.editor.wrapper.offsetHeight / 2,
            lowLimitX = -this.wrapper.offsetLeft,
            highLimitX =
                document.body.offsetWidth -
                this.wrapper.offsetLeft -
                this.editor.wrapper.offsetWidth,
            lowLimitY = -this.wrapper.offsetTop,
            highLimitY =
                document.body.offsetHeight -
                this.wrapper.offsetTop -
                this.editor.wrapper.offsetHeight;
        // move editor towards component element
        if (targetX >= lowLimitX && targetX <= highLimitX)
            this.editor.wrapper.style.left = `${targetX}px`;
        if (targetX < lowLimitX)
            this.editor.wrapper.style.left = `${lowLimitX}px`;
        if (targetX > highLimitX)
            this.editor.wrapper.style.left = `${highLimitX}px`;
        if (targetY >= lowLimitY && targetY <= highLimitY)
            this.editor.wrapper.style.top = `${targetY}px`;
        if (targetY < lowLimitY)
            this.editor.wrapper.style.top = `${lowLimitY}px`;
        if (targetY > highLimitY)
            this.editor.wrapper.style.top = `${highLimitY}px`;

        // populate editor with component's data
        this.editor.summary.value = component.summary;

        this.editor.date.summary.textContent = new Intl.DateTimeFormat("fr", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        }).formatRange(component.start, component.end);
        this.editor.date.start.input[0].value = toHTMLInputDateValue(
            component.start
        );
        this.editor.date.end.input[0].value = toHTMLInputDateValue(
            component.end
        );

        this.editor.wrapper.style.setProperty(
            "--editor-color",
            element.style.getPropertyValue("--event-color")
        );
    }
    editorHide() {
        this.editor.wrapper.classList.remove("show", "date-edition");
        this.editor.wrapper
            .querySelector(".expanded")
            ?.classList.remove("expanded");
        // if modifications
        if (this.editor.modified)
            this.editorApply(this.editor.idcal, this.editor.uid);
        delete this.editor.idcal;
        delete this.editor.uid;
    }
    editorShow() {
        this.editor.wrapper.classList.add("show");
        this.editor.summary.focus();
    }
    /**
     * First load of calendar.
     * @param {Date} [date]
     */
    generateCalendar(date = new Date()) {
        // set base date of calendar
        this.baseDate = date;

        for (const month of [
            new Date(this.baseDate.getFullYear(), this.baseDate.getMonth() - 1),
            new Date(this.baseDate.getFullYear(), this.baseDate.getMonth()),
            new Date(this.baseDate.getFullYear(), this.baseDate.getMonth() + 1),
        ])
            this.addMonth(month);

        // set up intersectionObservers on mini and big cal to load months with scroll.

        // note for self: intersectionObserver works whatever way an element enters its root, vertical or horizontal scroll, or anything else.
        const observerOptions = {
                root: this.wrapper,
                rootMargin: "0px 0px",
                threshold: 1,
            },
            quantity = 1, // how many months to load at once
            loadloop = (date, up = false) => {
                let last;
                const monthHeight = convertRemToPixels(14);
                for (let i = 1; i <= quantity; i++) {
                    const scroll = this.minical.cal.scrollTop;
                    date.setMonth(
                        up ? date.getMonth() - 1 : date.getMonth() + 1
                    );
                    if (up) {
                        this.minical.cal.scrollTop = scroll + monthHeight;
                    }
                    last = this.addMonth(date);
                }
                return last;
            },
            action = () => {},
            calIntersect = (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.target === this.minical.bottomMonth) {
                        if (entry.isIntersecting) {
                            console.log(`load ${quantity} months at bottom`);
                            // get date of month
                            const date = new Date(
                                parseInt(
                                    this.minical.bottomMonth.getAttribute(
                                        "data-value"
                                    )
                                )
                            );
                            this.minical.observer.unobserve(
                                this.minical.bottomMonth
                            );
                            this.minical.bottomMonth = loadloop(date);
                            this.minical.observer.observe(
                                this.minical.bottomMonth
                            );
                            // check firstMonth, for each month too far up from top, unload month from dom
                        }
                        // add month at end, set it to be lastMonth
                        // check if first month out of range of intersection observer, then empty it and observe next month
                    } else if (entry.target === this.minical.topMonth) {
                        if (entry.isIntersecting) {
                            console.log(`load ${quantity} months at top`);
                            // get date of month
                            const date = new Date(
                                parseInt(
                                    this.minical.topMonth.getAttribute(
                                        "data-value"
                                    )
                                )
                            );
                            this.minical.observer.unobserve(
                                this.minical.topMonth
                            );
                            delete this.minical.topMonth;
                            this.minical.topMonth = loadloop(date, true);
                            this.minical.observer.observe(
                                this.minical.topMonth
                            );
                            // check lastMonth, for each month too far down from bottom, unload month from dom
                        }
                        // add month at begining, set it to be firstMonth
                        // check if last month out of range of intersection observer, then empty it and observe previous month
                    }
                });
            };
        let months = this.minical.cal.querySelectorAll(
            "[data-month]:not(.hidden)"
        );
        this.minical.bottomMonth = months[months.length - 1];
        this.minical.topMonth = months[0];
        this.minical.observer = new IntersectionObserver(
            calIntersect,
            observerOptions
        );
        this.minical.observer.observe(this.minical.topMonth);
        this.minical.observer.observe(this.minical.bottomMonth);

        // this.minicalFocus(new Date());
        // month name:
        // position: absolute
        // top = top from row containing 1st of month - 1 x row height
        // left: 100 %
        // width = (count(row from 1st of month until 1st of next month) - 1) x row height
        // rotate 90, origin: bottom left
        // same for week number
        // same for year ?
    }
    getCalendars() {
        socket.send({
            f: 21,
        });
    }
    /**
     *
     * @param {PointerEvent} e
     * @param {Number} [offset=0]
     */
    getCursorDate(e, offset = 0) {
        // if e.target = allday ...
        // else
        const monthEl = e.target.closest("[data-month]"),
            day = e.target.closest("[data-date]"),
            regular = day.lastElementChild,
            // const monthEl = e.target.parentNode.parentNode,
            //     day = e.target.getAttribute("data-date"),
            hours =
                (e.clientY - offset - regular.getBoundingClientRect().y) /
                (regular.offsetHeight / 24);
        let date = new Date(parseInt(monthEl.getAttribute("data-value")));
        // if element classlist contains fade. day belongs to previous/next month
        if (day.classList.contains("fade"))
            day.parentNode === monthEl.firstElementChild
                ? date.setMonth(date.getMonth() - 1)
                : date.setMonth(date.getMonth() + 1);
        date.setDate(day.getAttribute("data-date"));
        date.setTime(date.getTime() + hours * 60 * 60 * 1000);
        return date;
    }
    static getComponents(idcal, start, end) {
        // check if asked range in stored range, else fetch.
        // foreach day of range, check if data in cache, else fetch.
        socket.send({
            f: 22,
            start: start,
            end: end,
            c: idcal,
        });
    }
    minicalAddCalendar(idcal) {
        let calendar = this.calendars[idcal],
            wrapper = document.createElement("li"),
            check = new Field({
                type: "checkbox",
                name: "visible",
                compact: true,
            }),
            name = document.createElement("span"),
            colorSelect = document.createElement("input"),
            removeButton = document.createElement("button");
        name.textContent = calendar.name;
        name.addEventListener("click", () => {
            this.setActiveCal(idcal);
        });

        // check.type = "checkbox";
        check.input[0].checked = calendar.visible;
        // if checked, show events, else hide them
        check.input[0].addEventListener("change", (e) => {
            this.toggleCalVisibility(idcal, e.target.checked);
            e.target.blur();
        });
        colorSelect.type = "color";
        if (!calendar.color) calendar.color = "#759ece";
        colorSelect.value = calendar.color;
        colorSelect.addEventListener("input", (e) => {
            const color = e.target.value;
            if (this.calendars[idcal].color !== color) {
                this.calUpdateColor(idcal, color);
            }
        });
        removeButton.textContent = "❌";
        removeButton.addEventListener("click", () => {
            // alert to confirm:
            console.log(`remove cal #${idcal}`);
            // if calendar owner, delete calendar
            this.calUnsubscribe(idcal);
            // else remove
        });
        wrapper.append(check.wrapper, name, colorSelect, removeButton);
        this.calendars[idcal].li = wrapper;
        this.minical.selector.append(wrapper);
        if (!this.active) this.setActiveCal(idcal);
    }
    /**
     * Focus actual date in minical.
     * @param {Date} date
     */
    minicalFocus(date) {
        const month =
                this.minical.years[date.getFullYear()].months[date.getMonth()],
            x = month.offsetLeft,
            y = month.offsetTop,
            day = month.querySelector(
                `[data-date="${date.getDate()}"]:not(.fade)`
            );
        this.minical.cal.scrollTo({ top: y, left: x, behavior: "smooth" });
        this.minical.cursor.style.top = `${
            day.offsetParent.offsetTop + month.offsetTop
        }px`;
        this.minical.cursor.style.left = `${
            day.offsetLeft +
            day.offsetParent.offsetLeft +
            month.offsetLeft +
            day.closest("[data-year]").offsetLeft
        }px`;
        if (this.minical.cal.querySelector("[data-week].active"))
            this.minical.cal
                .querySelector("[data-week].active")
                .classList.remove("active");
        day.closest("[data-week]").classList.add("active");
    }
    newCalendar() {
        if (Modal.modals.filter((x) => x.task === 27).length) {
            return Modal.modals.filter((x) => x.task === 27)[0].close();
        }
        const modal = new Modal({
            buttons: [
                {
                    listener: () => {
                        modal.close();
                    },
                },
                { text: "créer", requireValid: true },
            ],
            title: "Nouveau calendrier",
            fields: [
                {
                    compact: true,
                    name: "name",
                    placeholder: "Nom",
                    required: true,
                    type: "input_string",
                },
                {
                    compact: true,
                    type: "quill",
                    placeholder: "Description (optionnelle)",
                    name: "description",
                },
            ],
            task: 27,
        });
    }
    /**
     * Creates event in calendar
     * @param {Date} date
     */
    newEvent(date) {
        let eventDate = dateGetClosestQuarter(date);
        const start = toMYSQLDTString(eventDate);
        eventDate.setHours(eventDate.getHours() + 1);
        const end = toMYSQLDTString(eventDate);
        // send server new event data: start,end
        socket.send({
            f: 25,
            c: parseInt(this.active),
            e: {
                start: start,
                end: end,
                created: toMYSQLDTString(new Date()),
                summary: "New event",
            },
        });
    }
    static parse(data) {
        const cal = BopCal.bopcals[0];
        if (data.response?.fail) {
            console.error(data.response.fail);
            return msg.new({
                content: data.response.message,
                type: "warning",
            });
        }
        switch (data.f) {
            case 21:
                // calendars and static values
                for (const [key, value] of Object.entries(data.response))
                    cal[key] = value;
                for (const key of Object.keys(cal.calendars))
                    cal.minicalAddCalendar(key);
                break;
            case 22:
                if (data.response)
                    for (const [calendar, events] of Object.entries(
                        data.response
                    ))
                        for (const event of events)
                            cal.addComponent(calendar, event);
                break;
            case 25:
                // new event
                cal.addComponent(data.c, data.event);
                break;
            case 27:
                // new calendar
                cal.addCalendar(data.response);
                Modal.modals.filter((x) => x.task === 27)[0].close();
                break;
            case 29:
                if (data.x) {
                    console.log(
                        `Calendar #${data.c} has been removed by owner.`
                    );
                    // message calendar has been removed by owner
                    msg.new({
                        type: "warning",
                        content: `Le calendrier ${
                            cal.calendars[data.c].name
                        } a été supprimé.`,
                    });
                    // remove calendar and events from app
                    cal.calRemove(data.c);
                }
                break;
            case 32: {
                let component = cal.calendars[data.c].components[data.u];
                component.modified = data.m;
                component.start = new Date(`${data.s.replace(" ", "T")}Z`);
                component.end = new Date(`${data.e.replace(" ", "T")}Z`);
                cal.placeComponent(data.c, data.u);
                break;
            }
            case 33: {
                const component = cal.calendars[data.c].components[data.u];
                for (let element of Object.values(component.elements))
                    element.remove();
                delete cal.calendars[data.c].components[data.u];
                cal.modal.close();
                msg.close();
                msg.new({
                    content: "L'évenement à été supprimé.",
                    type: "success",
                });
                break;
            }
            case 34:
                cal.componentUpdate(data);
                break;
        }
    }
    /**
     * Places/updates component in bigcal according to component's data.
     * @param {Number} idcal
     * @param {String} uid - Component object stored in bigcal.
     * @param {Boolean} [move] - If set, adds .focus to component at date.
     */
    placeComponent(idcal, uid, move) {
        let component = this.calendars[idcal].components[uid];
        // get dates between start & end
        const dates = getDaysBetweenDates(component.start, component.end),
            datesStrings = dates.map((x) => toYYYYMMDDString(x));
        // delete unused elements
        for (const datestring of Object.keys(component.elements)) {
            if (!datesStrings.includes(datestring)) {
                component.elements[datestring].remove();
                delete component.elements[datestring];
            }
        }
        // for each day, set start/end according to event start/end
        for (const day of dates) {
            const nextDay = new Date(
                    day.getFullYear(),
                    day.getMonth(),
                    day.getDate() + 1
                ),
                dateString = toYYYYMMDDString(day);
            let classes = [],
                top,
                height,
                el = component.elements[dateString] ?? undefined;
            const dayWrapper = el
                ? el.parentNode.parentNode
                : this.bigcal.years[day.getFullYear()].months[
                      day.getMonth()
                  ].querySelector(`[data-date="${day.getDate()}"]:not(.fade)`);
            if (!component.allday) {
                top =
                    component.start < day
                        ? "0px"
                        : this.calcEventTop(component.start);
                height =
                    component.end < nextDay
                        ? this.calcEventHeight(
                              component.start < day ? day : component.start,
                              component.end
                          )
                        : this.calcEventHeight(
                              component.start < day ? day : component.start,
                              nextDay
                          );
            }
            // if el of event exists
            if (el) {
                el.getElementsByTagName("span")[0].textContent =
                    new Intl.DateTimeFormat("fr", {
                        timeStyle: "short",
                    }).format(component.start);
                // if parent = allday
                if (el.parentNode === dayWrapper.children[1]) {
                    // if !event.allday, move element to dayWrapper, set top / height
                    if (!component.allday) {
                        dayWrapper.lastElementChild.append(el);
                        el.style.top = top;
                        el.style.height = height;
                    }
                }
                // if parent = dayWrapper
                else {
                    // if event.allday, move element to allday, set start/end classes
                    if (component.allday) {
                        dayWrapper.children[1].append(el);
                    }
                    // else update top/height if necessary
                    else {
                        el.style.top = top;
                        el.style.height = height;
                    }
                }
            }
            // else create it
            else {
                el = document.createElement("div");
                let hour = document.createElement("span"),
                    summary = document.createElement("span"),
                    handleStart = document.createElement("div"),
                    handleEnd = document.createElement("div");
                hour.textContent = new Intl.DateTimeFormat("fr", {
                    timeStyle: "short",
                }).format(component.start);
                summary.textContent = component.summary ?? "New event";
                setElementAttributes(el, [
                    ["data-cal", idcal],
                    ["data-uid", uid],
                ]);
                el.style.setProperty(
                    "--event-color",
                    this.calendars[idcal].color
                );
                el.append(handleStart, hour, summary, handleEnd);
                component.elements[dateString] = el;
                if (component.allday) {
                    dayWrapper.children[1].append(el);
                    el.className = classes;
                } else {
                    dayWrapper.lastElementChild.append(el);
                    el.style.top = top;
                    el.style.height = height;
                }
            }
            if (move) el.classList.add("focus");
            component.start >= day
                ? el.classList.add("start")
                : el.classList.remove("start");
            component.end < nextDay
                ? el.classList.add("end")
                : el.classList.remove("end");
            // display time if element's duration > 30min
            el.getElementsByTagName("span")[0].style.display =
                getMinutesBetweenDates(component.start, component.end) <= 30
                    ? "none"
                    : "";
        }
    }
    setActiveCal(idcal) {
        if (this.active === idcal) return;
        console.log(`Active cal set to cal#${idcal}`);
        this.active = idcal;
        for (const [key, value] of Object.entries(this.calendars)) {
            key === idcal
                ? value.li.classList.add("active")
                : value.li?.classList.remove("active");
        }
    }
    /**
     * Hides or show components from specified calendar.
     * @param {Number} idcal
     * @param {Boolean} show
     */
    toggleCalVisibility(idcal, visible = true) {
        this.calendars[idcal].visible = visible;
        this.calendars[idcal].li.querySelector('[type="checkbox"]').checked =
            visible;
        if (this.calendars[idcal].components)
            for (const component of Object.values(
                this.calendars[idcal].components
            ))
                for (const element of Object.values(component.elements))
                    visible
                        ? element.classList.remove("hide")
                        : element.classList.add("hide");
        // set visible = show to user_has_calendar;
        socket.send({ f: 31, c: idcal, v: visible ? 1 : 0 });
    }
    // addFullCalEvent() {
    //     // manage batch rendering ?
    //     // fullcal event :
    //     // id
    //     // start
    //     // end
    //     // rrule
    //     // all day
    //     // title
    //     // url
    //     // extendedProps {}
    // }
    // addCalendarEvent() {
    //     // VEVENT
    //     // UID
    //     // CREATED: UTC
    //     // LAST-MODIFIED: UTC
    //     // DTSTAMP: UTC (set by caldav server when adding event?)
    //     // DTSTART: TZ or UTC
    //     // DTEND OR DURATION
    //     // TRANSP: OPAQUE OR TRANSPARENT (for busy time searches, not style related!)
    //     // SUMMARY: text
    //     // CATEGORIES: ~ tags/groups, e.g. CATEGORIES:ANNIVERSARY,PERSONAL,SPECIAL OCCASION
    //     // CLASS: related to securing access to event, allows non standard values, must be completed by calendar agent logic, does nothing alone. e.g. PUBLIC (default value), PRIVATE, CONFIDENTIAL...
    //     // ORGANIZER: CN (display name), MAILTO (email address). e.g. ORGANIZER;CN=John Smith:MAILTO:jsmith@host.com
    //     // ATTENDEE: CN=, MAILTO:, MEMBER=, DELEGATED-TO=, DELEGATED-FROM=,CUTYPE=
    //     // RELATED-TO: to figure out how it works.
    //     //
    //     // VALARM (nested in VEVENT or VTODO)
    //     // UID
    //     // ACTION: AUDIO, DISPLAY, EMAIL, PROCEDURE
    //     // TRIGGER: DURATION, UTC, START (requires DTSTART), END (requires DTEND, DTSTART & DURATION, or DUE in case of VTODO). e.g. -PT15M (15 min before), -P7W (7 weeks before)
    //     // ATTACH: audio component (unique), message attachments, local procedure (unique).
    //     // DESCRIPTION: display content, email body.
    //     // SUMMARY: email subject
    //     // ATTENDEE: email address (one per ATTENDEE property)
    //     // DURATION: e.g. PT5M (5 minutes)
    //     // REPEAT: integer, specifies number of times the alarm is to repeat, requires DURATION.
    //     //
    //     //      ; the following are optional,
    //     //      ; but MUST NOT occur more than once
    //     //      class / created / description / dtstart / geo /
    //     //      last-mod / location / organizer / priority /
    //     //      dtstamp / seq / status / summary / transp /
    //     //      uid / url / recurid /
    //     //      ; either 'dtend' or 'duration' may appear in
    //     //      ; a 'eventprop', but 'dtend' and 'duration'
    //     //      ; MUST NOT occur in the same 'eventprop'
    //     //      dtend / duration /
    //     //      ; the following are optional,
    //     //      ; and MAY occur more than once
    //     //      attach / attendee / categories / comment /
    //     //      contact / exdate / exrule / rstatus / related /
    //     //      resources / rdate / rrule / x-prop
    // }
}

// big-cal on click:
// - create untitled/pretitled new event with loading class (not editable, color faded)
// - send event data to server
// - server returns new event
// - remove loading class (shouldn't be visible to user unless problem with server).
// on button down:
// - drag event, snapping on time divisions while dragging
// on release:
// - loading class
// - send server new data
// - server returns event
// - remove loading class
