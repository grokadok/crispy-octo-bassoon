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
        this.minical = document.createElement("div");
        this.minical.className = "mini";
        this.bigcal = document.createElement("div");
        this.toggle = document.createElement("button");
        this.toggle.textContent = "calendar";
        this.toggle.addEventListener("click", () => {
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

        this.generateCalendar();

        this.wrapper.append(this.toggle, this.menu, this.minical, this.bigcal);

        // BopCal.fullCalendars.push({
        //     instance: new FullCalendar.Calendar(this.calendar, {
        //         // events: function (info, successCallback, failureCallback) {
        //         //     // set new range
        //         //     BopCal.fullCalendars[0].range = [
        //         //         info.start.valueOf(),
        //         //         info.end.valueOf(),
        //         //     ];
        //         //     // remove events from unused days
        //         //     // getEvents
        //         //     BopCal.getEvents(info.start.valueOf(), info.end.valueOf());
        //         // },
        //         headerToolbar: {
        //             left: "prev,next today",
        //             center: "title",
        //             right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        //         },
        //         height: "100%",
        //         initialView: "dayGridMonth",
        //         locale: "fr",
        //         navLinks: "true",
        //         nowIndicator: "true",
        //         weekNumbers: "true",
        //         weekNumberFormat: { week: "numeric" },
        //     }),
        //     range: [],
        // });
    }
    focusDate(date) {}
    destroy() {
        this.wrapper.innerHTML = "";
        this.wrapper.className = "loading hidden";
        BopCal.bopcals.splice(this.id, 1);
    }
    static destroyAll() {
        for (let cal of BopCal.bopcals) cal.destroy();
    }
    /**
     * Add month to calendars.
     * @param {Date} date
     */
    addMonth(date) {
        // month = first week to last week, including other monthes days
        // => this, but with the option to hide duplicate weeks to show a compact view.
        const year = date.getFullYear(),
            month = date.getMonth();

        // if year not in calendar, create it with its months.
        if (!this.years[year]) {
            let yearWrapper = document.createElement("div");
            yearWrapper.setAttribute("data-year", year);
            this.years[year] = { months: {}, wrapper: yearWrapper };
            for (let i = 0; i < 12; i++) {
                let monthWrapper = document.createElement("div");
                monthWrapper.setAttribute(
                    "data-month",
                    new Date(year, i).toLocaleString("default", {
                        month: "long",
                    })
                );
                monthWrapper.className = "hidden";
                this.years[year].months[i] = monthWrapper;
                yearWrapper.append(monthWrapper);
            }
            this.minical.append(yearWrapper);
        }

        // fill month
        let monthWrapper = this.years[year].months[month],
            day = getFirstDayOfWeek(date),
            weekWrapper;
        if (!monthWrapper.innerHTML) {
            monthWrapper.classList.remove("hidden");
            while (day <= getLastDayOfWeek(new Date(year, month + 1, 0))) {
                if (day.getDay() === this.weekstart) {
                    const weekNumber = getWeekNumber(day);
                    weekWrapper = document.createElement("div");
                    weekWrapper.setAttribute("data-week", weekNumber);
                    monthWrapper.append(weekWrapper);
                }
                let dayWrapper = document.createElement("div");
                dayWrapper.setAttribute("data-date", day.getDate());
                weekWrapper.append(dayWrapper);
                day.setDate(day.getDate() + 1);
            }
        } else console.info(`Month ${month} already created.`);

        // hover on month changes its colors to focus theme
        // hover on week zooms a bit more on it
        // grid for month, not the whole calendar.
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
        // parse calendars
        for (const cal of data.response) {
            let uids = [];
            const start = "",
                end = "";
            if (!BopCal.calendars[cal.name]) BopCal.calendars[cal.name] = {};
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
                    !BopCal.calendars[fullCalEvent.extendedProps.calendarName][
                        fullCalEvent.id
                    ]
                )
                    fullCalEvent.remove();
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
