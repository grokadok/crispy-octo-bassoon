<?php

namespace bopdev;

trait BopCal
{
    use \SimpleCalDavClient;
    // ready to add other types
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

    private function getCalFilesFromLocalCalendar(int $cal_folder)
    {
        $cal_files = $this->db->request([
            'query' => 'SELECT uid,etag FROM cal_file WHERE idcal_folder = ?;',
            'type' => 'i',
            'content' => [$cal_folder],
            'array' => false,
        ]);
        return $cal_files;
    }

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
            'events' => [],
            'timezones' => [],
            'users' => [],
        ];

        foreach ($events as $event) {
            // get description
            if (isset($event['idcal_description'])) {
            }
            $event['description'] = isset($event['idcal_description']) ? $this->db->request([
                'query' => 'SELECT content FROM cal_description WHERE idcal_description = ? LIMIT 1;',
                'type' => 'i',
                'content' => [$event['idcal_description']],
                'array' => true,
            ])[0][0] : '';

            // get organizer
            if (isset($event['organizer']) && !in_array($event['organizer'], $response['users'], true)) $response['users'][] = $event['organizer'];

            // get timezone
            if (isset($event['idtimezone']) && !in_array($event['idtimezone'], $response['timezones'], true)) $response['timezones'][] = $event['idtimezone'];

            // get location
            $event['location'] = isset($event['idcal_location']) ? $this->db->request([
                'query' => 'SELECT name FROM cal_location WHERE idcal_location = ? LIMIT 1;',
                'type' => 'i',
                'content' => [$event['idcal_location']],
                'array' => true,
            ])[0][0] : '';

            // get recurrence
            if (isset($event['recur_rule']))
                $event['recurrence'] = $this->getRecurrence($event['recur_rule']);


            // get attendees
        }
    }
    private function getRecurrence($id)
    {
        // get recurrence
        $recurrence = $this->db->request([
            'query' => 'SELECT idcal_frequency, interval, until, count, week_start, by_day, by_monthday, by_month, by_setpos, instance_date, instance_tz FROM cal_recurrence WHERE idcal_recurrence = ? LIMIT 1;',
            'type' => 'i',
            'content' => [$id],
            'array' => false,
        ])[0];
        // get exceptions
        $recurrence['exceptions'] = $this->db->request([
            'query' => 'SELECT date,all_day FROM cal_has_rec_exc LEFT JOIN cal_exception USING (idcal_exception) WHERE ical_recurrence = ?;',
            'type' => 'i',
            'content' => [$id],
            'array' => false,
        ]);

        return $recurrence;
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
