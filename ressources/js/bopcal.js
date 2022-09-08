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
        this.now = new Date();
        this.years = {};
        this.months = {};
        this.wrapper = element;
        this.wrapper.classList.add("bopcal");
        this.menu = document.createElement("div");
        this.minical = { cal: document.createElement("div"), years: {} };
        this.minical.cal.className = "mini";
        this.bigcal = {
            wrapper: document.createElement("div"),
            cal: document.createElement("div"),
            years: {},
            layout: document.createElement("div"),
        };
        this.bigcal.wrapper.append(this.bigcal.layout, this.bigcal.cal);
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
            // hour in each one, ::after absolute inset:0 auto 0 0;
            hour.setAttribute("data-hour", convertIntToHour(i));
            this.bigcal.layout.append(hour);
        }
        this.bigcal.cal.addEventListener("scroll", (e) => {
            // this.bigcal.layout.topScroll=e.scroll
            this.bigcal.layout.style.top = `-${this.bigcal.cal.scrollTop}px`;
        });
        this.bigcal.cal.addEventListener("click", (e) => {
            // if number (day, week, month), set view to corresponding date.
        });
        this.bigcal.cal.addEventListener("dblclick", (e) => {
            // if day, create event on day, at time if view = week or day, else allday if month
            if (e.target.getAttribute("data-date")) {
                this.active
                    ? this.newEvent(this.getDayElementDate(e))
                    : msg.new({
                          type: "warning",
                          content:
                              "Aucun calendrier sélectionné pour la création d'un nouvel événement.",
                      });
            }
        });

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
            this.minical.cal,
            this.bigcal.wrapper
        );
    }
    addCalendar(calendar) {
        // add calendar to this.calendars
        this.calendars[`${calendar.id}`] = {
            name: calendar.name,
            description: calendar.description,
            color: calendar.color ?? undefined,
            owner: calendar.owner,
            read_only: calendar.read_only,
            components: {},
            visible: calendar.visible,
        };
        this.minicalAddCalendar(calendar.id);
    }
    /**
     * Adds event to calendar from object data.
     */
    addComponent(idcal, event) {
        if (!this.calendars[idcal].components)
            this.calendars[idcal].components = {};
        console.log(event);
        this.calendars[idcal].components[event.uid] = {
            id: event.idcal_component,
            start: new Date(`${event.start}Z`),
            end: new Date(`${event.end}Z`),
            allday: event.allday,
            elements: {},
            summary: event.summary,
            type: event.type,
            transparency: event.transparency,
            sequence: event.sequence,
            rrule: event.rrule,
            rdates: event.rdates,
            r_id:
                event.rrule || event.rdates?.length
                    ? event.recur_id
                    : undefined,
            thisandfuture:
                event.rrule || event.rdates?.length
                    ? event.thisandfuture
                    : undefined,
            exceptions: event.exceptions,
            alarms: event.alarms,
        };
        this.placeEvent(idcal, this.calendars[idcal].components[event.uid]);
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
            now = new Date();

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
                            // weekWrapper.addEventListener("mouseover", (e) => {
                            //     if (
                            //         e.target.getAttribute("data-week") &&
                            //         !this.bigcal.lock
                            //         )
                            //         this.bigcalFocus(dayDate, "week");
                            //     });
                            weekWrapper.addEventListener("click", (e) => {
                                e.stopPropagation();
                                this.bigcalFocus(dayDate, "week", true);
                            });
                        }
                        monthWrapper.append(weekWrapper);
                    }
                    let dayWrapper = document.createElement("div");
                    dayWrapper.setAttribute("data-date", day.getDate());
                    if (dayDate.getMonth() !== date.getMonth())
                        dayWrapper.classList.add("fade");
                    if (dayDate.toDateString() === now.toDateString())
                        dayWrapper.classList.add("today");
                    if (cal === this.minical) {
                        // dayWrapper.addEventListener("mouseover", (e) => {
                        //     e.stopPropagation();
                        //     if (!this.bigcal.lock) {
                        //         this.bigcalFocus(dayDate, "day");
                        //     }
                        // });
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
                // issue when days from previous or next month...
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
                    target.offsetParent.offsetParent.offsetLeft;
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
            this.bigcal.layout.firstChild.offsetHeight
        }px`;
    }
    /**
     * @param {Date} date
     */
    calcEventTop(date) {
        return `${
            this.bigcal.layout.firstChild.offsetHeight *
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
            this.active === idcal && this.calendars.lenght
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
        for (const component of Object.values(
            this.calendars[idcal].components
        )) {
            for (const element of Object.values(component.elements))
                element.style.backgroundColor = color;
        }
        // update calendar color in db
        socket.send({
            f: 28,
            c: idcal,
            x: color,
        });
    }
    destroy() {
        this.minical.observer?.disconnect();
        this.wrapper.innerHTML = "";
        this.wrapper.className = "loading hidden";
        BopCal.bopcals.splice(this.id, 1);
    }
    static destroyAll() {
        for (let cal of BopCal.bopcals) cal.destroy();
    }
    dragEvent() {
        // updates object in bopcal.events
    }
    getCalendars() {
        socket.send({
            f: 21,
        });
    }
    /**
     *
     * @param {PointerEvent} e
     */
    getDayElementDate(e) {
        const monthEl = e.target.parentNode.parentNode,
            day = e.target.getAttribute("data-date"),
            hours =
                (e.clientY - e.target.getBoundingClientRect().y) /
                (e.target.offsetHeight / 24);
        let date = new Date(parseInt(monthEl.getAttribute("data-value")));
        // if element classlist contains fade. day belongs to previous/next month
        if (e.target.classList.contains("fade"))
            e.target.parentNode === monthEl.firstElementChild
                ? date.setMonth(month.getMonth() - 1)
                : date.setMonth(month.getMonth() + 1);
        date.setDate(day);
        date.setTime(date.getTime() + hours * 60 * 60 * 1000);
        return date;
    }
    /**
     * First load of calendar.
     * @param {Date} [date]
     */
    generateCalendar(date = this.now) {
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
            quantity = 5, // how many months to load at once
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
        const calendar = this.calendars[idcal];
        let wrapper = document.createElement("li"),
            check = document.createElement("input"),
            name = document.createElement("span"),
            colorSelect = document.createElement("input"),
            removeButton = document.createElement("button");
        name.textContent = calendar.name;
        name.addEventListener("click", () => {
            this.setDefaultCal(idcal);
        });
        check.setAttribute("type", "checkbox");
        check.checked = calendar.visible;
        // if checked, show events, else hide them
        check.addEventListener("change", (e) =>
            this.toggleCalComponents(idcal, e.target.checked)
        );
        colorSelect.setAttribute("type", "color");
        colorSelect.value = calendar.color ? calendar.color : "#759ece";
        colorSelect.addEventListener("input", (e) => {
            const color = e.target.value;
            if (this.calendars[idcal].color !== color) {
                console.log(`cal#${idcal} set color to ${color}`);
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
        wrapper.append(check, name, colorSelect, removeButton);
        this.calendars[idcal].li = wrapper;
        this.minical.selector.append(wrapper);
        if (!this.active) this.setDefaultCal(idcal);
    }
    /**
     *
     * @param {Date} month
     */
    minicalFocus(date) {
        const month =
                this.minical.years[date.getFullYear()].months[date.getMonth()],
            x = month.offsetLeft,
            y = month.offsetTop;
        this.minical.cal.scrollTo({ top: y, left: x, behavior: "smooth" });
    }
    newCalendar() {
        if (Modal.modals.filter((x) => x.task === 27).length) {
            return Modal.modals.filter((x) => x.task === 27)[0].close();
        }
        new Modal({
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
            btn0listener: (e) => Modal.find(e.target).close(),
            btn1text: "créer",
            btn1style: "success",
        });
    }
    /**
     * Creates event in calendar
     * @param {Date} date
     */
    newEvent(date) {
        const start = toMYSQLDTString(date);
        date.setHours(date.getHours() + 1);
        const end = toMYSQLDTString(date);
        // send server new event data: start,end
        socket.send({
            f: 25,
            c: this.active,
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
            // replace alert with auto check on input and valid button disable if name unavailable.
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
                // data.response = [
                //     {
                //         idcal: {
                //             uid,
                //             idcal_component,
                //             type,
                //             summary,
                //             start,
                //             end,
                //             all_day,
                //             transparency,
                //             sequence,
                //             rrule,
                //             rdate,
                //             recur_id,
                //             thisandfuture,
                //             rrule,
                //             rdates,
                //             exceptions,
                //         },
                //     },
                // ];
                if (data.response)
                    for (const [key, value] of Object.entries(data.response))
                        cal.addComponent(key, value);
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
        }
    }
    /**
     * Places/updates event in bigcal according to event's data in bopcal.events.
     * @param {Number} idcal
     * @param {Object} event - event object stored in bigcal.
     */
    placeEvent(idcal, event) {
        // event = {
        //     uid: {
        //         start: Date,
        //         end: Date,
        //         allday: Boolean,
        //         elements: {
        //             date: HTMLElement,
        //         },
        //     },
        // };

        // for each day, set start/end according to event start/end
        for (const day of getDaysBetweenDates(event.start, event.end)) {
            const nextDay = new Date(
                    day.getFullYear(),
                    day.getMonth(),
                    day.getDate() + 1
                ),
                dateString = toYYYYMMDDString(day);
            let classes = [],
                top,
                height,
                el = event.elements[dateString] ?? undefined;
            const dayWrapper = el
                ? el.parentNode.parentNode
                : this.bigcal.years[day.getFullYear()].months[
                      day.getMonth()
                  ].querySelector(`[data-date="${day.getDate()}"]:not(.fade)`);
            if (event.allday) {
                if (event.start.valueOf() >= day.valueOf())
                    classes.push("start");
                if (event.end.valueOf() < nextDay.valueOf())
                    classes.push("end");
            } else {
                top =
                    event.start.valueOf() < day.valueOf()
                        ? "0px"
                        : this.calcEventTop(event.start);
                height =
                    event.end.valueOf() < nextDay
                        ? this.calcEventHeight(event.start, event.end)
                        : this.calcEventHeight(event.start, nextDay);
            }
            // if el of event exists
            if (el) {
                // if parent = allday
                if (el.parentNode === dayWrapper.firstElementChild) {
                    // if !event.allday, move element to dayWrapper, set top / height
                    if (!event.allday) {
                        dayWrapper.lastElementChild.append(el);
                        el.className = "";
                        el.style.top = top;
                        el.style.height = height;
                    }
                    // else if start/end, set classes accordingly
                    else el.className = classes.join(" ");
                }
                // if parent = dayWrapper
                else {
                    // if event.allday, move element to allday, set start/end classes
                    if (event.allday) {
                        dayWrapper.firstElementChild.append(el);
                        el.className = classes.join(" ");
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
                let summary = document.createElement("span"),
                    hour = document.createElement("span");
                summary.textContent = event.summary ?? "New event";
                hour.textContent = new Date(event.start).toTimeString();
                el.style.backgroundColor =
                    this.calendars[idcal].color ?? "turquoise";
                el.append(summary, hour);
                event.elements[dateString] = el;
                if (event.allday) {
                    dayWrapper.firstElementChild.append(el);
                    el.className = classes;
                } else {
                    dayWrapper.append(el);
                    // dayWrapper.lastElementChild.append(el);
                    el.style.top = top;
                    el.style.height = height;
                }
            }
        }
    }
    setDefaultCal(idcal) {
        if (this.active === idcal) return;
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
    toggleCalComponents(idcal, visible = true) {
        this.calendars[idcal].visible = visible;
        if (this.calendars[idcal].components)
            for (const component of Object.values(
                this.calendars[idcal].components
            ))
                for (const element of Object.values(component.elements))
                    visible
                        ? element.classList.remove(hide)
                        : element.classList.add(hide);
        // set visible = show to user_has_calendar;
        socket.send({ f: 31, c: idcal, v: visible ? 1 : 0 });
    }
    addFullCalEvent() {
        // manage batch rendering ?
        // fullcal event :
        // id
        // start
        // end
        // rrule
        // all day
        // title
        // url
        // extendedProps {}
    }
    addCalendarEvent() {
        // VEVENT
        // UID
        // CREATED: UTC
        // LAST-MODIFIED: UTC
        // DTSTAMP: UTC (set by caldav server when adding event?)
        // DTSTART: TZ or UTC
        // DTEND OR DURATION
        // TRANSP: OPAQUE OR TRANSPARENT (for busy time searches, not style related!)
        // SUMMARY: text
        // CATEGORIES: ~ tags/groups, e.g. CATEGORIES:ANNIVERSARY,PERSONAL,SPECIAL OCCASION
        // CLASS: related to securing access to event, allows non standard values, must be completed by calendar agent logic, does nothing alone. e.g. PUBLIC (default value), PRIVATE, CONFIDENTIAL...
        // ORGANIZER: CN (display name), MAILTO (email address). e.g. ORGANIZER;CN=John Smith:MAILTO:jsmith@host.com
        // ATTENDEE: CN=, MAILTO:, MEMBER=, DELEGATED-TO=, DELEGATED-FROM=,CUTYPE=
        // RELATED-TO: to figure out how it works.
        //
        // VALARM (nested in VEVENT or VTODO)
        // UID
        // ACTION: AUDIO, DISPLAY, EMAIL, PROCEDURE
        // TRIGGER: DURATION, UTC, START (requires DTSTART), END (requires DTEND, DTSTART & DURATION, or DUE in case of VTODO). e.g. -PT15M (15 min before), -P7W (7 weeks before)
        // ATTACH: audio component (unique), message attachments, local procedure (unique).
        // DESCRIPTION: display content, email body.
        // SUMMARY: email subject
        // ATTENDEE: email address (one per ATTENDEE property)
        // DURATION: e.g. PT5M (5 minutes)
        // REPEAT: integer, specifies number of times the alarm is to repeat, requires DURATION.
        //
        //      ; the following are optional,
        //      ; but MUST NOT occur more than once
        //      class / created / description / dtstart / geo /
        //      last-mod / location / organizer / priority /
        //      dtstamp / seq / status / summary / transp /
        //      uid / url / recurid /
        //      ; either 'dtend' or 'duration' may appear in
        //      ; a 'eventprop', but 'dtend' and 'duration'
        //      ; MUST NOT occur in the same 'eventprop'
        //      dtend / duration /
        //      ; the following are optional,
        //      ; and MAY occur more than once
        //      attach / attendee / categories / comment /
        //      contact / exdate / exrule / rstatus / related /
        //      resources / rdate / rrule / x-prop
    }
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
