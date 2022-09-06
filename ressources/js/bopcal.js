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
        calAdd.addEventListener("click", () => this.newCalendarModal());
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
    getCalendars() {
        socket.send({
            f: 21,
        });
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
        this.bigcal.cal.scrollTo({ top: y, left: x, behavior: "smooth" });
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
    /**
     * Adds event to calendar from object data.
     */
    addEvent(event, calendar) {
        // event = {
        //     uid: String,
        //     type: Number,
        //     summary: String,
        //     start: String, // datetime
        //     end: String, // datetime
        //     all_day: Number, // boolean
        //     transparency: Number, // boolean
        //     sequence: Number,
        //     rrule: Array, // boolean
        //     rdate: Number, // boolean
        //     rdates: Array,
        //     exceptions: Array,
        //     recur_id: String, // datetime
        //     thisandfuture: Number, // boolean
        // };

        this.events[event.uid] = {
            cal: calendar,
            start: new Date(`${event.start}Z`),
            end: new Date(`${event.end}Z`),
            allday: event.allday,
            elements: {},
        };
        this.placeEvent(this.events[event.uid]);
        if (1 === 0) {
            // start
            const start = new Date(event.start),
                // end
                end = new Date(event.end),
                // get day(s) element(s)
                days = getDaysFromDates(start, end),
                hourHeight = this.bigcal.layout.children[1].offsetHeight,
                hourOffsetTop = this.bigcal.layout.firstElementChild.offsetTop;
            let summary = document.createElement(""),
                description = document.createElement("");

            if (days.length > 1) {
                // for each element
                for (const day of days) {
                    const dayElement = this.bigcal.years[
                        day.getFullYear()
                    ].months[day.getMonth()].querySelector(
                        `[data-week="${getWeekNumber(
                            day
                        )}"][data-date="${day.getDate()}"]`
                    );
                    // create event
                    let event = document.createElement("div");
                    // if allday
                    if (event.allday) {
                        dayElement.firstElementChild.append(event);
                    } else {
                        dayElement.lastElementChild.append(event);
                        if (day === days[0]) {
                            // if start day
                            const duration = getMinutesBetweenDates(
                                day,
                                new Date(
                                    day.getFullYear(),
                                    day.getMonth(),
                                    day.getDate() + 1
                                )
                            );
                            // set height according to minutes * hourDiv.offsetHeight/60
                            event.style.height = `${
                                (duration * hourHeight) / 60
                            }px`;
                            // set bottom to 0
                            event.style.bottom = "0";
                        } else if (day === days[days.length - 1]) {
                            // if last day
                            const duration = getMinutesBetweenDates(
                                new Date(
                                    day.getFullYear(),
                                    day.getMonth(),
                                    day.getDate()
                                ),
                                day
                            );
                            // set top to first hour's top
                            event.style.top = `${hourOffsetTop}px`;
                            // set height accoding to minutes * hourDiv.offsetHeight/60
                            event.style.height = `${
                                (duration * hourHeight) / 60
                            }px`;
                        } else {
                            // else fill entire day
                            event.style.top = `${hourOffsetTop}px`;
                            event.style.bottom = "0";
                        }
                    }
                }
            } else {
                let event = document.createElement("div");
                const dayElement = this.bigcal.years[
                    start.getFullYear()
                ].months[start.getMonth()].querySelector(
                    `[data-week="${getWeekNumber(
                        start
                    )}"][data-date="${start.getDate()}"]`
                );
                // if allday, set to allday div of day.
                if (event.allday) dayElement.firstElementChild.append(event);
                // set top to hour's div offsetTop + minutes * hour.offsetHeight / 60
                else {
                    const duration = getMinutesBetweenDates(start, end);

                    event.style.top = `${
                        hourOffsetTop +
                        (getMinutesBetweenDates(
                            new Date(
                                start.getFullYear(),
                                start.getMonth(),
                                start.getDate()
                            ),
                            start
                        ) *
                            hourHeight) /
                            60
                    }px`;
                    // set event height to diff between start and end
                    event.style.height = `${(duration * hourHeight) / 60}px`;
                }
            }
        }
    }
    dragEvent() {
        // updates object in bopcal.events
    }
    /**
     * Places/updates event in bigcal according to event's data in bopcal.events.
     * @param {Object} event - event object stored in bigcal.
     */
    placeEvent(event) {
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
            let classes = [],
                top,
                height,
                el = event.elements[dateString] ?? undefined;
            const dayWrapper = el
                    ? el.parentNode.parentNode
                    : this.bigcal.years[day.getFullYear()].months[
                          day.getMonth()
                      ].querySelector(
                          `[data-date="${day.getDate()}"]:not(.fade)`
                      ),
                nextDay = new Date(
                    day.getFullYear(),
                    day.getMonth(),
                    day.getDate() + 1
                ),
                dateString = toYYYYMMDDString(day);
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
                    this.calendars[event.cal].color ?? "purple";
                el.append(summary, hour);
                event.elements[dateString] = el;
                if (event.allday) {
                    dayWrapper.firstElementChild.append(el);
                    el.className = classes;
                } else {
                    dayWrapper.lastElementChild.append(el);
                    el.style.top = top;
                    el.style.height = height;
                }
            }
        }
    }
    newCalendarModal() {
        if (Modal.modals.filter((x) => x.task === 27).length)
            return msg.new({
                type: "warning",
                content:
                    "Une fenêtre de création de calendrier est déjà ouverte.",
            });
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
                    placeholder: "Description",
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
     * @param {Number} cal - Calendar id
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
    /**
     * @param {Date} date
     */
    calcEventTop(date) {
        return `${
            (this.bigcal.layout.firstChild.offsetHeight * date.valueOf()) /
            1000 /
            60 /
            60
        }px`;
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
    minicalAddCalendar(idcal) {
        const calendar = this.calendars[idcal];
        let wrapper = document.createElement("li"),
            check = document.createElement("input"),
            name = document.createElement("span"),
            colorSelect = document.createElement("input"),
            removeButton = document.createElement("button");
        name.textContent = calendar.name;
        check.setAttribute("type", "checkbox");
        colorSelect.setAttribute("type", "color");
        colorSelect.value = calendar.color ? calendar.color : "#759ece";
        colorSelect.addEventListener("input", (e) => {
            // update calendar color in db with e.target.value
        });
        removeButton.addEventListener("click", () => {
            // alert to confirm:
            console.log(`remove cal #${idcal}`);
            // if calendar owner, delete calendar
            // else remove
        });
        wrapper.append(check, name, colorSelect, removeButton);
        this.calendars[idcal].li = wrapper;
        this.minical.selector.append(wrapper);
    }
    addCalendar(calendar) {
        // add calendar to this.calendars
        this.calendars[calendar.id] = {
            name: calendar.name,
            description: calendar.description,
            color: calendar.color ?? undefined,
            owner: calendar.owner,
            read_only: calendar.read_only,
        };
        this.minicalAddCalendar(calendar.id);
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
    static getEvents(start, end) {
        // check if asked range in stored range, else fetch.
        // foreach day of range, check if data in cache, else fetch.

        socket.send({
            f: 21,
            start: start,
            end: end,
        });
    }
    static parse(data) {
        const cal = BopCal.bopcals[0];
        if (data.response.fail)
            // replace alert with auto check on input and valid button disable if name unavailable.
            return msg.new({
                content: "Un calendrier avec ce nom existe déjà.",
                type: "warning",
            });
        switch (data.f) {
            case 21:
                // calendars and static values
                for (const [key, value] of Object.entries(data.response))
                    cal[key] = value;
                cal.active = Object.keys(cal.calendars)[0];
                for (const key of Object.keys(cal.calendars))
                    cal.minicalAddCalendar(key);
                break;
            case 25:
                // new event
                cal.addEvent(data.response.event, data.c);
                break;
            case 27:
                // new calendar
                cal.addCalendar(data.response);
                Modal.modals.filter((x) => x.task === 27)[0].close();
                break;
        }

        // old fullcal unfinished shit
        if (1 === 2) {
            // parse calendars
            for (const cal of data.response) {
                let uids = [];
                const start = "",
                    end = "";
                if (!BopCal.calendars[cal.name])
                    BopCal.calendars[cal.name] = {};
                // parse events
                for (const ical of cal.data) {
                    const event = BopCal.icalToObject(ical.data);
                    if (
                        !BopCal.calendars[cal.name][event.uid] ||
                        BopCal.calendars[cal.name][event.uid].etag !== ical.etag
                    ) {
                        BopCal.calendars[cal.name][event.uid] = {
                            etag: ical.etag,
                            href: ical.href,
                            ical: event,
                        };
                        uids.push(event.uid);
                        for (const fullCal of BopCal.fullCalendars) {
                            // manage case where user opened/is editing event that is to be removed/updated
                            // alert 'this event has been updated, would you like to apply these modifications, create a new event or refresh this window ?'

                            // queue remove event (wip)
                            fullCal.getEventById(event.uid)?.remove();
                            // queue add event (wip)
                            addFullCalEvent(fullCal, event);
                        }
                    }
                }
                // remove BopCal events that are in range of data but absent from it
                for (const [key, value] of Object.entries(
                    BopCal.calendars[cal.name]
                ))
                    if (
                        !uids.includes(key) &&
                        value.start < end &&
                        value.end > start
                    )
                        delete BopCal.calendars[cal.name][key];
            }

            // for each fullCalendar, sync events with BopCal
            for (const fullCal of BopCal.fullCalendars) {
                let fullCalEvents = fullCal.getEvents();
                // remove events not in BopCal
                for (const fullCalEvent of fullCalEvents) {
                    if (
                        !BopCal.calendars[
                            fullCalEvent.extendedProps.calendarName
                        ][fullCalEvent.id]
                    )
                        fullCalEvent.remove();
                }
            }
        }

        if (0 === 1) {
            const field = Field.fields[data.x];
            for (const calendar of data.response) {
                if (!field.data[calendar.name])
                    field.data[calendar.name] = {
                        role: calendar.role,
                        events: {},
                    };
                field.calendar.batchRendering(() => {
                    for (const event of calendar.events) {
                        // console.log(icalToObject(event.data));
                        const eventObject = icalToObject(event.data);
                        field.data[calendar.name].events[eventObject.uid] = {
                            etag: event.etag,
                            href: event.href,
                            data: eventObject,
                        };
                        delete field.data[calendar.name].events[eventObject.uid]
                            .data.uid;
                        field.calendar.addEvent({
                            id: eventObject.uid,
                            title: eventObject.VCALENDAR.VEVENT.TITLE,
                            // allDay: create condition to check wether the event is allday or not
                            // start:,
                            // end:,
                        });
                    }
                });
            }
        }
    }
    addFullCalEvent(fullcal, event) {
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
        fullCal.addEvent();
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
