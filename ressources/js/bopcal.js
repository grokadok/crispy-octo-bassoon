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
        this.id = BopCal.cals.indexOf(this);
        this.wrapper = element;
        BopCal.fullCalendars.push({
            instance: new FullCalendar.Calendar(fieldElement, {
                events: function (info, successCallback, failureCallback) {
                    // set new range
                    BopCal.fullCalendars[0].range = [
                        info.start.valueOf(),
                        info.end.valueOf(),
                    ];
                    // remove events from unused days
                    // getEvents
                    BopCal.getEvents(info.start.valueOf(), info.end.valueOf());
                },
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
    static calTimeToUnix(cal) {}
    static getEvents(start, end) {
        // check if asked range in stored range, else fetch.
        // foreach day of range, check if data in cache, else fetch.

        socket.send({
            f: 21,
            start: start,
            end: end,
        });
    }
    /**
     * Parses ical string into object, adding uid at first level (remove it before converting back to string).
     * @param {String} ical
     * @returns
     */
    static icalToObject(ical) {
        // !!!!!!!!
        // WONT WORK WITH MULTIPLE OF OBJECT TYPES (e.g. more than one VALARM)
        // !!!!!!!!

        // find separator
        const separator = ical.includes("\r\n") ? "\r\n" : "\n";
        // set cursor
        let icalObject = {},
            cursor = [],
            insertPoint;
        // for each line
        for (const cal of ical.split(separator).filter((x) => x !== "")) {
            const val = cal.split(":");
            switch (val[0]) {
                case "BEGIN":
                    // store property object
                    insertPoint = icalObject;
                    for (let i = cursor.length - 1; i >= 0; i--)
                        insertPoint = insertPoint[cursor[i]];
                    insertPoint[val[1]] = {};
                    cursor.unshift(val[1]);
                    break;
                case "END":
                    cursor.shift();
                    break;
                default:
                    // store property value
                    if (val[0] === "UID") icalObject.uid = val[1];
                    insertPoint = icalObject;
                    for (let i = cursor.length - 1; i >= 0; i--)
                        insertPoint = insertPoint[cursor[i]];
                    insertPoint[val[0]] = val[1];
            }
        }
        // convert to UTC
        // if VTIMEZONE
        // set TZID:Offset
        // if DAYLIGHT
        // if start in daylight, apply daylight offset, else tzid offset
        return icalObject;
    }
    /**
     * Parse calendar object to valid ical string (sortof).
     * @param {Object} cal - ical object generated with icalToObject().
     */
    objectToIcal(cal) {
        let ical = "";
        const action = (key, value) => {
            if (typeof value === "string") ical += `${key}:${value}\n`;
            else {
                ical += `BEGIN:${key}\n`;
                for (const [k, v] of Object.entries(value)) action(k, v);
                ical += `END:${key}\n`;
            }
        };
        for (const [key, value] of Object.entries(cal)) action(key, value);
        return ical;
    }
    rangeIncludesDate(range, date) {
        // date to milliseconds
        // if range[0]<=date<=range[1]
        // return true, else false.
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
    /**
     * Format a date string to a string accepted by SimpleCalDAVClient.
     * @param {String} date
     * @returns {String|false} String in the format yyyymmddThhmmssZ
     */
    toCalDAVString(date) {
        try {
            return (
                new Date(date).toISOString().replace(/:|-/g, "").slice(0, -5) +
                "Z"
            );
        } catch (e) {
            console.error(e);
            return false;
        }
    }
    /**
     * Convert compact ISO8601 string to extended for fullcalendar.
     * @param {String} date
     */
    toISO8601ExtString(date) {
        date = date.slice(0, 4) + "-" + date.slice(4, 6) + "-" + date.slice(6);
        if (date.length > 10)
            date =
                date.slice(0, 13) +
                ":" +
                date.slice(13, 15) +
                ":" +
                date.slice(15);
        return date;
    }
}
