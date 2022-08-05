<?php

namespace bopdev;

trait BopCal
{
    use \SimpleCalDavClient;
    // ready to add other types
    private $calendarTypes = ['caldav'];

    /**
     * Get calendars of all or selected types linked to a user.
     * @param int $iduser User to get calendars from.
     * @param null|string[] $types If set, types of calendar to get, all by default.
     * 
     * @return false|array
     */
    private function getCal(int $iduser, ?array $types)
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
