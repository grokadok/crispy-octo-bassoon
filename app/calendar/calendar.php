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
    /**
     * Adds alarm linked to provided component.
     * @param int $idcomponent
     * @param array $alarm
     */
    private function addAlarm(int $idcomponent, array $alarm)
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
            'query' => 'INSERT INTO cal_alarm (action' . $request['into'] . ') VALUES (?' . $request['values'] . ');',
            'type' => 'ii' . $request['type'],
            'content' => [$idcomponent, $alarm['action'], ...$request['content']],
        ]);
        $idalarm = $this->db->request([
            'query' => 'SELECT LAST_INSERT_ID();',
            'array' => true,
        ])[0][0];
        $this->db->request([
            'query' => 'INSERT INTO cal_comp_has_alarm (idcal_component, idcal_alarm) VALUES (?,?);',
            'type' => 'ii',
            'content' => [$idcomponent, $idalarm],
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
    /**
     * Adds recurrence date to component.
     * @param int $idcomponent
     * @param string $date
     */
    private function addRecurrenceDate(int $idcomponent, string $date)
    {
        $this->db->request([
            'query' => 'INSERT INTO cal_rdate (idcomponent, date) VALUES (?, ?);',
            'type' => 'is',
            'content' => [$idcomponent, $date],
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
            $request['value'][] = $event['transparency'] ? 1 : 0;
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
        if (isset($event['tag'])) {
            foreach ($event['tag'] as $tag) {
                $this->db->request([
                    'query' => 'INSERT INTO cal_comp_has_tag (idcal_component,idtag) VALUES (?,?);',
                    'type' => 'ii',
                    'content' => [$idcomponent, $tag],
                ]);
            }
        }

        // doc for calendar components
        if (1 === 0) {
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
    }
    private function componentChangeStart(int $idcomponent, string $start)
    {
        // set new start
        $this->db->request([
            'query' => 'UPDATE cal_component SET start = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'si',
            'content' => [$start, $idcomponent],
        ]);
    }
    private function componentChangeEnd(int $idcomponent, string $end)
    {
        // set new end
        $this->db->request([
            'query' => 'UPDATE cal_component SET end = ? WHERE ical_component = ? LIMIT 1;',
            'type' => 'si',
            'content' => [$end, $idcomponent],
        ]);
    }
    /**
     * Adds recurrence rule to component.
     * @param int $idcomponent
     * @param array $recurrence
     */
    private function componentSetRRUle(int $idcomponent, array $rule)
    {
        $request = [
            'into' => '',
            'values' => '',
            'type' => '',
            'content' => []
        ];
        // frequency
        if (isset($rule['frequency'])) {
            $request['into'] .= ',frequency';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $rule['frequency'];
        }
        // interval
        if (isset($rule['interval'])) {
            $request['into'] .= ',interval';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $rule['interval'];
        }
        // until
        if (isset($rule['until'])) {
            $request['into'] .= ',until';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $rule['until'];
        }
        // count
        if (isset($rule['count'])) {
            $request['into'] .= ',count';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $rule['count'];
        }
        // week_start
        if (isset($rule['week_start'])) {
            $request['into'] .= ',week_start';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $rule['week_start'];
        }
        // by_day
        if (isset($rule['by_day'])) {
            $request['into'] .= ',by_day';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $rule['by_day'];
        }
        // recurring: by_monthday ?
        if (isset($rule['by_month_day'])) {
            $request['into'] .= ',by_month_day';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $rule['by_month_day'];
        }
        // recurring: by_month ?
        if (isset($rule['by_month'])) {
            $request['into'] .= ',by_month';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $rule['by_month'];
        }
        // recurring: by_setpos ?
        if (isset($rule['by_setpos'])) {
            $request['into'] .= ',by_setpos';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $rule['by_setpos'];
        }

        $this->db->request([
            'query' => 'INSERT INTO cal_rrule (idcal_component, ' . $request['into'] . ') VALUES (?, ' . $request['values'] . ');',
            'type' => 'i' . $request['type'],
            'content' => [$idcomponent, ...$request['content']],
        ]);
    }
    private function componentChangeRRUle(int $idcomponent, array $rule)
    {
    }
    private function componentRemoveRRUle(int $idcomponent)
    {
        // remove rrule
        $this->db->request([
            'query' => 'DELETE cal_rrule WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]);
        // remove exceptions
        $this->db->request([
            'query' => 'DELETE cal_exception WHERE idcal_component = ?;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]);
        // increment sequence & set rrule = 0
        $sequence = $this->db->request([
            'query' => 'SELECT sequence FROM cal_component WHERE ical_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
            'array' => true,
        ])[0][0];
        $this->db->request([
            'query' => 'UPDATE cal_component SET rrule = 0, sequence = ? WHERE idcal_component = ?;',
            'type' => 'ii',
            'content' => [++$sequence, $idcomponent],
        ]);
    }
    private function componentAddRDate(int $idcomponent, string $date)
    {
        $this->db->request([
            'query' => 'INSERT INTO cal_rdate (idcal_component, date) VALUES (?,?);',
            'type' => 'is',
            'content' => [$idcomponent, $date],
        ]);
    }
    private function componentRemoveRDate(int $idcomponent, string $date)
    {
        $this->db->request([
            'query' => 'DELETE cal_rdate WHERE idcal_component = ? AND date = ? LIMIT 1;',
            'type' => 'is',
            'content' => [$idcomponent, $date],
        ]);
    }
    private function componentAddException(int $idcomponent, array $exception)
    {
        $request = [
            'into' => '',
            'values' => '',
            'type' => '',
            'content' => [],
        ];
        if (isset($exception['allday'])) {
            $request['into'] = ',all_day';
            $request['values'] = ',?';
            $request['type'] = 'i';
            $request['content'][] = $exception['allday'] ? 1 : 0;
        }
        $this->db->request([
            'query' => 'INSERT INTO cal_exception (idcal_component,date' . $request['into'] . ') VALUES (?,?' . $request['values'] . ');',
            'type' => 'is' . $request['type'],
            'content' => [$idcomponent, $exception['date'], ...$request['content']],
            'array' => true,
        ]);
    }
    private function componentRemoveException(int $idcomponent, string $exception)
    {
        $this->db->request([
            'query' => 'DELETE cal_exception WHERE idcal_component = ? AND date = ?;',
            'type' => 'is',
            'content' => [$idcomponent, $exception],
        ]);
    }
    /**
     * Adds attendee to cal component.
     * @param int $idcomponent
     * @param array $attendee
     */
    private function componentAddAttendee(int $idcomponent, array $attendee)
    {
        $request = [
            'into' => '',
            'values' => '',
            'type' => '',
            'content' => [],
        ];

        // attendees: delegated from ?
        if (isset($attendee['delegfrom'])) {
            $request['into'] .= ',delegated_from';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['delegfrom'];
        }
        // attendees: delegated to ?
        if (isset($attendee['delegto'])) {
            $request['into'] .= ',delegated_to';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['delegto'];
        }
        // attendees: sent by ?
        if (isset($attendee['sentby'])) {
            $request['into'] .= ',sent_by';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['sentby'];
        }
        // attendees: language ?
        if (isset($attendee['language'])) {
            $request['into'] .= ',language';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['language'];
        }
        // attendees: user type ?
        if (isset($attendee['cutype'])) {
            $request['into'] .= ',cutype';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['cutype'];
        }
        // attendees: role ?
        if (isset($attendee['role'])) {
            $request['into'] .= ',role';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['role'];
        }
        // attendees: status ?
        if (isset($attendee['status'])) {
            $request['into'] .= ',status';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['status'];
        }
        // rsvp
        if (isset($attendee['rsvp'])) {
            $request['into'] .= ',rsvp';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['rsvp'];
        }

        $this->db->request([
            'query' => 'INSERT INTO cal_attendee (idcal_component' . $request['into'] . ') VALUES (?' . $request['values'] . ');',
            'type' => 'i' . $request['type'],
            'content' => [$idcomponent, ...$request['content']],
        ]);
    }
    private function componentChangeAttendee(int $idcomponent, array $attendee)
    {
        $request = [
            'set' => [],
            'type' => '',
            'content' => [],
        ];
        // delegated from
        if (isset($attendee['delegfrom'])) {
            $request['set'][] = 'delegated_from = ?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['delegfrom'];
        }
        // delegated to
        if (isset($attendee['delegto'])) {
            $request['set'][] = 'delegated_to = ?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['delegto'];
        }
        // sent by
        if (isset($attendee['sentby'])) {
            $request['set'][] = 'sent_by = ?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['sentby'];
        }
        // language
        if (isset($attendee['language'])) {
            $request['set'][] = 'language = ?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['language'];
        }
        // user type
        if (isset($attendee['cutype'])) {
            $request['set'][] = 'cutype = ?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['cutype'];
        }
        // role
        if (isset($attendee['role'])) {
            $request['set'][] = 'role = ?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['role'];
        }
        // status
        if (isset($attendee['status'])) {
            $request['set'][] = 'status = ?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['status'];
        }
        // rsvp
        if (isset($attendee['rsvp'])) {
            $request['set'][] = 'rsvp = ?';
            $request['type'] .= 'i';
            $request['content'][] = $attendee['rsvp'];
        }

        $this->db->request([
            'query' => 'UPDATE cal_attendee SET ' . implode(',', $request['set']) . ' WHERE idcal_component = ? AND attendee = ? LIMIT 1;',
            'type' => $request['type'],
            'content' => $request['content'],
        ]);
    }
    private function componentRemoveAttendee(int $idcomponent, int $attendee)
    {
        $this->db->request([
            'query' => 'DELETE cal_attendee WHERE idcal_component = ? AND attendee = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$idcomponent, $attendee],
        ]);
    }
    private function componentAddTag(int $idcomponent, int $tag)
    {
        $this->db->request([
            'query' => 'INSERT INTO cal_comp_has_tag (idcal_component,idtag) VALUES (?,?);',
            'type' => 'ii',
            'content' => [$idcomponent, $tag],
        ]);
    }
    private function componentRemoveTag(int $idcomponent, int $tag)
    {
        $this->db->request([
            'query' => 'DELETE cal_comp_has_tag WHERE idcal_component = ? AND idtag = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$idcomponent, $tag],
        ]);
    }
    private function componentChangeStatus(int $idcomponent, int $status)
    {
        $this->db->request([
            'query' => 'UPDATE cal_component SET status = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$status, $idcomponent],
        ]);
    }
    private function componentAddDescription(int $idcomponent, string $description)
    {
        $iddescription = $this->addDescription($description);
        $this->db->request([
            'query' => 'UPDATE cal_component SET description = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$iddescription, $idcomponent],
        ]);
    }
    private function componentChangeDescription(int $idcomponent, string $description)
    {
        $iddescription = $this->db->request([
            'query' => 'SELECT description FROM cal_component WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
            'array' => true,
        ])[0][0];
        $this->db->request([
            'query' => 'UPDATE cal_description SET content = ? WHERE idcal_description = ? LIMIT 1;',
            'type' => 'si',
            'content' => [$description, $iddescription],
        ]);
    }
    private function componentRemoveDescription(int $idcomponent, string $description)
    {
        $iddescription = $this->db->request([
            'query' => 'SELECT description FROM cal_component WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
            'array' => true,
        ])[0][0];
        $this->db->request([
            'query' => 'UPDATE cal_component SET description = NULL WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]);
        $this->db->request([
            'query' => 'DELETE cal_description WHERE idcal_description = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$iddescription],
        ]);
    }
    private function componentChangeSummary(int $idcomponent, string $summary)
    {
        $this->db->request([
            'query' => 'UPDATE cal_component SET summary = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'si',
            'content' => [$summary, $idcomponent],
        ]);
    }
    private function componentChangeClass(int $idcomponent, int $class)
    {
        $this->db->request([
            'query' => 'UPDATE cal_component SET class = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$class, $idcomponent],
        ]);
    }
    private function componentChangePriority(int $idcomponent, int $priority)
    {
        $this->db->request([
            'query' => 'UPDATE cal_component SET priority = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$priority, $idcomponent],
        ]);
    }
    private function componentChangeTransparency(int $idcomponent, bool $transparency)
    {
        $this->db->request([
            'query' => 'UPDATE cal_component SET transparency = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$transparency, $idcomponent],
        ]);
    }
    private function componentAddLocation(int $idcomponent, string $location)
    {
        $idlocation = $this->db->request([
            'query' => 'SELECT idcal_location FROM cal_location WHERE name = ? LIMIT 1;',
            'type' => 's',
            'content' => [$location],
            'array' => true,
        ])[0][0];
        if (empty($idlocation)) {
            $this->db->request([
                'query' => 'INSERT INTO cal_location (name) VALUES (?);',
                'type' => 's',
                'content' => [$location],
            ]);
            $idlocation = $this->db->request([
                'query' => 'SELECT idcal_location FROM cal_location WHERE name = ?;',
                'type' => 's',
                'content' => [$location],
                'array' => true,
            ])[0][0];
        }
        $this->db->request([
            'query' => 'UPDATE cal_component SET location = ? WHERE idcal_location = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$idlocation, $idcomponent],
        ]);
    }
    private function componentChangeLocation(int $idcomponent, string $location)
    {
        $idlocation = $this->db->request([
            'query' => 'SELECT location FROM cal_component WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
            'array' => true,
        ])[0][0];
        $this->db->request([
            'query' => 'UPDATE cal_location SET name = ? WHERE idcal_location = ? LIMIT 1;',
            'type' => 'si',
            'content' => [$location, $idlocation],
        ]);
    }
    private function componentRemoveLocation(int $idcomponent)
    {
        $idlocation = $this->db->request([
            'query' => 'SELECT location FROM cal_component WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
            'array' => true,
        ])[0][0];
        $this->db->request([
            'query' => 'UPDATE cal_component SET location = NULL WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]);
        $this->db->request([
            'query' => 'DELETE cal_location WHERE idcal_location = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idlocation],
        ]);
    }
    private function componentAddAlarm(int $idcomponent, array $alarm)
    {
        $request = [
            'into' => '',
            'values' => '',
            'type' => '',
            'content' => [],
        ];
        // trigger absolute
        if (isset($alarm['trigabsolute'])) {
            $request['into'] .= ',trigger_absolute';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $alarm['triggerabs'];
        } else if (isset($alarm['trigrelative'])) {
            // trigger relative
            $request['into'] .= ',trigger_relative';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $alarm['trigrelative'];
            if (isset($alarm['trigrelated'])) {
                // trigger related
                $request['into'] .= ',trigger_related';
                $request['values'] .= ',?';
                $request['type'] .= 'i';
                $request['content'][] = $alarm['trigrelated'];
            }
        }
        // summary - action=EMAIL: subject.
        if (isset($alarm['summary'])) {
            $request['into'] .= ',summary';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $alarm['summary'];
        }
        // description - action=EMAIL: body, action=DISPLAY: text content.
        if (isset($alarm['description'])) {
            $iddescription = $this->addDescription($alarm['description']);
            $request['into'] .= ',description';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $iddescription;
        }
        // repeat
        if (isset($alarm['repeat'])) {
            $request['into'] .= ',repeat';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['content'][] = $alarm['repeat'];
        }
        // duration - interval between repeats.
        if (isset($alarm['duration'])) {
            $request['into'] .= ',duration';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $alarm['duration'];
        }

        $this->db->request([
            'query' => 'INSERT INTO cal_alarm (action' . $request['into'] . ') VALUES (?' . $request['values'] . ');',
            'type' => 'i' . $request['type'],
            'content' => [$alarm['action'], ...$request['content']],
        ]);
        $idalarm = $this->db->request([
            'query' => 'SELECT idcal_alarm FROM cal_alarm WHERE ;',
            'type' => '',
            'content' => [],
            'array' => true,
        ]);
    }
    private function componentChangeAlarm(int $idcomponent, array $alarm)
    {
    }
    private function componentRemoveAlarm(int $idcomponent, int $alarm)
    {
    }
    private function changeComponent(int $idcomponent, array $changes)
    {

        // set component sequence

        // if recurrence, set recur_id and range
        // OR if range = this, add exception to rule/remove rdate and create a new component
        // OR if range = thisandfuture, close event with until or count, and create a new one with new values.

        // update etag from file

        // if change is about date or location, attendees needs to set their participation again
        // send attendees notification of change in event

        // send updated object to connected users
    }
    private function removeComponent(int $idcomponent)
    {
    }
    private function removeFile(string $uid)
    {
    }

    /**
     * Gets event(s) for given uid.
     * @param int $uid Duh.
     */
    private function getEventsFromUid(int $uid)
    {
        $events = $this->db->request([
            'query' => 'SELECT idcal_component, created, modified, summary, description, organizer, timezone, start, end, duration, all_day, class, location, priority, status, transparency, sequence, rrule, rdate, recur_id, thisandfuture
            FROM cal_component
            WHERE type = 0 AND uid = ?;',
            'type' => 's',
            'content' => [$uid],
            'array' => false,
        ]);
        $response = [
            'attendees' => [],
            'descriptions' => [],
            'events' => [],
            'languages' => [],
            'tags' => [],
            'timezones' => [],
            'users' => [],
        ];

        foreach ($events as $event) {
            // get description
            addIfNotNullNorExists($event['description'], $response['descriptions']);

            // get organizer
            addIfNotNullNorExists($event['organizer'], $response['users']);

            // get timezone
            addIfNotNullNorExists($event['timezone'], $response['timezones']);

            // get location
            $event['location'] = isset($event['location']) ? $this->db->request([
                'query' => 'SELECT name FROM cal_location WHERE idcal_location = ? LIMIT 1;',
                'type' => 'i',
                'content' => [$event['location']],
                'array' => true,
            ])[0][0] : '';

            // get recurrence
            if ($event['rrule']) {
                $event['recurrence']['rule'] = $this->db->request([
                    'query' => 'SELECT frequency, set_interval, until, count, week_start, by_day, by_monthday, by_month, by_setpos FROM cal_rrule WHERE idcal_component = ? LIMIT 1;',
                    'type' => 'i',
                    'content' => [$event['idcal_component']],
                    'array' => false,
                ])[0];
            }
            if ($event['rdate']) {
                $res = $this->db->request([
                    'query' => 'SELECT date FROM cal_rdate WHERE idcal_component = ?;',
                    'type' => 'i',
                    'content' => [$event['idcal_component']],
                    'array' => true,
                ]);
                foreach ($res as $date) $event['recurrence']['date'][] = $date[0];
            }
            // get exceptions
            if (isset($event['recurrence'])) {
                $event['recurrence']['exceptions'] = $this->db->request([
                    'query' => 'SELECT date,all_day FROM cal_comp_has_exc LEFT JOIN cal_exception USING (idcal_exception) WHERE idcal_component = ?;',
                    'type' => 'i',
                    'content' => [$event['idcal_component']],
                    'array' => false,
                ]);
            }

            // get attendees
            $event['attendees'] = $this->db->request([
                'query' => 'SELECT attendee, delegated_from, delegated_to, language, sent_by, cutype, role, status, rsvp FROM cal_attendee WHERE idcal_component = ?;',
                'type' => 'i',
                'content' => [$event['ical_component']],
                'array' => false,
            ]);
            foreach ($event['attendees'] as $attendee) {
                foreach ([$attendee['attendee'], $attendee['delegated_from'], $attendee['delegated_to'], $attendee['sent_by']] as $value)
                    addIfNotNullNorExists($response['users'], $value);
                addIfNotNullNorExists($attendee['idlanguage'], $response['languages']);
            }

            // get alarms
            $event['alarms'] = $this->db->request([
                'query' => 'SELECT idcal_alarm, action, trigger_absolute, trigger_relative, trigger_related, summary, description, repeat_times, duration FROM cal_alarm WHERE idcal_component = ?;',
                'type' => 'i',
                'content' => [$event['idcal_component']],
                'array' => false,
            ]);
            foreach ($event['alarms'] as $alarm) addIfNotNullNorExists($alarm['description'], $response['descriptions']);

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
