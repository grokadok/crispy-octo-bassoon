<?php

namespace bopdev;

trait BopCal
{
    // use \SimpleCalDavClient;

    private $calendarTypes = ['caldav'];

    // !!!!!! BEFORE EACH CHANGE, CHECK MODIFIED !!!!!
    // !!!!!! AFTER EACH CHANGE, SEND NOTIFICATIONS/MODIFICATIONS TO OTHER USERS !!!!!

    /**
     * Adds alarm linked to provided component.
     * @param int $idcomponent
     * @param array $alarm
     */
    private function calAddAlarm(int $idcomponent, array $alarm)
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
        return $idalarm;
    }
    /**
     * Adds cal_description if not exists, returns its id.
     * @param string $content Description text.
     */
    private function calAddDescription(string $content)
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
    private function calAddEvent(int $iduser, int $cal_folder, array $event)
    {
        if ($this->calCheckUserWriteAccess($iduser, $cal_folder)) return print("Write failure: user $iduser had no write access to cal_folder $cal_folder." . PHP_EOL);

        $uid = $event['uid'] ?? $this->calNewCalFile($iduser, $cal_folder);

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
        } else if (isset($event['duration'])) {
            $request['into'] .= ',duration';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['value'][] = $event['duration'];
        }
        // all_day
        if (isset($event['all_day'])) {
            $request['into'] .= ',all_day';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['value'][] = $event['all_day'];
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
            $request['into'] .= ',location';
            $request['values'] .= ',?';
            $request['type'] .= 'i';
            $request['value'][]  = $this->addLocation($event['location']);
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
            'content' => [$uid, $event['created'], $event['summary'], $iduser, $event['start'], $event['end'], $event['duration'], $event['all_day'], $event['transparency']],
            'array' => true,
        ]);
        $idcomponent = $this->db->request([
            'query' => 'SELECT MAX(idcal_component) FROM cal_component WHERE uid = (SELECT UUID_TO_BIN(?, 1)) AND created = ? LIMIT 1;',
            'type' => 'ss',
            'content' => [$uid, $event['created']],
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
            $this->componentSetRRUle($idcomponent, $event['rrule']);
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
        // return light info about new event.

        return ['event' => $event, 'users' => $this->calGetConnectUsers($cal_folder)];

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
    private function calAddLocation(string $location)
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
        return $idlocation;
    }
    private function calCheckUserReadAccess(int $iduser, int $cal_folder)
    {
        return !empty($this->db->request([
            'query' => 'SELECT NULL FROM user_has_calendar WHERE iduser = ? AND idcal_folder = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$iduser, $cal_folder],
            'array' => true,
        ]));
    }
    private function calCheckUserWriteAccess(int $iduser, int $cal_folder)
    {
        return !empty($this->db->request([
            'query' => 'SELECT read_write FROM user_has_calendar WHERE iduser = ? AND idcal_folder = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$iduser, $cal_folder],
            'array' => true,
        ])[0][0]);
    }
    private function calGetConnectUsers(int $cal_folder, string $start = null, string $end = null)
    {
        $users = [];
        foreach ($this->db->request([
            'query' => 'SELECT idsession,iduser,fd FROM session;',
        ]) as $user) $users[] = [...$user, 'inrange' => isset($start) && isset($end) ? !empty($this->db->request([
            'query' => 'SELECT NULL FROM session_has_calendar WHERE idsession = ? AND idcal_folder = ? AND start < ? AND end > ?;',
            'type' => 'iiss',
            'content' => [$user['idsession'], $cal_folder, $end, $start],
        ])) : null];
        return $users;
    }
    private function calGetFilesFromFolder(int $cal_folder)
    {
        return $this->db->request([
            'query' => 'SELECT uid,modified FROM cal_file WHERE idcal_folder = ?;',
            'type' => 'i',
            'content' => [$cal_folder],
            'array' => false,
        ]);
    }
    /**
     * Gets event(s) for given uid.
     * @param int $uid Duh.
     */
    private function calGetDataFromEvent(int $idcomponent)
    {
        $event = $this->db->request([
            'query' => 'SELECT created, modified, summary, description, organizer, timezone, start, end, all_day, class, location, priority, status, transparency, sequence, rrule, rdate, recur_id, thisandfuture
            FROM cal_component
            WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
            'array' => false,
        ])[0];
        $response = [
            'descriptions' => [],
            'event' => [],
            'languages' => [],
            'tags' => [],
            'timezones' => [],
            'users' => [],
        ];

        // get description
        addIfNotNullNorExists($event['description'], $response['descriptions']);

        // get organizer
        addIfNotNullNorExists($event['organizer'], $response['users']);

        // get timezone
        addIfNotNullNorExists($event['timezone'], $response['timezones']);

        // get location
        addIfNotNullNorExists($event['location'], $response['locations']);

        // get recurrence
        if ($event['rrule'])
            $event['recurrence']['rule'] = $this->calGetEventsRRule($idcomponent);
        if ($event['rdate'])
            $event['recurrence']['date'] = $this->calGetEventsRDate($idcomponent);
        // get exceptions
        if (isset($event['recurrence']))
            $event['recurrence']['exceptions'] = $this->calGetEventsException($idcomponent);

        // get attendees
        $event['attendees'] = $this->calGetEventsAttendees($idcomponent);
        foreach ($event['attendees'] as $attendee) {
            foreach ([$attendee['attendee'], $attendee['delegated_from'], $attendee['delegated_to'], $attendee['sent_by']] as $value)
                addIfNotNullNorExists($response['users'], $value);
            addIfNotNullNorExists($attendee['idlanguage'], $response['languages']);
        }

        // get alarms
        $event['alarms'] = $this->calGetEventsAlarms($idcomponent);
        foreach ($event['alarms'] as $alarm) addIfNotNullNorExists($alarm['description'], $response['descriptions']);

        // get tags
        $event['tags'] = $this->calGetEventsTagId($idcomponent);
        foreach ($event['tags'] as $tag) addIfNotNullNorExists($tag[0], $response['tags']);

        $response['event'][$event['idcal_component']] = $event;

        // get content
        // descriptions
        if (!empty($response['descriptions']))
            $response['descriptions'] = $this->calGetDescriptions($response['descriptions']);
        // users
        if (!empty($response['users'])) $response['users'] = $this->calGetUsers($response['users']);
        // timezones
        if (!empty($response['timezones'])) $response['timezones'] = $this->calGetTimeZones($response['timezones']);
        // tags
        if (!empty($response['tags'])) $response['tags'] = $this->calGetTags($response['tags']);
        // locations
        if (!empty($response['locations'])) $response['locations'] = $this->calGetLocations($response['locations']);

        return $response;
    }
    private function calGetDescriptions(array $iddecriptions)
    {
        $result = [];
        $in = implode(',', $iddecriptions);
        $res = $this->db->request([
            'query' => "SELECT idcal_description,content FROM cal_description WHERE idcal_description IN $in;",
            'array' => true,
        ]);
        foreach ($res as $description) $result[$description[0]] = $description[1];
        return $result;
    }
    private function calGetEventsAlarms(int $idcomponent)
    {
        $alarmIds = $this->db->request([
            'query' => 'SELECT idcal_alarm FROM cal_comp_has_alarm WHERE idcal_component = ?;',
            'type' => 'i',
            'content' => [$idcomponent],
            'array' => true,
        ]);
        $alarms = [];
        if (!empty($alarmIds)) foreach ($alarmIds as $alarmId) {
            $alarms[] = $this->db->request([
                'query' => 'SELECT action,trigger_absolute,trigger_relative,trigger_related,summary,description,repeat_times,duration FROM cal_alarm WHERE idcal_alarm = ? LIMIT 1;',
                'type' => 'i',
                'content' => [$alarmId[0]],
            ]);
        }
        return $alarms;
    }
    private function calGetEventsAttendees(int $idcomponent)
    {
        return
            $this->db->request([
                'query' => 'SELECT attendee, delegated_from, delegated_to, language, sent_by, cutype, role, status, rsvp FROM cal_attendee WHERE idcal_component = ?;',
                'type' => 'i',
                'content' => [$idcomponent],
                'array' => false,
            ]);
    }
    private function calGetEventsException(int $idcomponent)
    {
        $exceptions = [];
        foreach ($this->db->request([
            'query' => 'SELECT date FROM cal_exception WHERE idcal_component = ?;',
            'type' => 'i',
            'content' => [$idcomponent],
            'array' => true,
        ]) as $exception) $exceptions[] = $exception[0];
        return $exceptions;
    }
    private function calGetEventsInRange(int $cal_folder, string $start, string $end)
    {
        // get all uids from folder
        $uids = [];
        $res = $this->calGetFilesFromFolder($cal_folder);
        foreach ($res as $val) $uids[] = $val['uid'];
        $uids = implode(',', $uids);
        $events = $this->db->request([
            'query' => "SELECT idcal_component,type,summary,start,end,all_day,transparency,sequence,rrule,rdate,recur_id,thisandfuture FROM cal_component WHERE uid IN $uids AND start < ? AND end > ?;",
            'type' => 'ss',
            'content' => [$end, $start],
        ]);
        // if rrule, get rrule
        foreach ($events as $key => $value) {
            if ($value['rrule']) $events[$key]['rrule'] = $this->calGetEventsRRule($value['idcal_component']);
            // if rdate, get rdate
            if ($value['rdate']) $events[$key]['rdates'] = $this->calGetEventsRDate($value['idcal_component']);
            // if exceptions, get'em
            if ($value['rrule'] || $value['rdate'])
                $events[$key]['exceptions'] = $this->calGetEventsException($value['idcal_component']);
            // alarms
            // !!! GET ALARMS WHERE ACTION NOT EMAIL NOR SOUND FOR APP, ONLY DISPLAY
            $events[$key]['alarms'] = $this->catGetEventsAlarms($value['idcal_component']);
        }
        return $events;
    }
    private function calGetEventsRDate(int $idcomponent)
    {
        $rdates = [];
        foreach ($this->db->request([
            'query' => 'SELECT date FROM cal_rdate WHERE idcal_component = ?;',
            'type' => 'i',
            'content' => [$idcomponent],
            'array' => true,
        ]) as $date) $rdates[] = $date[0];
        return $rdates;
    }
    private function calGetEventsRRule(int $idcomponent)
    {
        return $this->db->request([
            'query' =>
            'SELECT frequency,set_interval,until,count,week_start,by_day,by_monthday,by_month,by_setpos FROM cal_rrule WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
        ])[0];
    }
    private function calGetEventsTagId(int $idcomponent)
    {
        $tagIds = [];
        $tags = $this->db->request([
            'query' => 'SELECT idtag FROM cal_comp_has_tag WHERE idcal_component = ?;',
            'type' => 'i',
            'content' => [$idcomponent],
            'array' => true,
        ]);
        foreach ($tags as $tag) $tagIds[] = $tag[0];
        return $tagIds;
    }
    private function calGetLocations(array $locationids)
    {
        $response = [];
        $in = implode(',', $locationids);
        $res = $this->db->request([
            'query' => "SELECT idcal_location,name FROM cal_locations WHERE idcal_location IN $in;",
            'array' => true,
        ]);
        foreach ($res as $location) $response[$location[0]] = $location[1];
        return $response;
    }
    private function calGetStaticValues()
    {
        $response = [
            'status' => [],
            'cutype' => [],
            'role' => [],
            'frequency' => [],
            'action' => [],
            'class' => [],
        ];
        // get statuses
        foreach ($this->db->request([
            'query' => 'SELECT idcal_status,name FROM cal_status;',
        ]) as $status) $response['status'][$status['idcal_status']] = $status['name'];
        // get cutypes
        foreach ($this->db->request([
            'query' => 'SELECT idcal_cutype,name FROM cal_cutype;',
        ]) as $cutype) $response['cutype'][$cutype['idcal_cutype']] = $cutype['name'];
        // get roles
        foreach ($this->db->request([
            'query' => 'SELECT idcal_role, name FROM cal_role;',
        ]) as $role) $response['role'][$role['idcal_role']] = $role['name'];
        // get frequencies
        foreach ($this->db->request([
            'query' => 'SELECT idcal_frequency,name FROM cal_frequency;',
        ]) as $frequency) $response['frequency'][$frequency['idcal_frequency']] = $frequency['name'];
        // get actions
        foreach ($this->db->request([
            'query' => 'SELECT idcal_action,name FROM cal_action;',
        ]) as $action) $response['action'][$action['idcal_action']] = $action['name'];
        // get classes
        foreach ($this->db->request([
            'query' => 'SELECT idcal_class,name FROM cal_class;',
        ]) as $class) $response['class'][$class['idcal_class']] = $class['name'];
        return $response;
    }
    private function calGetTags(array $tagids)
    {
        $response = [];
        $in = implode(',', $tagids);
        $res = $this->db->request([
            'query' => "SELECT idtag,name FROM tag WHERE idtag IN $in;",
            'array' => true,
        ]);
        foreach ($res as $tag) $response[$tag[0]] = $tag[1];
        return $response;
    }
    private function calGetTimeZones(array $timezones)
    {
        $response = [];
        $in = implode(',', $timezones);
        $res = $this->db->request([
            'query' => "SELECT idtimezone,name,offset FROM timezone WHERE idtimezone IN $in;",
            'array' => true,
        ]);
        foreach ($res as $tz) $response[$tz[0]] = ['name' => $tz[1], 'offset' => $tz[2]];
        return $response;
    }
    private function calGetUserCalendars(int $iduser)
    {
        $folders = [];
        foreach ($this->db->request([
            'query' => 'SELECT idcal_folder,read_only FROM user_has_calendar WHERE iduser = ?;',
            'type' => 'i',
            'content' => [$iduser],
            'array' => true,
        ]) as $folder)
            $folders[$folder[0]] = [
                'name' => $this->db->request([
                    'query' => 'SELECT name FROM cal_folder WHERE idcal_folder = ? LIMIT 1;',
                    'type' => 'i',
                    'content' => [$folder[0]],
                    'array' => true,
                ])[0][0],
                'read_only' => $folder[1],
            ];
        return $folders;

        // foreach ($cal_folders as $key => $value) $cal_folders[$key]['description'] = $this->db->request([
        //     'query' => 'SELECT content FROM cal_description WHERE idcal_description = ? LIMIT 1;',
        //     'type' => 'i',
        //     'content' => [$value['description']],
        //     'array' => true,
        // ])[0][0];
        // return $cal_folders;
    }
    private function calGetUsers(array $userids)
    {
        $response = ['users' => [], 'roles' => []];
        $in = implode(',', $userids);
        foreach ($this->db->request([
            'query' => "SELECT iduser,first_name,last_name FROM user WHERE iduser IN $in;",
            'array' => true,
        ]) as $user) $response['users'][$user[0]] = ['first_name' => $user[1], 'last_name' => $user[2]];
        foreach ($this->db->request([
            'query' => "SELECT iduser,idrole FROM user_has_role WHERE iduser IN $in;",
            'array' => true,
        ]) as $role) {
            $response['users'][$role[0]]['role'] = $role[1];
            addIfNotNullNorExists($role[1], $response['roles']);
        }
        $in = implode(',', $response['roles']);
        $response['roles'] = [];
        foreach ($this->db->request([
            'query' => "SELECT idrole,name,short FROM role WHERE idrole IN $in;",
            'array' => true,
        ]) as $role) $response['roles'][$role[0]] = ['name' => $role[1], 'short' => $role[2]];
        return $response;
    }
    /**
     * Creates a new calendar file.
     * @param array $folder
     */
    private function calNewCalFile(int $iduser, int $cal_folder)
    {
        if (!$this->calCheckUserWriteAccess($iduser, $cal_folder))
            return print("Write failure: user $iduser has no write access to cal_folder $cal_folder." . PHP_EOL);
        $uuid = $this->db->request([
            'query' => 'SELECT uuid();',
        ])[0][0];
        $this->db->request([
            'query' => 'INSERT INTO cal_file (uid, idcal_folder) VALUES ((SELECT UUID_TO_BIN(?,1), ?);',
            'type' => 'si',
            'content' => [$uuid, $cal_folder],
        ]);
        return $uuid;
    }
    /**
     * Creates a new cal folder.
     * @param int $iduser User id to link the folder to.
     * @param array $folder Associative array containing name and optionnal description.
     * @param string $folder['name'] Calendar's name.
     * @param string $folder['description] Optionnal folder description.
     */
    private function calNewCalFolder(int $iduser, array $folder)
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
    private function calComponentAddAlarm(int $idcomponent, array $alarm)
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
            'query' => 'SELECT MAX(idcal_alarm) FROM cal_alarm WHERE action = ?;',
            'type' => 'i',
            'content' => [$alarm['action']],
            'array' => true,
        ])[0][0];
        $this->db->request([
            'query' => 'INSERT INTO cal_comp_has_alarm (idcal_component,ical_alarm) VALUES (?,?);',
            'type' => 'ii',
            'content' => [$idcomponent, $idalarm],
        ]);
    }
    /**
     * Adds attendee to cal component.
     * @param int $idcomponent
     * @param array $attendee
     */
    private function calComponentAddAttendee(int $idcomponent, array $attendee)
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
    private function calComponentAddDescription(int $idcomponent, string $description)
    {
        // $this->db->request([
        //     'query' => 'UPDATE cal_component SET description = ? WHERE idcal_component = ? LIMIT 1;',
        //     'type' => 'ii',
        //     'content' => [$this->addDescription($description), $idcomponent],
        // ]);
    }
    private function calComponentAddException(int $idcomponent, array $exception)
    {
        $request = [
            'into' => '',
            'values' => '',
            'type' => '',
            'content' => [],
        ];
        if (isset($exception['all_day'])) {
            $request['into'] = ',all_day';
            $request['values'] = ',?';
            $request['type'] = 'i';
            $request['content'][] = $exception['all_day'] ? 1 : 0;
        }
        $this->db->request([
            'query' => 'INSERT INTO cal_exception (idcal_component,date' . $request['into'] . ') VALUES (?,?' . $request['values'] . ');',
            'type' => 'is' . $request['type'],
            'content' => [$idcomponent, $exception['date'], ...$request['content']],
            'array' => true,
        ]);
    }
    private function calComponentAddLocation(int $idcomponent, string $location)
    {
        $this->db->request([
            'query' => 'UPDATE cal_component SET location = ? WHERE idcal_location = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$this->addLocation($location), $idcomponent],
        ]);
    }
    private function calComponentAddRDate(int $idcomponent, string $date)
    {
        $this->db->request([
            'query' => 'INSERT INTO cal_rdate (idcal_component, date) VALUES (?,?);',
            'type' => 'is',
            'content' => [$idcomponent, $date],
        ]);
        $this->db->request([
            'query' => 'UPDATE cal_component SET rdate = 1 WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]);
    }
    private function calComponentAddTag(int $idcomponent, int $tag)
    {
        $this->db->request([
            'query' => 'INSERT INTO cal_comp_has_tag (idcal_component,idtag) VALUES (?,?);',
            'type' => 'ii',
            'content' => [$idcomponent, $tag],
        ]);
    }
    private function calComponentChangeAlarm(int $idalarm, array $alarm)
    {
        $oldalarm = $this->db->request([
            'query' => 'SELECT action,trigger_absolute,trigger_relative,trigger_related,summary,description,repeat_times,duration FROM cal_alarm WHERE idcal_alarm = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idalarm],
            'array' => false,
        ])[0];
        $request = [
            'set' => [],
            'type' => '',
            'content' => [],
        ];
        // alarms: action
        if (isset($alarm['action']) && $alarm['action'] !== $oldalarm['action']) {
            $request['set'][] = 'action = ?';
            $request['type'] .= 'i';
            $request['content'][] = $alarm['action'];
        }
        // alarms: trigger absolute ?
        if (isset($alarm['trigabsolute']) && $alarm['trigger_absolute'] !== $oldalarm['trigger_absolute']) {
            $request['set'][] = 'trigger_absolute = ?,trigger_relative = NULL,trigger_related = 0';
            $request['type'] .= 's';
            $request['content'][] = $alarm['trigabsolute'];
        } else if (isset($alarm['trigrelative']) && $alarm['trigger_relative'] !== $oldalarm['trigger_relative']) {
            // alarms: trigger relative ?
            $request['set'][] = 'trigger_absolute = NULL,trigger_relative = ?';
            $request['type'] .= 's';
            $request['content'][] = $alarm['trigrelative'];
            if (isset($alarm['trigrelated'])) {
                // alarms: trigger related ?
                $request['set'][] = 'trigger_related = ?';
                $request['type'] .= 'i';
                $request['content'][] = $alarm['trigrelated'] ?? 0;
            }
        }
        // alarms: summary ? - action=EMAIL: subject.
        if (isset($alarm['summary']) && $alarm['summary'] !== $oldalarm['summary']) {
            $request['set'][] = 'summary = ?';
            $request['type'] .= 's';
            $request['content'][] = $alarm['summary'];
        }
        // alarms: description ? - action=EMAIL: body, action=DISPLAY: text content.
        if (isset($alarm['description'])) {
            $iddescription = $this->db->request([
                'query' => 'SELECT description FROM cal_alarm WHERE idcal_alarm = ?;',
                'type' => 'i',
                'content' => [$idalarm],
                'array' => true,
            ])[0][0];
            $newiddescription = $this->addDescription($alarm['description']);
            $this->db->request([
                'query' => 'UPDATE cal_alarm SET description = ? WHERE idcal_alarm = ? LIMIT 1;',
                'type' => 'ii',
                'content' => [$newiddescription, $idalarm],
            ]);
            if (!empty($iddescription)) $this->removeUnusedDescription($iddescription);
        }
        // alarms: repeat ?
        if (isset($alarm['repeat'])) {
            $request['set'][] = 'repeat_times = ?';
            $request['type'] .= 'i';
            $request['content'][] = $alarm['repeat'];
            // alarms: duration ? - interval between repeats.
            if (isset($alarm['duration'])) {
                $request['set'][] = 'duration = ?';
                $request['type'] .= 's';
                $request['content'][] = $alarm['duration'];
            }
        } else $request['set'][] = 'duration = NULL';

        if (count($request['set']) > 0)
            $this->db->request([
                'query' => 'UPDATE cal_alarm SET ' . implode(',', $request['set']) . ' WHERE idcal_alarm = ? LIMIT 1;',
                'type' => $request['type'] . 'i',
                'content' => [...$request['content'], $idalarm],
            ]);
    }
    private function calComponentChangeAttendee(int $idcomponent, array $attendee)
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
            'type' => $request['type'] . 'ii',
            'content' => [...$request['content'], $idcomponent, $attendee['attendee']],
        ]);
    }
    private function calComponentChangeClass(int $idcomponent, int $class)
    {
        $this->db->request([
            'query' => 'UPDATE cal_component SET class = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$class, $idcomponent],
        ]);
    }
    private function calComponentChangeDescription(int $idcomponent, string $description)
    {
        $iddescription = $this->db->request([
            'query' => 'SELECT description FROM cal_component WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
            'array' => true,
        ])[0][0];
        $this->db->request([
            'query' => 'UPDATE cal_component SET description = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'si',
            'content' => [$this->addDescription($description), $idcomponent],
        ]);
        if (!empty($iddescription)) $this->removeUnusedDescription($iddescription);
    }
    private function calComponentChangeEnd(int $idcomponent, string $end)
    {
        // set new end
        $this->db->request([
            'query' => 'UPDATE cal_component SET end = ? WHERE ical_component = ? LIMIT 1;',
            'type' => 'si',
            'content' => [$end, $idcomponent],
        ]);
    }
    private function calComponentChangeLocation(int $idcomponent, string $location)
    {
        $idlocation = $this->db->request([
            'query' => 'SELECT location FROM cal_component WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
            'array' => true,
        ])[0][0];
        $this->db->request([
            'query' => 'INSERT INTO cal_location (name) VALUES (?);',
            'type' => 's',
            'content' => [$location],
        ]);
        $newidlocation = $this->db->request([
            'query' => 'SELECT idcal_location FROM cal_location WHERE name = ? LIMIT 1;',
            'type' => 's',
            'content' => [$location],
            'array' => true,
        ])[0][0];
        $this->db->request([
            'query' => 'UPDATE cal_component SET location = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$newidlocation, $idcomponent],
        ]);
        if (!empty($idlocation)) $this->removeUnusedLocation($idlocation);
    }
    private function calComponentChangePriority(int $idcomponent, int $priority)
    {
        $this->db->request([
            'query' => 'UPDATE cal_component SET priority = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$priority, $idcomponent],
        ]);
    }
    private function calComponentChangeRRUle(int $idcomponent, array $rule)
    {
        $request = [
            'set' => [],
            'type' => '',
            'content' => [],
        ];
        // frequency
        if (isset($rule['frequency'])) {
            $request['set'][] = 'frequency = ?';
            $request['type'] .= 'i';
            $request['content'][] = $rule['frequency'];
        }
        // interval
        if (isset($rule['interval'])) {
            $request['set'][] = 'set_interval = ?';
            $request['type'] .= 'i';
            $request['content'][] = $rule['interval'];
        }
        // until
        if (isset($rule['until'])) {
            $request['set'][] = 'until = ?';
            $request['type'] .= 's';
            $request['content'][] = $rule['until'];
        }
        // count
        if (isset($rule['count'])) {
            $request['set'][] = 'count = ?';
            $request['type'] .= 'i';
            $request['content'][] = $rule['count'];
        }
        // week_start
        if (isset($rule['weekstart'])) {
            $request['set'][] = 'week_start = ?';
            $request['type'] .= 'i';
            $request['content'][] = $rule['weekstart'];
        }
        // by_day
        if (isset($rule['by_day'])) {
            $request['set'][] = 'by_day = ?';
            $request['type'] .= 's';
            $request['content'][] = $rule['by_day'];
        }
        // by_monthday
        if (isset($rule['by_monthday'])) {
            $request['set'][] = 'by_monthday = ?';
            $request['type'] .= 's';
            $request['content'][] = $rule['by_monthday'];
        }
        // by_month
        if (isset($rule['by_month'])) {
            $request['set'][] = 'by_month = ?';
            $request['type'] .= 's';
            $request['content'][] = $rule['by_month'];
        }
        // by_setpos
        if (isset($rule['by_setpos'])) {
            $request['set'][] = 'by_setpos = ?';
            $request['type'] .= 's';
            $request['content'][] = $rule['by_setpos'];
        }
        $this->db->request([
            'query' => 'UPDATE cal_rrule SET ' . implode(',', $request['set']) . ' WHERE idcal_component = ?;',
            'type' => $request['type'] . 'i',
            'content' => [...$request['content'], $idcomponent],
        ]);
    }
    private function calComponentChangeStart(int $idcomponent, string $start)
    {
        // set new start
        $this->db->request([
            'query' => 'UPDATE cal_component SET start = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'si',
            'content' => [$start, $idcomponent],
        ]);
    }
    private function calComponentChangeStatus(int $idcomponent, int $status)
    {
        $this->db->request([
            'query' => 'UPDATE cal_component SET status = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$status, $idcomponent],
        ]);
    }
    private function calComponentChangeSummary(int $idcomponent, string $summary)
    {
        $this->db->request([
            'query' => 'UPDATE cal_component SET summary = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'si',
            'content' => [$summary, $idcomponent],
        ]);
    }
    private function calComponentChangeTransparency(int $idcomponent, bool $transparency)
    {
        $this->db->request([
            'query' => 'UPDATE cal_component SET transparency = ? WHERE idcal_component = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$transparency, $idcomponent],
        ]);
    }
    private function calComponentRemoveAlarm(int $idcomponent, int $idalarm)
    {
        $iddescription = $this->db->request([
            'query' => 'SELECT description FROM cal_alarm WHERE idcal_alarm = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idalarm],
            'array' => true,
        ])[0][0];
        $this->db->request([
            'query' => 'DELETE cal_comp_has_alarm WHERE idcal_component = ? AND idcal_alarm = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$idcomponent, $idalarm],
        ]);
        $this->db->request([
            'query' => 'DELETE cal_alarm WHERE idcal_alarm = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idalarm],
        ]);
        if (!empty($iddescription)) $this->removeUnusedDescription($iddescription);
    }
    private function calComponentRemoveAttendee(int $idcomponent, int $attendee)
    {
        $this->db->request([
            'query' => 'DELETE cal_attendee WHERE idcal_component = ? AND attendee = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$idcomponent, $attendee],
        ]);
    }
    private function calComponentRemoveDescription(int $idcomponent)
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
        $this->removeUnusedDescription($iddescription);
    }
    private function calComponentRemoveException(int $idcomponent, string $exception)
    {
        $this->db->request([
            'query' => 'DELETE cal_exception WHERE idcal_component = ? AND date = ?;',
            'type' => 'is',
            'content' => [$idcomponent, $exception],
        ]);
    }
    private function calComponentRemoveLocation(int $idcomponent)
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
        $this->removeUnusedLocation($idlocation);
    }
    private function calComponentRemoveRDate(int $idcomponent, string $date)
    {
        $this->db->request([
            'query' => 'DELETE cal_rdate WHERE idcal_component = ? AND date = ? LIMIT 1;',
            'type' => 'is',
            'content' => [$idcomponent, $date],
        ]);
        if (empty($this->db->request([
            'query' => 'SELECT NULL FROM cal_rdate WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]))) $this->db->request([
            'query' => 'UPDATE cal_component SET rdate = 0 WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]);
    }
    private function calComponentRemoveRRUle(int $idcomponent)
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
    private function calComponentRemoveTag(int $idcomponent, int $tag)
    {
        $this->db->request([
            'query' => 'DELETE cal_comp_has_tag WHERE idcal_component = ? AND idtag = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$idcomponent, $tag],
        ]);
    }
    /**
     * Adds recurrence rule to component.
     * @param int $idcomponent
     * @param array $rule
     */
    private function calComponentSetRRUle(int $idcomponent, array $rule)
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
            $request['into'] .= ',set_interval';
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
        // by_monthday
        if (isset($rule['by_month_day'])) {
            $request['into'] .= ',by_month_day';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $rule['by_month_day'];
        }
        // by_month
        if (isset($rule['by_month'])) {
            $request['into'] .= ',by_month';
            $request['values'] .= ',?';
            $request['type'] .= 's';
            $request['content'][] = $rule['by_month'];
        }
        // by_setpos
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
    private function calRemoveUnusedDescription(int $iddescription)
    {
        if (empty($this->db->request([
            'query' => 'SELECT NULL FROM cal_folder WHERE description = ? UNION SELECT NULL FROM cal_component WHERE description = ? UNION SELECT NULL FROM cal_alarm WHERE description = ? LIMIT 1;',
            'type' => 'iii',
            'content' => [$iddescription, $iddescription, $iddescription],
            'array' => true,
        ]))) $this->db->request([
            'query' => 'DELETE cal_description WHERE idcal_description = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$iddescription],
        ]);
    }
    private function calRemoveUnusedLocation(int $idlocation)
    {
        if (empty($this->db->request([
            'query' => 'SELECT NULL FROM cal_component WHERE idcal_location = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idlocation],
            'array' => true,
        ])))
            $this->db->request([
                'query' => 'DELETE cal_location WHERE idcal_location = ? LIMIT 1;',
                'type' => 'i',
                'content' => [$idlocation],
            ]);
    }
    private function calSetSession(int $idsession, int $cal_folder, string $start, string $end)
    {
        if (empty($this->db->request([
            'query' => 'SELECT NULL FROM session_has_calendar WHERE idsession = ? AND idcal_folder = ? LIMIT 1;',
            'type' => 'ii',
            'content' => [$idsession, $cal_folder],
            'array' => true,
        ])))
            return $this->db->request([
                'query' => 'INSERT INTO session_has_calendar (idsession,idcal_folder,start,end) VALUES (?,?,?,?);',
                'type' => 'iiss',
                'content' => [$idsession, $cal_folder, $start, $end],
            ]);
        return $this->db->request([
            'query' => 'UPDATE session_has_calendar SET start = ? AND end = ? WHERE idsession = ? AND idcal_folder = ? LIMIT 1;',
            'type' => 'ssii',
            'content' => [$start, $end, $idsession, $cal_folder],
        ]);
    }


    private function calGetCalendarUsers($idfolder)
    {
        $users = [];
        foreach ($this->db->request([
            'query' => 'SELECT iduser FROM user_has_calendar WHERE idcal_folder = ?;',
            'type' => 'i',
            'content' => [$idfolder],
            'array' => true,
        ]) as $user) $users[] = $user[0];
        return $users;
    }
    private function calRemoveComponent(int $idcomponent)
    {
        // tag
        $this->db->request([
            'query' => 'DELETE cal_comp_has_tag WHERE idcal_component = ?;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]);
        // attachment
        $this->db->request([
            'query' => 'DELETE cal_attachment WHERE idcal_component = ?;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]);
        // rrule
        $this->db->request([
            'query' => 'DELETE cal_rrule WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]);
        // rdate
        $this->db->request([
            'query' => 'DELETE cal_rdate WHERE idcal_component = ?;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]);
        // exception
        $this->db->request([
            'query' => 'DELETE cal_exception WHERE idcal_component = ?;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]);
        // alarm
        $alarms = $this->db->request([
            'query' => 'SELECT idcal_alarm FROM cal_comp_has_alarm WHERE idcal_component = ?;',
            'type' => 'i',
            'content' => [$idcomponent],
            'array' => true,
        ]);
        foreach ($alarms as $alarm) $this->componentRemoveAlarm($idcomponent, $alarm[0]);
        // attendee
        $attendees = $this->db->request([
            'query' => 'SELECT cal_attendee WHERE idcal_component = ?;',
            'type' => 'i',
            'content' => [$idcomponent],
            'array' => true,
        ]);
        // if attendee with status confirmed, ask user if he wants to send them intel that event is aborted.
        // There will be notification anyway.
        $this->db->request([
            'query' => 'DELETE cal_attendee WHERE idcal_component = ?;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]);
        // component
        $component = $this->db->request([
            'query' => 'SELECT BIN_TO_UUID(uid,1) AS uuid,location,description FROM cal_component WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]);
        $this->db->request([
            'query' => 'DELETE cal_component WHERE idcal_component = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$idcomponent],
        ]);
        // remove location
        if (!empty($component['location'])) $this->removeUnusedLocation($component['location']);
        // remove description
        if (!empty($component['description'])) $this->removeUnusedDescription($component['description']);
        // file if empty
        if (empty($this->db->request([
            'query' => 'SELECT NULL FROM cal_component WHERE uid = UUID_TO_BIN(?,1) LIMIT 1;',
            'type' => 's',
            'content' => [$component['uuid']],
            'array' => true,
        ]))) $this->db->request([
            'query' => 'DELETE cal_file WHERE uid = UUID_TO_BIN(?,1) LIMIT 1;',
            'type' => 's',
            'content' => [$component['uuid']],
        ]);

        // send intel to users having access to calendar of this new turn of events.
    }
    private function calRemoveFile(string $uid)
    {
        $components = $this->db->request([
            'query' => 'SELECT idcal_component FROM cal_component WHERE uid = UUID_TO_BIN(?,1);',
            'type' => 's',
            'content' => [$uid],
            'array' => true,
        ]);
        // if components, removes components (last one removes also file)
        if (!empty($components))
            foreach ($components as $component) $this->removeComponent($component[0]);
        // else remove file
        else $this->db->request([
            'query' => 'DELETE cal_file WHERE uid = UUID_TO_BIN(?,1) LIMIT 1;',
            'type' => 's',
            'content' => [$uid],
        ]);
    }



    /**
     * Get external calendars of all or selected types linked to a user.
     * @param int $iduser User to get calendars from.
     * @param null|string[] $types If set, types of calendar to get, all by default.
     * 
     * @return false|array
     */
    private function calGetExternalCals(int $iduser, ?array $types)
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
    private function calGetEventsFromCaldav(int $id, array $period)
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
