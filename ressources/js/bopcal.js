/**
 * Creates calendar in specified wrapper, with the ability to generate clones.
 */
class BopCal {
    static bopcals = [];
    static fullCalendars = [];
    static calendars = {};
    static events = [];
    constructor(element) {
        BopCal.bopcals.push(this);
        this.now = new Date();
        this.id = BopCal.cals.indexOf(this);
        this.wrapper = element;
        this.wrapper.classList.add("bopcal");
        this.menu = document.createElement("div");
        this.weekstart = 1; // 0 = sunday
        this.minical = document.createElement("div");

        this.calendar = document.createElement("div");
        BopCal.fullCalendars.push({
            instance: new FullCalendar.Calendar(this.calendar, {
                // events: function (info, successCallback, failureCallback) {
                //     // set new range
                //     BopCal.fullCalendars[0].range = [
                //         info.start.valueOf(),
                //         info.end.valueOf(),
                //     ];
                //     // remove events from unused days
                //     // getEvents
                //     BopCal.getEvents(info.start.valueOf(), info.end.valueOf());
                // },
                headerToolbar: {
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                },
                height: "100%",
                initialView: "dayGridMonth",
                locale: "fr",
                navLinks: "true",
                nowIndicator: "true",
                weekNumbers: "true",
                weekNumberFormat: { week: "numeric" },
            }),
            range: [],
        });
    }
    gridAddWeek(grid) {}
    gridAddDay(grid) {
        // if(weekrow.children[date.getDay])
    }
    gridFocusDate(grid, date) {}
    gridAddMonth(grid, date) {
        const loadMonthBefore = (month) =>
                grid.insertBefore(generateMonth(month), grid.firstElementChild),
            loadMonthAfter = (month) => grid.append(generateMonth(month)),
            generateMonth = (month) => {
                let monthWrapper = document.createElement("div"),
                    day = getFirstDayOfWeek(month);
                while (
                    day <
                    getLastDayOfWeek(
                        new Date(month.getFullYear(), month.getMonth() + 1, 0)
                    )
                ) {
                    this.gridAddDay(grid, day);
                    day.setDate(day.getDate() + 1);
                }

                return monthWrapper;
            };
        // month = first week to last week, including other monthes days
        // => this, but with the option to hide duplicate weeks to show a compact view.

        // check first and last months in grid
        const gridFirstMonth = new Date(
                grid.firstElementChild.getAttribute("data-date")
            ),
            gridLastMonth = new Date(
                grid.lastElementChild.getAttribute("data-date")
            ),
            targetMonth = new Date(date.getFullYear(), date.getMonth());
        // else if not right after last or before first, first load months in between
        if (
            date >=
            new Date(gridLastMonth.getFullYear(), gridLastMonth.getMonth() + 1)
        ) {
            let month = new Date(
                gridLastMonth.getFullYear(),
                gridLastMonth.getMonth() + 1
            );
            while (month <= targetMonth) {
                loadMonthAfter(month);
                month.setMonth(month.getMonth() + 1);
            }
        } else if (date < gridFirstMonth) {
            let month = new Date(
                gridFirstMonth.getFullYear(),
                gridFirstMonth.getMonth() - 1
            );
            while (month >= targetMonth) {
                loadMonthBefore(month);
                month.setMonth(month.getMonth() - 1);
            }
        } else console.info("Month already loaded.");

        // hover on month changes its colors to focus theme
        // hover on week zooms a bit more on it
        // grid for month, not the whole calendar.

        // get last date of grid, else get start date of grid
        let lastDate =
                grid.lastElementChild?.lastElementChild?.getAttribute(
                    "data-date"
                ),
            firstDate;
        if (lastDate) {
            prevDate = new Date(lastDate);
            firstDate = new Date(
                prevDate.getFullYear(),
                prevDate.getMonth(),
                prevDate.getDate() + 1
            );
        } else {
            startDate = new Date(grid.getAttribute("data-start"));
            if (startDate.getDay() !== this.weekstart) {
                const day = startDate.getDay();
                firstDate = new Date(
                    startDate.getFullYear(),
                    startDate.getMonth(),
                    startDate.getDate() -
                        (day < this.weekstart
                            ? day + 7 - this.weekstart
                            : day - this.weekstart)
                );
            } else firstDate = startDate;
        }

        const year = date.getFullYear(),
            month = date.getMonth(),
            firstOfMonth = new Date(year, month, 1).getDay(),
            days = new Date(year, month, 0).getDate();
        let firstOfWeek;

        // get first day of the first week of month
        if (first !== this.weekstart) {
            firstOfWeek = new Date(
                year,
                month,
                -(firstOfMonth < this.weekstart
                    ? firstOfMonth + 7 - this.weekstart
                    : firstOfMonth - this.weekstart)
            );

            let j = 0;
            for (let i = difference; i > 0; i--) {
                let span = document.createElement("span");
                const date = new Date(year, month, -difference);
                span.textContent = date.getDate();
                weekrow.children[j].setAttribute(
                    "data-date",
                    date.toISOString()
                );
                weekrow.children[j++].append(span);
            }
        }

        // if first of month !== weekstart and previous cells are empty or absent, generate them
        if (first !== this.weekstart) {
            if (weekrow.children[0].children.length === 0) {
                const difference =
                    first < this.weekstart
                        ? first + 7 - this.weekstart
                        : first - this.weekstart;
                let j = 0;
                for (let i = difference; i > 0; i--) {
                    let span = document.createElement("span");
                    const date = new Date(year, month, -difference);
                    span.textContent = date.getDate();
                    weekrow.children[j].setAttribute(
                        "data-date",
                        date.toISOString()
                    );
                    weekrow.children[j++].append(span);
                }
            }
        }
        for (let i = 0; i < days; i++) {}
    }
    generateCalendarGrid(date) {
        // actualize date
        this.now = new Date();
        // set first date of calendar

        // create grid
        let grid = document.createElement("div");
        grid.setAttribute("data-start", date.toISOString());

        // get actual month : create rows/cells accordingly

        // create first row with 7 cells
        // for each day of month
        // if weekday = weekstart, create new row, fill first cell
        // else fill cell from corresponding weekday.

        // new grid: 7 columns

        // month name:
        // position: absolute
        // top = top from row containing 1st of month - 1 x row height
        // left: 100 %
        // width = (count(row from 1st of month until 1st of next month) - 1) x row height
        // rotate 90, origin: bottom left
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
