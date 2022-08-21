<?php

namespace bopdev;

trait BopCal
{
    use \SimpleCalDavClient;

    private $calendarTypes = ['caldav'];

    private function getLocalCalendars(int $iduser)
    {
        $cal_folders = $this->db->request([
            'query' => 'SELECT idcal_folder FROM user_has_calendar WHERE iduser = ?;',
            'type' => 'i',
            'content' => [$iduser],
            'array' => true,
        ]);
        return $cal_folders;
    }

    private function getCalFilesFromFolder(int $cal_folder)
    {
        $cal_files = $this->db->request([
            'query' => 'SELECT uid,etag FROM cal_file WHERE idcal_folder = ?;',
            'type' => 'i',
            'content' => [$cal_folder],
            'array' => false,
        ]);
        return $cal_files;
    }
    /**
     * Creates a new cal folder.
     * @param int $iduser User id to link the folder to.
     * @param array $folder Associative array containing name and optionnal description.
     * @param string $folder['name'] Calendar's name.
     * @param string $folder['description] Optionnal folder description.
     */
    private function newCalFolder(int $iduser, array $folder)
    {
        $request = [];
        if (isset($folder['description'])) {
            $this->db->request([
                'query' => 'INSERT INTO cal_description (content) VALUES (?);',
                'type' => 's',
                'content' => [$folder['description']],
            ]);
            $request['into'] = ',description';
            $request['values'] = ',?';
            $request['type'] = 'i';
            $request['content'] = $this->db->request([
                'query' => 'SELECT MAX(idcal_description) FROM cal_description WHERE content = ? LIMIT 1;',
                'type' => 's',
                'content' => [$folder['description']],
                'array' => true,
            ])[0][0];
        }
        $this->db->request([
            'query' => 'INSERT INTO cal_folder (name' . $request['into'] . ') VALUES (?' . $request['values'] . ';',
            'type' => 's' . $request['type'],
            'content' => [$folder['name'], $request['content']],
        ]);
        return $this->db->request([
            'query' => 'SELECT MAX(idcal_folder) FROM cal_folder LEFT JOIN user_has_calendar USING(idcal_folder) WHERE name = ? AND iduser = ?;',
            'type' => 'si',
            'content' => [$folder['name'], $iduser],
            'array' => true,
        ])[0][0];
    }
    /**
     * Creates a new calendar file.
     * @param array $folder
     */
    private function newCalFile(array $folder)
    {
        $uuid = $this->db->request([
            'query' => 'SELECT uuid();',
        ])[0][0];
        $this->db->request([
            'query' => 'INSERT INTO cal_file (uid, idcal_folder) VALUES ((SELECT UUID_TO_BIN(?,1), ?);',
            'type' => 'si',
            'content' => [$uuid, $folder],
        ]);
        return $uuid;
    }
    private function addAlarm($idcomponent, $alarm)
    {
        $request = [
            'into' => '',
            'values' => '',
            'type' => '',
            'content' => [],
        ];
        // trigger
        if (isset($alarm['absolute'])) {
            // absolute
            $request['into'] .= ',trigger_absolute';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $alarm['absolute'];
        } else if (isset($alarm['relative'])) {
            // relative
            $request['into'] .= ',trigger_relative';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $alarm['relative'];
            // related
            $request['into'] .= ',trigger_related';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $alarm['related'];
        }
        // summary
        if (isset($alarm['summary'])) {
            $request['into'] .= ',summary';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $alarm['summary'];
        }
        // description
        if (isset($alarm['description'])) {
            $request['into'] .= ',description';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $this->addDescription($alarm['description']);
        }
        // repeat
        if (isset($alarm['repeat'])) {
            $request['into'] .= ',repeat';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $alarm['repeat'];
        }
        // repeat
        if (isset($alarm['duration'])) {
            $request['into'] .= ',duration';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $alarm['duration'];
        }
        $this->db->request([
            'query' => 'INSERT INTO cal_alarm (idcal_component,action' . $request['into'] . ') VALUES (?,?' . $request['values'] . ');',
            'type' => 'ii' . $request['type'],
            'content' => [$idcomponent, $alarm['action'], ...$request['content']],
        ]);
    }
    /**
     * Adds cal_description if not exists, returns its id.
     * @param string $content Description text.
     */
    private function addDescription(string $content)
    {
        if (!isset($this->db->request([
            'query' => 'SELECT idcal_description FROM cal_description WHERE content = ? LIMIT 1;',
            'type' => 's',
            'content' => [$content],
            'array' => true,
        ])[0][0]))
            $this->db->request([
                'query' => 'INSERT INTO cal_description (content) VALUES (?);',
                'type' => 's',
                'content' => [$content],
            ]);
        return $this->db->request([
            'query' => 'SELECT idcal_description FROM cal_description WHERE content = ? LIMIT 1;',
            'type' => 's',
            'content' => [$content],
            'array' => true,
        ])[0][0];
    }
    private function addAttendee()
    {
    }
    private function addRecurrenceDate(int $idcomponent, string $date)
    {
        $this->db->request([
            'query' => 'INSERT INTO cal_rdate (idcomponent, date) VALUES (?, ?);',
            'type' => 'is',
            'content' => [$idcomponent, $date],
        ]);
    }
    private function addRecurrenceRule(int $idcomponent, array $recurrence)
    {
        $request = [
            'into' => '',
            'values' => '',
            'type' => '',
            'content' => []
        ];
        // frequency
        if (isset($recurrence['frequency'])) {
            $request['into'] .= ',frequency';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $recurrence['frequency'];
        }
        // interval
        if (isset($recurrence['interval'])) {
            $request['into'] .= ',interval';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $recurrence['interval'];
        }
        // until
        if (isset($recurrence['until'])) {
            $request['into'] .= ',until';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $recurrence['until'];
        }
        // count
        if (isset($recurrence['count'])) {
            $request['into'] .= ',count';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $recurrence['count'];
        }
        // week_start
        if (isset($recurrence['week_start'])) {
            $request['into'] .= ',week_start';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $recurrence['week_start'];
        }
        // by_day
        if (isset($recurrence['by_day'])) {
            $request['into'] .= ',by_day';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $recurrence['by_day'];
        }
        // recurring: by_monthday ?
        if (isset($recurrence['by_month_day'])) {
            $request['into'] .= ',by_month_day';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $recurrence['by_month_day'];
        }
        // recurring: by_month ?
        if (isset($recurrence['by_month'])) {
            $request['into'] .= ',by_month';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $recurrence['by_month'];
        }
        // recurring: by_setpos ?
        if (isset($recurrence['by_setpos'])) {
            $request['into'] .= ',by_setpos';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $recurrence['by_setpos'];
        }

        $this->db->request([
            'query' => 'INSERT INTO cal_rrule (idcal_component, ' . $request['into'] . ') VALUES (?, ' . $request['values'] . ');',
            'type' => 'i' . $request['type'],
            'content' => [$idcomponent, ...$request['content']],
        ]);
    }
    private function addEvent(int $iduser, string $uid, array $event)
    {
        $request = [
            'into' => '',
            'values' => '',
            'type' => '',
            'content' => [],
        ];

        // description
        if (isset($event['description'])) {
            $request['into'] .= ',description';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['value'][] = $this->addDescription($event['description']);
        }
        // timezone
        if (isset($event['timezone'])) {
            $request['into'] .= ',timezone';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['value'][] = $this->db->request([
                'query' => 'SELECT idtimezone FROM timezone WHERE name = ? LIMIT 1;',
                'type' => 's',
                'content' => [$event['timezone']],
                'array' => true,
            ])[0][0];
        }
        // end or duration
        if (isset($event['end'])) {
            $request['into'] .= ',end';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['value'][] = $event['end'];
        } else {
            $request['into'] .= ',duration';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['value'][] = $event['duration'];
        }
        // allday
        if (isset($event['allday'])) {
            $request['into'] .= ',all_day';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['value'][] = $event['allday'];
        }
        // class
        if (isset($event['class'])) {
            $request['into'] .= ',class';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['value'][] = $event['class'];
        }
        // location
        if (isset($event['location'])) {
            $this->db->request([
                'query' => 'INSERT INTO cal_location (name) VALUES (?);',
                'type' => 's',
                'content' => [$event['location']],
            ]);
            $request['into'] .= ',location';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['value'][]  = $this->db->request([
                'query' => 'SELECT idcal_location FROM location WHERE name = ? LIMIT 1;',
                'type' => 'i',
                'content' => [$event['location']],
                'array' => true,
            ])[0][0];
        }
        // priority
        if (isset($event['priority'])) {
            $request['into'] .= ',priority';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['value'][] = $event['priority'];
        }
        // status
        if (isset($event['status'])) {
            $request['into'] .= ',status';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['value'][] = $event['status'];
        }
        // transparency
        if (isset($event['transparency'])) {
            $request['into'] .= ',transparency';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['value'][] = $event['transparency'];
        }


        $this->db->request([
            'query' => 'INSERT INTO cal_component (uid, type, created, summary, organizer, start) VALUES ((SELECT UUID_TO_BIN(?,1)), 0, ?, ?, ?, ?);',
            'type' => 'sssisssii',
            'content' => [$uid, $event['created'], $event['summary'], $iduser, $event['start'], $event['end'], $event['duration'], $event['allday'], $event['transparency']],
            'array' => true,
        ]);
        $idcomponent = $this->db->request([
            'query' => 'SELECT MAX(idcal_component) FROM cal_component WHERE uid = (SELECT UUID_TO_BIN(?, 1)) AND created = ? LIMIT 1;',
            'type' => 'ss',
            'content' => [$uid,],
            'array' => true,
        ])[0][0];


        // recurrence
        if (isset($event['rrule'])) {
            // update component
            $this->db->request([
                'query' => 'UPDATE cal_component SET rrule = 1 WHERE idcal_component = ? LIMIT 1;',
                'type' => 'i',
                'content' => [$idcomponent],
            ]);
            // insert rrule
            $this->addRecurrenceRule($idcomponent, $event['rrule']);
        }
        if (isset($event['rdate'])) {
            $this->db->request([
                'query' => 'UPDATE cal_component SET rdate = 1 WHERE idcal_component = ? LIMIT 1;',
                'type' => 'i',
                'content' => [$idcomponent],
            ]);
            // insert rdates
            foreach ($event['rdate'] as $date) {
                $this->db->request([
                    'query' => 'INSERT INTO cal_rdate (idcal_component, date) VALUES (?, ?);',
                    'type' => 'is',
                    'content' => [$idcomponent, $date],
                ]);
            }
        }

        // tags ?

        // todo: due ? - not compatible with duration property.

        // reccuring ?
        // recurring: frequency ?
        // recurring: interval ?
        // recurring: until ?
        // recurring: count ?
        // recurring: week_start ?
        // recurring: by_day ?
        // recurring: by_monthday ?
        // recurring: by_month ?
        // recurring: by_setpos ?
        // recurring: exceptions ?
        // recurring: exceptions: date
        // recurring: exceptions: all_day ?

        // alarms ?
        // alarms: action
        // alarms: trigger absolute ?
        // alarms: trigger relative ?
        // alarms: trigger related ?
        // alarms: summary ? - action=EMAIL: subject.
        // alarms: description ? - action=EMAIL: body, action=DISPLAY: text content.
        // alarms: repeat ?
        // alarms: duration ? - interval between repeats.

        // attendees ?
        // attendees: attendee
        // attendees: delegated from ?
        // attendees: delegated to ?
        // attendees: sent by ?
        // attendees: language ?
        // attendees: user type ?
        // attendees: role ?
        // attendees: status ?
    }

    private function changeComponent()
    {
    }

    /**
     * Gets event(s) for given uid.
     * @param int $uid Duh.
     */
    private function getEventsFromUid(int $uid)
    {
        $events = $this->db->request([
            'query' => 'SELECT idcal_component, summary, idcal_description, organizer, idtimezone, start, end, duration, allday, idcal_class, idcal_location, idpriority, idcal_status, transparency, percent_completion, sequence, recur_rule, recur_id_range, recur_id_date
            FROM cal_component
            WHERE type = 0 AND uid = ?;',
            'type' => 'i',
            'content' => [$uid],
            'array' => false,
        ]);
        $response = [
            'descriptions' => [],
            'events' => [],
            'languages' => [],
            'tags' => [],
            'timezones' => [],
            'users' => [],
        ];

        foreach ($events as $event) {
            // get description
            addIfNotNullNorExists($event['idcal_description'], $response['descriptions']);

            // get organizer
            addIfNotNullNorExists($event['organizer'], $response['users']);

            // get timezone
            addIfNotNullNorExists($event['idtimezone'], $response['timezones']);

            // get location
            $event['location'] = isset($event['idcal_location']) ? $this->db->request([
                'query' => 'SELECT name FROM cal_location WHERE idcal_location = ? LIMIT 1;',
                'type' => 'i',
                'content' => [$event['idcal_location']],
                'array' => true,
            ])[0][0] : '';

            // get recurrence
            if (isset($event['recur_rule'])) {
                $event['recurrence'] = $this->db->request([
                    'query' => 'SELECT idcal_frequency, set_interval, until, count, week_start, by_day, by_monthday, by_month, by_setpos FROM cal_recurrence WHERE idcal_recurrence = ? LIMIT 1;',
                    'type' => 'i',
                    'content' => [$event['recur_rule']],
                    'array' => false,
                ])[0];

                // get exceptions
                $event['recurrence']['exceptions'] = $this->db->request([
                    'query' => 'SELECT date,all_day FROM cal_comp_has_exc LEFT JOIN cal_exception USING (idcal_exception) WHERE idcal_component = ?;',
                    'type' => 'i',
                    'content' => [$event['idcal_component']],
                    'array' => false,
                ]);
            }

            // get attendees
            $event['attendees'] = $this->db->request([
                'query' => 'SELECT attendee, delegated_from, delegated_to, idlanguage, sent_by, idcal_role, idcal_status, rsvp FROM cal_attendee WHERE idcal_component = ?;',
                'type' => 'i',
                'content' => [$event['ical_component']],
                'array' => true,
            ]);
            foreach ($event['attendees'] as $attendee) {
                foreach ([$attendee['attendee'], $attendee['delegated_from'], $attendee['delegated_to'], $attendee['sent_by']] as $value)
                    addIfNotNullNorExists($response['users'], $value);
                addIfNotNullNorExists($attendee['idlanguage'], $response['languages']);
            }

            // get alarms
            $event['alarms'] = $this->db->request([
                'query' => 'SELECT idcal_alarm, idcal_action, trigger_absolute, trigger_relative, trigger_related, summary, idcal_description, duration, repeat_times FROM cal_alarm WHERE idcal_component = ?;',
                'type' => 'i',
                'content' => [$event['idcal_component']],
                'array' => false,
            ]);
            foreach ($event['alarms'] as $alarm) addIfNotNullNorExists($alarm['idcal_description'], $response['descriptions']);

            // get tags
            $event['tags'] = $this->db->request([
                'query' => 'SELECT idtag FROM cal_comp_has_tag WHERE idcal_component = ?;',
                'type' => 'i',
                'content' => [$event['idcal_component']],
                'array' => true,
            ]);
            foreach ($event['tags'] as $tag) addIfNotNullNorExists($tag[0], $response['tags']);

            $response['events'][$event['idcal_component']] = $event;
        }
        return $response;
    }

    /**
     * Get external calendars of all or selected types linked to a user.
     * @param int $iduser User to get calendars from.
     * @param null|string[] $types If set, types of calendar to get, all by default.
     * 
     * @return false|array
     */
    private function getExternalCals(int $iduser, ?array $types)
    {
        $response = [];
        // for each type of calendar, check if user has some.
        foreach ($types ?? $this->calendarTypes as $type) {
            if ($type === 'caldav') {
                // $response['caldav']=[];
                $res = $this->db->request([
                    'query' => 'SELECT idcaldav,role FROM user_has_caldav WHERE iduser = ?;',
                    'type' => 'i',
                    'content' => [$iduser],
                    'array' => false,
                ]);
                if (isset($res[0])) {
                    foreach ($res as $cal) {
                        $response['caldav'][] = [
                            'id' => $cal['idcaldav'],
                            'role' => $cal['role'],
                        ];
                    }
                }
            }
        }
        return empty($response) ? false : $response;
    }

    /**
     * Get events from specific caldav on selected period of time;
     */
    private function getEventsFromCaldav(int $id, array $period)
    {
        $res = $this->db->request([
            'query' => 'SELECT url,user,pass FROM caldav WHERE idcaldav = ?;',
            'type' => 'i',
            'content' => [$id],
            'array' => false,
        ]);
        if ($res) {
            // simplecaldav getevent()
        }
    }
}
