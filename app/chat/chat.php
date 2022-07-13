<?php
class SweetChat extends FWServer
{
    public static function addMessage(int $user, int $chat, string $message)
    {
        // get last message data
        $last = self::getLastMessage($chat);
        // insert new message
        $new = self::insertMessage($user, $chat, $message);
        return [
            "last" => $last,
            "new" => [
                "content" => $message,
                "idchat" => $chat,
                "iduser" => $user,
                "created" => $new["created"],
            ],
            "users" => self::getChatUsersFd($chat),
        ];
    }
    public static function chatRequest(int $from, int $to)
    {
        // select $to fd,name,role
        $recipient = self::getUserInfo($to);
        $sender = self::getUserInfo($from);
        if ($recipient) {
            return [
                "recipient" => $recipient,
                "sender" => $sender,
            ];
        }
        return false;
    }
    public static function chatRequestOK(
        int $sender,
        int $recipient,
        ?int $chat
    ) {
        // if chat
        if (isset($chat)) {
            // insert recipient in chat
            self::userJoins($recipient, $chat);
            // refresh chat for users
        } else {
            // else create chat
            $senderInfo = self::getUserInfo($sender);
            $idchat = self::createChat($senderInfo["name"]);
            // insert both recipient and sender to chat
        }
    }
    public static function chatUserLogout(int $user)
    {
        // check every chat he's in to warn other users he's logout
        // get chat list
        $batch = [];
        foreach (self::getChatList($user) as $chat) {
            // for each chat
            // get userlist
            $batch[$chat["idchat"]]["id"] = $chat["idchat"];
            $batch[$chat["idchat"]]["list"] = self::getUsersList(
                $chat["idchat"]
            );
            // get online users
            $batch[$chat["idchat"]]["users"] = self::getChatUsersFd(
                $chat["idchat"],
                $user
            );
        }
        return $batch;
    }
    public static function createChat(string $name)
    {
        new DBRequest([
            "query" => "INSERT INTO chat (name) VALUES (?);",
            "param_type" => "s",
            "param_content" => [$name],
        ]);
        $fetch = new DBRequest([
            "query" => 'SELECT MAX(idchat) "idchat" FROM chat WHERE name = ?;',
            "param_type" => "s",
            "param_content" => [$name],
        ]);
        return $fetch->result[0]["idchat"];
    }
    public static function createChatForUsers(int $host, array $guests)
    {
        $hostInfo = self::getUserInfo($host);
        $idchat = self::createChat($hostInfo["name"]);
        $hostJoin = self::userJoins($host, $idchat);
        $guestJoin = [];
        foreach ($guests as $guest) {
            $guestJoin[] = self::userJoins($guest, $idchat);
        }
        return [
            "host" => $hostJoin,
            "guests" => $guestJoin,
        ];
    }
    public static function getChatList(int $user)
    {
        $fetch = new DBRequest([
            "query" => "SELECT idchat FROM user_in_chat WHERE iduser = ?;",
            "param_type" => "i",
            "param_content" => [$user],
        ]);
        return $fetch->result;
    }
    public static function getChatName(int $chat)
    {
        $fetch = new DBRequest([
            "query" => "SELECT name FROM chat WHERE idchat = ?;",
            "param_type" => "i",
            "param_content" => [$chat],
        ]);
        return $fetch->result[0]["name"];
    }
    public static function getChatUsersFd(int $chat, ?int $user = null)
    {
        $userCheck = "";
        $paramType = "iii";
        $paramContent = [$chat, $chat, $chat];
        if ($user !== null) {
            $userCheck = " AND session.iduser != ?";
            $paramType = "iiiii";
            $paramContent = [$chat, $chat, $user, $chat, $user];
        }
        $fetch = new DBRequest([
            "query" => "SELECT fd, ticket.iduser,1 as 'assignee',
                IF((SELECT COUNT(*)
                    FROM user_in_chat
                    WHERE idchat = ? AND iduser = ticket.iduser
                    ) > 0,1,0) 'inchat'
                FROM ticket
                LEFT JOIN session USING (iduser)
                WHERE idchat = ? AND fd IS NOT NULL{$userCheck}
                UNION
                SELECT fd, user_in_chat.iduser, 0 AS 'assignee',1 AS 'inchat'
                FROM user_in_chat
                LEFT JOIN session USING (iduser)
                LEFT JOIN ticket USING (idchat)
                WHERE idchat = ?
                AND fd IS NOT NULL
                AND (session.iduser != ticket.iduser OR ticket.iduser IS NULL){$userCheck}",
            "param_type" => $paramType,
            "param_content" => $paramContent,
        ]);
        return $fetch->result ?? false;
    }
    public static function getLastMessage(int $chat)
    {
        $fetch = new DBRequest([
            "query" =>
                "SELECT created,iduser FROM message WHERE idchat = ? AND created = (SELECT MAX(created) FROM message WHERE idchat = ?) GROUP BY idmessage;",
            "param_type" => "ii",
            "param_content" => [$chat, $chat],
        ]);
        return $fetch->result[0] ?? false;
    }
    public static function getMessages(int $chat)
    {
        $fetch = new DBRequest([
            "query" => "SELECT idchat,content,created,message.iduser,GROUP_CONCAT(DISTINCT message_read_by.iduser) 'readby'
                        FROM message
                        LEFT JOIN message_read_by USING (idmessage)
                        WHERE idchat = ?
                        GROUP BY idmessage;",
            "param_type" => "i",
            "param_content" => [$chat],
        ]);
        return $fetch->result;
    }
    public static function getUsersList(int $chat)
    {
        $fetch = new DBRequest([
            "query" => "SELECT user_in_chat.iduser,image,CONCAT_WS(' ',last_name,first_name) 'name',ISNULL(session.fd) 'status',
                CASE
                    WHEN user_in_chat.iduser = ticket.iduser THEN 'assignee'
                    WHEN user_in_chat.iduser = about THEN 'client'
                    ELSE 'other'
                END 'position'
                FROM user_in_chat
                LEFT JOIN user USING (iduser)
                LEFT JOIN session USING (iduser)
                LEFT JOIN ticket USING (idchat)
                WHERE user_in_chat.idchat = ?
                GROUP BY iduser
                UNION
                SELECT iduser,image,CONCAT_WS(' ',last_name,first_name) 'name',
                2 AS 'status',
                'assignee' AS 'position'
                FROM ticket
                LEFT JOIN user USING (iduser)
                LEFT JOIN session USING (iduser)
                WHERE idchat = ? AND (SELECT COUNT(*) FROM user_in_chat WHERE idchat = ticket.idchat AND iduser = ticket.iduser) = 0
                GROUP BY iduser
                UNION DISTINCT
                SELECT message.iduser,image,CONCAT_WS(' ',last_name,first_name) 'name',2 AS 'status',
                CASE
                    WHEN message.iduser = ticket.iduser THEN 'assignee'
                    WHEN message.iduser = about THEN 'client'
                    ELSE 'other'
                END 'position'
                FROM message
                LEFT JOIN user USING (iduser)
                LEFT JOIN user_in_chat USING (iduser)
                LEFT JOIN session USING (iduser)
                LEFT JOIN ticket ON message.idchat = ticket.idchat
                WHERE message.idchat = ? AND (SELECT COUNT(*) FROM user_in_chat WHERE idchat = message.idchat AND iduser = message.iduser) = 0
                GROUP BY iduser;",
            "param_type" => "iii",
            "param_content" => [$chat, $chat, $chat],
        ]);
        return $fetch->result;
    }
    public static function insertMessage(int $user, int $chat, string $message)
    {
        new DBRequest([
            "query" =>
                "INSERT INTO message (iduser,idchat,content,created) VALUES (?,?,?,UNIX_TIMESTAMP());",
            "param_type" => "iis",
            "param_content" => [$user, $chat, $message],
        ]);
        $fetch = new DBRequest([
            "query" => "SELECT idmessage,created,GROUP_CONCAT(DISTINCT message_read_by.iduser) 'readby'
                FROM message
                LEFT JOIN message_read_by USING (idmessage)
                WHERE idchat = ? AND message.iduser = ? AND content = ? AND created = (SELECT MAX(created) FROM message) GROUP BY idmessage;",
            "param_type" => "iis",
            "param_content" => [$chat, $user, $message],
        ]);
        return $fetch->result[0];
    }
    public static function insertUser(int $user, int $chat)
    {
        new DBRequest([
            "query" => "INSERT INTO user_in_chat (iduser,idchat) VALUES (?,?);",
            "param_type" => "ii",
            "param_content" => [$user, $chat],
        ]);
        return self::getUsersList($chat);
    }
    public static function removeUser(int $user, int $chat)
    {
        new DBRequest([
            "query" =>
                "DELETE FROM user_in_chat WHERE iduser = ? AND idchat = ?;",
            "param_type" => "ii",
            "param_content" => [$user, $chat],
        ]);
        return self::getUsersList($chat);
    }
    public static function setUsersList(array $list, int $user)
    {
        $corrected = [];
        foreach ($list as $row) {
            if ($row["iduser"] === $user) {
                $row["position"] = "user";
            }
            $corrected[] = $row;
        }
        return $corrected;
    }
    public static function userInChat(int $user, int $chat)
    {
        $fetch = new DBRequest([
            "query" =>
                "SELECT COUNT(*) FROM user_in_chat WHERE iduser = ? AND idchat = ?;",
            "param_type" => "ii",
            "param_content" => [$user, $chat],
            "array" => true,
        ]);
        return $fetch->result[0][0] > 0 ? true : false;
    }
    public static function userJoins(int $user, int $chat)
    {
        $inChat = self::userInChat($user, $chat);
        // if user in chat, get sessions not connected to it and connect them.

        // else join chat on all sessions and inform other users of it.

        return [
            "content" => self::getMessages($chat),
            "id" => $chat,
            "list" => $inChat
                ? self::getUsersList($chat)
                : self::insertUser($user, $chat),
            "name" => self::getChatName($chat),
            "other" => self::getChatUsersFd($chat, $user),
            "user" => self::getUserFd($user),
        ];
    }
    public static function userLeaves(int $user, int $chat)
    {
        $list = self::removeUser($user, $chat);
        self::deleteUnused();
        $users = self::getChatUsersFd($chat, $user);
        return [
            "id" => $chat,
            "deserter" => self::getUserFd($user),
            "list" => $list,
            "users" => $users,
        ];
    }
    public static function deleteUnused()
    {
        new DBRequest([
            "query" => 'DELETE chat FROM chat
            LEFT JOIN ticket USING (idchat)
            LEFT JOIN user_in_chat USING (idchat)
            WHERE ticket.idchat IS NULL AND user_in_chat.idchat IS NULL;',
        ]);
    }
}