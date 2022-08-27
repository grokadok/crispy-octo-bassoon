<?php

namespace bopdev;

$functions = __DIR__ . "/app/model/functions.php";
$dbrequest = __DIR__ . "/app/model/dbrequest.php";
$chat = __DIR__ . "/app/chat/chat.php";
$caldav = __DIR__ . "/app/simplecaldav/SimpleCalDAVClient.php";
$localenv = __DIR__ . "/config/env.php";
foreach ([$dbrequest, $functions, $chat, $caldav] as $value) {
    require_once $value;
    unset($value);
};
if (getenv('ISLOCAL')) {
    require_once $localenv;
    unset($localenv);
}


use Swoole\Coroutine as Co;
use Swoole\Table;
use Swoole\WebSocket\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\WebSocket\Frame;
use bopdev\DBRequest;
use SimpleCalDAVClient;

// \Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_NATIVE_CURL);

// use ContextManager as CM;

class FWServer
{
    use BopChat;
    // use BopCal;
    private $tabs = [
        // 0=>[
        //     "icon" => '',
        //     "fields" => [],
        //     "actions" => [],
        //     "name" => "",
        //     "toolbar" => "",
        // ],
        1 => [
            "icon" =>
            '<svg class="svg-icon" viewBox="0 0 20 20"><path d="M18.121,9.88l-7.832-7.836c-0.155-0.158-0.428-0.155-0.584,0L1.842,9.913c-0.262,0.263-0.073,0.705,0.292,0.705h2.069v7.042c0,0.227,0.187,0.414,0.414,0.414h3.725c0.228,0,0.414-0.188,0.414-0.414v-3.313h2.483v3.313c0,0.227,0.187,0.414,0.413,0.414h3.726c0.229,0,0.414-0.188,0.414-0.414v-7.042h2.068h0.004C18.331,10.617,18.389,10.146,18.121,9.88 M14.963,17.245h-2.896v-3.313c0-0.229-0.186-0.415-0.414-0.415H8.342c-0.228,0-0.414,0.187-0.414,0.415v3.313H5.032v-6.628h9.931V17.245z M3.133,9.79l6.864-6.868l6.867,6.868H3.133z"></path></svg>',
            "fields" => [
                [
                    "grid" => "1/1/-1/-1",
                    "name" => "Test Table",
                    "options" => [
                        "tableHead" => [
                            "fixed" => true,
                        ],
                        "scroll" => "infinite",
                        "task" => 0,
                    ],
                    "type" => "boptable",
                ],
            ],
            "name" => "Home",
            "toolbar" => "<li>Home tools</li>",
        ],
        2 => [
            "icon" => "",
            "fields" => [],
            "actions" => "",
            "name" => "Trade",
            "toolbar" => "",
        ],
        3 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "console.log('new item')",
                ],
            ],
            "icon" =>
            '<svg class="svg-icon" viewBox="0 0 20 20"><path d="M17.431,2.156h-3.715c-0.228,0-0.413,0.186-0.413,0.413v6.973h-2.89V6.687c0-0.229-0.186-0.413-0.413-0.413H6.285c-0.228,0-0.413,0.184-0.413,0.413v6.388H2.569c-0.227,0-0.413,0.187-0.413,0.413v3.942c0,0.228,0.186,0.413,0.413,0.413h14.862c0.228,0,0.413-0.186,0.413-0.413V2.569C17.844,2.342,17.658,2.156,17.431,2.156 M5.872,17.019h-2.89v-3.117h2.89V17.019zM9.587,17.019h-2.89V7.1h2.89V17.019z M13.303,17.019h-2.89v-6.651h2.89V17.019z M17.019,17.019h-2.891V2.982h2.891V17.019z"></path></svg>',
            "fields" => [
                [
                    "grid" => "1/1/-1/-1",
                    "name" => "Items",
                    "options" => [
                        "tableHead" => [
                            "fixed" => true,
                        ],
                        "scroll" => "infinite",
                        "task" => 1,
                    ],
                    "type" => "boptable",
                ],
            ],
            "name" => "Items",
            "toolbar" => "<li>Vues</li>",
        ],
        4 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "",
                ],
                [
                    "name" => "import",
                    "action" => "",
                ],
            ],
            "icon" =>
            '<svg class="svg-icon" viewBox="0 0 20 20"><path d="M17.896,12.706v-0.005v-0.003L15.855,2.507c-0.046-0.24-0.255-0.413-0.5-0.413H4.899c-0.24,0-0.447,0.166-0.498,0.4L2.106,12.696c-0.008,0.035-0.013,0.071-0.013,0.107v4.593c0,0.28,0.229,0.51,0.51,0.51h14.792c0.28,0,0.51-0.229,0.51-0.51v-4.593C17.906,12.77,17.904,12.737,17.896,12.706 M5.31,3.114h9.625l1.842,9.179h-4.481c-0.28,0-0.51,0.229-0.51,0.511c0,0.703-1.081,1.546-1.785,1.546c-0.704,0-1.785-0.843-1.785-1.546c0-0.281-0.229-0.511-0.51-0.511H3.239L5.31,3.114zM16.886,16.886H3.114v-3.572H7.25c0.235,1.021,1.658,2.032,2.75,2.032c1.092,0,2.515-1.012,2.749-2.032h4.137V16.886z"></path></svg>',
            "fields" => [
                [
                    "grid" => "1/1/-1/-1",
                    "name" => "Tickets",
                    "options" => [
                        "tableHead" => [
                            "fixed" => true,
                        ],
                        "scroll" => "infinite",
                        "task" => 0,
                    ],
                    "type" => "boptable",
                ],
            ],
            "name" => "Orders",
            "toolbar" => "<li>Filters</li><li>Vues</li>",
        ],
        5 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "",
                ],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Suppliers",
            "toolbar" => "",
        ],
        6 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "",
                ],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Orders",
            "toolbar" => "",
        ],
        7 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "",
                ],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Items",
            "toolbar" => "",
        ],
        8 => [
            "actions" => [
                [
                    "name" => "import",
                    "action" => "",
                ],
                ["name" => "configure", "action" => ""],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Stocklist",
            "toolbar" => "",
        ],
        9 => [
            "icon" => "",
            "fields" => [],
            "name" => "Services",
            "toolbar" => "",
        ],
        10 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "",
                ],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Jobs",
            "toolbar" => "",
        ],
        11 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "",
                ],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Tasks",
            "toolbar" => "",
        ],
        12 => [
            "actions" => [
                [
                    "name" => "new meeting",
                    "action" => "",
                ],
            ],
            "icon" => "",
            "fields" => [
                [
                    "grid" => "1/1/-1/-1",
                    "name" => "Calendar",
                    "type" => "calendar",
                ],
            ],
            "name" => "Calendar",
            "toolbar" => "",
        ],
        13 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "loadNewTicket();",
                ],
            ],
            "icon" =>
            '<svg class="svg-icon" viewBox="0 0 20 20"><path d="M17.896,12.706v-0.005v-0.003L15.855,2.507c-0.046-0.24-0.255-0.413-0.5-0.413H4.899c-0.24,0-0.447,0.166-0.498,0.4L2.106,12.696c-0.008,0.035-0.013,0.071-0.013,0.107v4.593c0,0.28,0.229,0.51,0.51,0.51h14.792c0.28,0,0.51-0.229,0.51-0.51v-4.593C17.906,12.77,17.904,12.737,17.896,12.706 M5.31,3.114h9.625l1.842,9.179h-4.481c-0.28,0-0.51,0.229-0.51,0.511c0,0.703-1.081,1.546-1.785,1.546c-0.704,0-1.785-0.843-1.785-1.546c0-0.281-0.229-0.511-0.51-0.511H3.239L5.31,3.114zM16.886,16.886H3.114v-3.572H7.25c0.235,1.021,1.658,2.032,2.75,2.032c1.092,0,2.515-1.012,2.749-2.032h4.137V16.886z"></path></svg>',
            "fields" => [
                [
                    "grid" => "1/1/-1/-1",
                    "name" => "Tickets",
                    "options" => [
                        "tableHead" => [
                            "fixed" => true,
                        ],
                        "scroll" => "infinite",
                        "task" => 0,
                    ],
                    "type" => "boptable",
                ],
            ],
            "name" => "Tickets",
            "toolbar" => "<li>Filters</li><li>Vues</li>",
        ],
        14 => [
            "icon" => "",
            "fields" => [],
            "action" => "",
            "name" => "Stats",
            "toolbar" => "",
        ],
        15 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "loadNewCompany();",
                ],
            ],
            "icon" =>
            '<svg class="svg-icon" viewBox="0 0 20 20"><path d="M17.638,6.181h-3.844C13.581,4.273,11.963,2.786,10,2.786c-1.962,0-3.581,1.487-3.793,3.395H2.362c-0.233,0-0.424,0.191-0.424,0.424v10.184c0,0.232,0.191,0.424,0.424,0.424h15.276c0.234,0,0.425-0.191,0.425-0.424V6.605C18.062,6.372,17.872,6.181,17.638,6.181 M13.395,9.151c0.234,0,0.425,0.191,0.425,0.424S13.629,10,13.395,10c-0.232,0-0.424-0.191-0.424-0.424S13.162,9.151,13.395,9.151 M10,3.635c1.493,0,2.729,1.109,2.936,2.546H7.064C7.271,4.744,8.506,3.635,10,3.635 M6.605,9.151c0.233,0,0.424,0.191,0.424,0.424S6.838,10,6.605,10c-0.233,0-0.424-0.191-0.424-0.424S6.372,9.151,6.605,9.151 M17.214,16.365H2.786V7.029h3.395v1.347C5.687,8.552,5.332,9.021,5.332,9.575c0,0.703,0.571,1.273,1.273,1.273c0.702,0,1.273-0.57,1.273-1.273c0-0.554-0.354-1.023-0.849-1.199V7.029h5.941v1.347c-0.495,0.176-0.849,0.645-0.849,1.199c0,0.703,0.57,1.273,1.272,1.273s1.273-0.57,1.273-1.273c0-0.554-0.354-1.023-0.849-1.199V7.029h3.395V16.365z"></path></svg>',
            "fields" => [
                [
                    "grid" => "1/1/-1/-1",
                    "name" => "Corp.",
                    "options" => [
                        "tableHead" => [
                            "fixed" => true,
                        ],
                        "scroll" => "infinite",
                        "task" => 1,
                    ],
                    "type" => "boptable",
                ],
            ],
            "name" => "Corp.",
            "toolbar" => "<li>Filters</li><li>Import</li>",
        ],
        16 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "loadNewCompany();",
                ],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Suppliers",
            "toolbar" => "",
        ],
        17 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "loadNewCompany();",
                ],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Labels",
            "toolbar" => "",
        ],
        18 => [
            "icon" =>
            '<svg class="svg-icon" viewBox="0 0 20 20"><path d="M17.283,5.549h-5.26V4.335c0-0.222-0.183-0.404-0.404-0.404H8.381c-0.222,0-0.404,0.182-0.404,0.404v1.214h-5.26c-0.223,0-0.405,0.182-0.405,0.405v9.71c0,0.223,0.182,0.405,0.405,0.405h14.566c0.223,0,0.404-0.183,0.404-0.405v-9.71C17.688,5.731,17.506,5.549,17.283,5.549 M8.786,4.74h2.428v0.809H8.786V4.74z M16.879,15.26H3.122v-4.046h5.665v1.201c0,0.223,0.182,0.404,0.405,0.404h1.618c0.222,0,0.405-0.182,0.405-0.404v-1.201h5.665V15.26z M9.595,9.583h0.81v2.428h-0.81V9.583zM16.879,10.405h-5.665V9.19c0-0.222-0.183-0.405-0.405-0.405H9.191c-0.223,0-0.405,0.183-0.405,0.405v1.215H3.122V6.358h13.757V10.405z"></path></svg>',
            "fields" => [
                [
                    "name" => "People",
                    "options" => [
                        "tableHead" => [
                            "fixed" => true,
                        ],
                        "scroll" => "infinite",
                        "task" => 2,
                    ],
                    "type" => "boptable",
                ],
            ],
            "name" => "People",
            "toolbar" => "<li>Filters</li><li>Import</li>",
        ],
        19 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "loadNewContact();",
                ],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Contacts",
            "toolbar" => "",
        ],
        20 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "loadNewContact();",
                ],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Clients",
            "toolbar" => "",
        ],
        21 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "loadNewContact();",
                ],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Agents",
            "toolbar" => "",
        ],
        22 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "",
                ],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Groups",
            "toolbar" => "",
        ],
        23 => [
            "icon" =>
            '<svg class="svg-icon" viewBox="0 0 20 20"><path d="M8.749,9.934c0,0.247-0.202,0.449-0.449,0.449H4.257c-0.247,0-0.449-0.202-0.449-0.449S4.01,9.484,4.257,9.484H8.3C8.547,9.484,8.749,9.687,8.749,9.934 M7.402,12.627H4.257c-0.247,0-0.449,0.202-0.449,0.449s0.202,0.449,0.449,0.449h3.145c0.247,0,0.449-0.202,0.449-0.449S7.648,12.627,7.402,12.627 M8.3,6.339H4.257c-0.247,0-0.449,0.202-0.449,0.449c0,0.247,0.202,0.449,0.449,0.449H8.3c0.247,0,0.449-0.202,0.449-0.449C8.749,6.541,8.547,6.339,8.3,6.339 M18.631,4.543v10.78c0,0.248-0.202,0.45-0.449,0.45H2.011c-0.247,0-0.449-0.202-0.449-0.45V4.543c0-0.247,0.202-0.449,0.449-0.449h16.17C18.429,4.094,18.631,4.296,18.631,4.543 M17.732,4.993H2.46v9.882h15.272V4.993z M16.371,13.078c0,0.247-0.202,0.449-0.449,0.449H9.646c-0.247,0-0.449-0.202-0.449-0.449c0-1.479,0.883-2.747,2.162-3.299c-0.434-0.418-0.714-1.008-0.714-1.642c0-1.197,0.997-2.246,2.133-2.246s2.134,1.049,2.134,2.246c0,0.634-0.28,1.224-0.714,1.642C15.475,10.331,16.371,11.6,16.371,13.078M11.542,8.137c0,0.622,0.539,1.348,1.235,1.348s1.235-0.726,1.235-1.348c0-0.622-0.539-1.348-1.235-1.348S11.542,7.515,11.542,8.137 M15.435,12.629c-0.214-1.273-1.323-2.246-2.657-2.246s-2.431,0.973-2.644,2.246H15.435z"></path></svg>',
            "fields" => [
                [
                    "name" => "Admin",
                    "options" => [
                        "tableHead" => [
                            "fixed" => true,
                        ],
                        "scroll" => "infinite",
                        "task" => 3,
                    ],
                    "type" => "boptable",
                ],
            ],
            "name" => "Admin",
            "toolbar" => "<li>Filters</li><li>Import</li>",
        ],
        24 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "",
                ],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Users",
            "toolbar" => "",
        ],
        25 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "",
                ],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Roles",
            "toolbar" => "",
        ],
        26 => [
            "actions" => [
                [
                    "name" => "new",
                    "action" => "",
                ],
            ],
            "icon" => "",
            "fields" => [],
            "name" => "Tabs",
            "toolbar" => "",
        ],
    ];
    private $tabsMap = [
        1 => [],
        2 => [
            3 => [],
            4 => [],
            5 => [
                6 => [],
                7 => [],
                8 => [],
            ],
        ],
        9 => [
            10 => [],
            11 => [],
            12 => [],
        ],
        13 => [
            14 => [],
        ],
        15 => [
            16 => [],
            17 => [],
        ],
        18 => [
            19 => [],
            20 => [],
            21 => [],
            22 => [],
        ],
        23 => [
            24 => [],
            25 => [],
            26 => [],
        ],
    ];
    private $calendars = [];

    public function __construct(
        private $db = new DBRequest(),
        private $serv = new Server("0.0.0.0", 8080),
        private $table = new Table(1024),
        private $caldav = new SimpleCalDAVClient(),
    ) {
        $this->table->column("user", Table::TYPE_INT);
        $this->table->column("session", Table::TYPE_INT);
        $this->table->create();
        // $this->serv->set([
        //     "ssl_cert_file" => __DIR__ . "/ssl/ssl.crt",
        //     "ssl_key_file" => __DIR__ . "/ssl/ssl.key",
        // "ssl_cert_file" => __DIR__ . "/ssl/fullchain.pem",
        // "ssl_key_file" => __DIR__ . "/ssl/privkey.pem",
        // ]);
        // $cert = file_get_contents(__DIR__ . "/ssl.crt");
        // var_dump($cert);
        $this->serv->set([
            // "dispatch_mode" => 1, // not compatible with onClose, for stateless server
            // 'dispatch_mode' => 7, // not compatible with onClose, for stateless server
            'worker_num' => 4, // Open 4 Worker Process
            'open_cpu_affinity' => true,
            "open_http2_protocol" => true
            //     //  'max_request' => 4, // Each worker process max_request is set to 4 times
            //     //  'document_root'   => '',
            //     //  'enable_static_handler' => true,
            //     //  'daemonize' => false, // daems (TRUE / FALSE)
        ]);
        $this->serv->on("Start", [$this, "onStart"]);
        $this->serv->on("WorkerStart", [$this, "onWorkStart"]);
        $this->serv->on("ManagerStart", [$this, "onManagerStart"]);
        $this->serv->on("Request", [$this, "onRequest"]);
        $this->serv->on("Open", [$this, "onOpen"]);
        $this->serv->on("Message", [$this, "onMessage"]);
        $this->serv->on("Close", [$this, "onClose"]);
        $this->serv->table = $this->table;
        $this->serv->start();
    }
    private function getUserInfo(int $user)
    {
        return $this->db->request([
            "query" => 'SELECT CONCAT_WS(" ",first_name,last_name) "name", role.name "role" 
                FROM user
                LEFT JOIN user_has_role USING (iduser)
                LEFT JOIN role USING (idrole)
                WHERE iduser = ?;',
            "type" => "i",
            "content" => [$user],
        ])[0] ?? false;
    }
    private function getUserFd(int $user)
    {
        $res = $this->db->request([
            "query" => "SELECT fd FROM session WHERE iduser = ?;",
            "type" => "i",
            "content" => [$user],
            "array" => true,
        ]);
        $fds = [];
        if ($res) {
            foreach ($res as $fd) {
                $fds[] = $fd[0];
            }
        }
        return $fds ?? false;
    }
    private function httpTask($post)
    {
        try {
            $f = intval($post["f"]);

            /////////////////////////////////////////////////////
            // CHECK MAIL  (3)
            /////////////////////////////////////////////////////

            if ($f === 3 && $post["a"]) {
                $responseType = "text/html; charset=UTF-8";
                $email = $post["a"];
                $res = $this->db->request([
                    "query" => "SELECT null FROM user WHERE email = ?;",
                    "type" => "s",
                    "content" => [$email],
                ]);
                $responseContent = count($res);
            }

            /////////////////////////////////////////////////////
            // REGISTER  (4)
            /////////////////////////////////////////////////////

            if ($f === 4) {
                $responseType = "text/html; charset=UTF-8";
                $email = $post["email"];
                $password = password_hash($post["password"], PASSWORD_DEFAULT);
                $phone = $post["phone"];

                if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $this->db->request([
                        "query" =>
                        "INSERT INTO user (email,password,phone_number) VALUES (?,?,?);",
                        "type" => "sss",
                        "content" => [$email, $password, $phone],
                    ]);
                    $this->db->request([
                        "query" =>
                        "INSERT INTO user_has_role (iduser) VALUES ((SELECT iduser FROM user WHERE email = ?));",
                        "type" => "s",
                        "content" => [$email],
                    ]);
                    $responseContent = 1;
                }
            }

            /////////////////////////////////////////////////////
            // FORGOTTEN PASSWORD  (5)
            /////////////////////////////////////////////////////

            return [
                "type" => $responseType,
                "content" => $responseContent,
            ];
        } catch (\Exception $e) {
            throw $e;
        }
    }
    private function login($request)
    {
        if (
            isset($request["email"]) &&
            filter_var($request["email"], FILTER_VALIDATE_EMAIL) &&
            $request["password"]
        ) {
            $status = 0;
            $res = $this->db->request([
                "query" => 'SELECT iduser,password,phone_number,CONCAT_WS(" ",IFNULL(first_name,""),IFNULL(last_name,"")) "name", value, total_since_last, grand_total, timer
                FROM user
                LEFT JOIN pw_counter USING (iduser)
                WHERE email = ?
                GROUP BY iduser;',
                "type" => "s",
                "content" => [$request["email"]],
            ]);
            $data = [
                "attempts" => $res[0]["value"],
                "attempts_grand" => $res[0]["grand_total"],
                "attempts_total" => $res[0]["total_since_last"],
                "chat" => [],
                "name" => $res[0]["name"] ?? "",
                "role" => [],
                "tabs" => [],
                "timer" => $res[0]["timer"],
            ];
            $iduser = $res[0]["iduser"];
            if (
                isset($data["attempts"]) &&
                $data["attempts"] > 6 &&
                time() < strtotime($data["timer"]) + 300
            ) {
                $data = "-3";
            } elseif (
                !isset($data["attempts"]) ||
                $data["attempts"] < 7 ||
                time() > strtotime($data["timer"]) + 300
            ) {
                if (
                    password_verify($request["password"], $res[0]["password"])
                ) {
                    $this->db->request([
                        "query" => 'INSERT INTO pw_counter (iduser) VALUES (?)
                        ON DUPLICATE KEY UPDATE value = 0, total_since_last = 0;',
                        "type" => "i",
                        "content" => [$iduser],
                    ]);

                    // roles
                    $res = $this->db->request([
                        "query" =>
                        "SELECT idrole FROM user_has_role WHERE iduser = ?;",
                        "type" => "i",
                        "content" => [$iduser],
                        "array" => true,
                    ]);
                    array_map(function ($value) use (&$data) {
                        $data["role"][] = $value[0];
                    }, $res);

                    if (in_array(10, $data["role"])) {
                        $data = "-2"; // compte pas encore validé
                    } elseif (in_array(11, $data["role"])) {
                        $data = "-4"; // compte client
                    } else {
                        $user = $this->serv->getClientInfo($request["fd"]);
                        $ip = $user["remote_ip"] . ":" . $user["remote_port"];
                        $this->db->request([
                            "query" => "INSERT INTO session (iduser,fd,ip,refresh_time,total_time)
                                VALUES (?,?,?,UNIX_TIMESTAMP(),UNIX_TIMESTAMP());",
                            "type" => "iis",
                            "content" => [$iduser, $request["fd"], $ip],
                        ]);
                        $session = $this->db->request([
                            "query" =>
                            "SELECT MAX(idsession) 'idsession' FROM session WHERE iduser=?;",
                            "type" => "i",
                            "content" => [$iduser],
                        ])[0]["idsession"];
                        $status = 1;
                        $res = $this->db->request([
                            "query" =>
                            "SELECT idchat FROM user_in_chat WHERE iduser = ?;",
                            "type" => "i",
                            "content" => [$iduser],
                            "array" => true,
                        ]);
                        array_map(function ($value) use (&$data) {
                            $data["chat"][] = $value[0];
                        }, $res);
                        $res = $this->db->request([
                            "query" =>
                            "SELECT theme,solar,animations FROM options WHERE iduser = ?;",
                            "type" => "i",
                            "content" => [$iduser],
                        ]);
                        $data["options"] = $res[0] ?? null;

                        // if active tab set, get this tab, else get default tab (id1)
                        $data["active_tab"] = isset($request["active"]) ? $request["active"] : 1;
                        // get tabs (if not admin, admin as all tabs by default, or has he?)
                        $res = $this->db->request([
                            "query" =>
                            "SELECT idtab FROM user_has_role LEFT JOIN role_has_tab USING (idrole) WHERE iduser = ? GROUP BY idtab;",
                            "type" => "i",
                            "content" => [$iduser],
                            "array" => true,
                        ]);
                        if ($res[0][0]) {
                            foreach ($res as $tab) {
                                if ($data["active_tab"] === $tab[0]) {
                                    $data["tabs"][$tab[0]] =
                                        $this->tabs[$tab[0]];
                                } else {
                                    $data["tabs"][$tab[0]] = [
                                        "actions" =>
                                        $this->tabs[$tab[0]]["actions"] ??
                                            null,
                                        "name" => $this->tabs[$tab[0]]["name"],
                                        "icon" => $this->tabs[$tab[0]]["icon"],
                                    ];
                                }
                            }
                        }
                        $data["tabs_map"] = arrayAssocFilterKeys(
                            $this->tabsMap,
                            $data["tabs"]
                        );

                        // unset attempts,total,grand,iduser,timer
                        unset($data["attempts_grand"]);
                        unset($data["attempts"]);
                        unset($data["timer"]);
                    }
                } else {
                    // increment value or reset to 1 if > 6
                    if (
                        $data["attempts"] === null ||
                        time() > strtotime($data["timer"]) + 300
                    ) {
                        $val = 1;
                    } else {
                        $val =
                            intval($data["attempts"]) > 6
                            ? 1
                            : intval($data["attempts"]) + 1;
                    }
                    $tot =
                        $data["attempts_total"] === null
                        ? 1
                        : intval($data["attempts_total"]) + 1;
                    $grd =
                        $data["attempts_grand"] === null
                        ? 1
                        : intval($data["attempts_grand"]) + 1;
                    $this->db->request([
                        "query" => 'INSERT INTO pw_counter (iduser) VALUES (?)
                      ON DUPLICATE KEY UPDATE value = ?, total_since_last = ?, grand_total = ?;',
                        "type" => "iiii",
                        "content" => [$iduser, $val, $tot, $grd],
                    ]);
                    $data = $val;
                }
            }
        } else {
            $data = "-1";
        } // bad email
        return [
            "status" => $status,
            "data" => $data,
            "session" => $session ?? "",
            "user" => $iduser ?? "",
        ];
    }
    public function onClose(
        Server $server,
        int $fd,
        int $reactorId
    ) {
        // remove session from db then $fd from $this->table
        $user = $server->getClientInfo($fd);
        $session = $server->table->get($fd, "session");
        $iduser = $server->table->get($fd, "user");
        if ($session) {
            echo "delete session: " . $session . PHP_EOL;
            $this->db->request([
                "query" => "DELETE FROM session WHERE idsession = ?",
                "type" => "i",
                "content" => [$session],
            ]);
            $this->serv->table->del($fd);
            foreach ($this->chatUserLogout($iduser) as $chat) {
                foreach ($chat["users"] as $chatUser) {
                    if ($chatUser["inchat"] === 1) {
                        $this->serv->push(
                            $chatUser["fd"],
                            json_encode([
                                "f" => 19,
                                "chat" => [
                                    "id" => $chat["id"],
                                    "participants" => $chat["list"],
                                ],
                            ])
                        );
                    }
                }
            }
        }

        $closer = $reactorId < 0 ? "server" : "client";
        echo "{$closer} closed connection {$fd} from {$user["remote_ip"]}:{$user["remote_port"]}" .
            PHP_EOL;
    }
    public function onManagerStart($serv)
    {
        echo "#### Manager started ####" . PHP_EOL;
        swoole_set_process_name("swoole_process_server_manager");
    }
    public function onMessage(
        Server $server,
        Frame $frame
    ) {
        if (!$this->serv->table->exist($frame->fd)) {
            echo "login request from socket {$frame->fd}" . PHP_EOL;
            $data = json_decode(urldecode($frame->data), true);
            $data["fd"] = $frame->fd;
            $res = $this->login($data);
            if ($res["status"] === 1) {
                echo "login succeded for user {$res["user"]} at socket {$frame->fd} on session {$res["session"]}" .
                    PHP_EOL;
                $this->serv->table->set($frame->fd, [
                    "session" => $res["session"],
                    "user" => $res["user"],
                ]);
                $server->push($frame->fd, json_encode($res["data"]));
            } else {
                echo "login failed for {$frame->fd}" . PHP_EOL;
                $server->push($frame->fd, json_encode($res["data"]));
                $server->disconnect(
                    $frame->fd,
                    1000,
                    "Login failed, sorry bro."
                );
            }
        } else {
            $session = $server->table->get($frame->fd, "session");
            $user = $server->table->get($frame->fd, "user");
            echo "Request from u" .
                $user .
                ":s" .
                $session .
                " : " .
                $frame->data .
                PHP_EOL;
            try {
                $task = [
                    "fd" => $frame->fd,
                    "user" => $user,
                    ...json_decode($frame->data, true),
                ];
                $response = $this->wsTask($task);
                if (!empty($response)) {
                    $message = json_encode([
                        "response" => $response,
                        ...$task,
                    ]);
                    $server->push($frame->fd, $message);
                }
            } catch (\Exception $e) {
                echo "Exception reçue : " . $e->getMessage() . PHP_EOL;
                $response = json_encode([
                    "response" => [
                        "fail" => "Ta mère en string.",
                        "error" => $e->getMessage(),
                    ],
                    ...$task,
                ]);
                $server->push($frame->fd, $response);
            }
        }
    }
    public function onOpen(
        Server $server,
        Request $request
    ) {
        $user = $server->getClientInfo($request->fd);
        echo "connection {$request->fd} open for {$user["remote_ip"]}:{$user["remote_port"]}" .
            PHP_EOL;
    }
    public function onRequest(
        Request $request,
        Response $response
    ) {
        $response->header("Server", "SeaServer");
        $open_basedir = __DIR__ . "/public";
        $server = $request->server;
        $path_info = $server["path_info"];
        $request_uri = $server["request_uri"];
        $type = pathinfo($path_info, PATHINFO_EXTENSION);
        $file = $open_basedir . $request_uri;
        $static = [
            "css" => "text/css",
            "js" => "text/javascript",
            "map" => "application/json",
            "ico" => "image/x-icon",
            "png" => "image/png",
            "gif" => "image/gif",
            "jpg" => "image/jpg",
            "jpeg" => "image/jpg",
            "mp4" => "video/mp4",
        ];

        if (isset($static[$type])) {
            if (file_exists($file)) {
                $response->header("Content-Type", $static[$type]);
                $response->sendfile($file);
            } else {
                $response->status(404);
                $response->end();
            }
        } else {
            if ($server["request_method"] === "POST") {
                $res = $this->httpTask($request->post);
                $response->header("Content-Type", $res["type"] ?? "");
                $response->end(json_encode($res["content"]) ?? "");
            } elseif ($request_uri === "/" || $request_uri === "/index.php") {
                $theme = "light";
                $session = "";
                require __DIR__ . "/public/index.php";
            }
        }
    }
    public function onStart($serv)
    {
        echo "#### onStart ####" . PHP_EOL;
        swoole_set_process_name("swoole_process_server_master");
        echo "Swoole Service has started" . PHP_EOL;
        echo "master_pid: {$serv->master_pid}" . PHP_EOL;
        echo "manager_pid: {$serv->manager_pid}" . PHP_EOL;
        echo "########" . PHP_EOL . PHP_EOL;

        // DB query BENCHMARK
        // $s = microtime(true);
        // Co\run(
        //     function () {
        //         for ($n = 100000; $n--;) {
        //             Co::create(
        //                 function () {
        //                     $this->db->request([
        //                         'query' => 'SELECT ? + ?',
        //                         'type' => 'ii',
        //                         'content' => [mt_rand(1, 100), mt_rand(1, 100)]
        //                     ]);
        //                 }
        //             );
        //         }
        //     }
        // );
        // $s = microtime(true) - $s;
        // echo PHP_EOL . 'Use ' . $s . 's for 100000 queries' . PHP_EOL . PHP_EOL;

        // change session management to stateless asap with jwt or use dedicated library.
        if ($this->db->test() === true) {
            $this->db->request([
                "query" => "DELETE FROM session;",
            ]);
            $this->db->request([
                "query" => "ALTER TABLE session AUTO_INCREMENT=1; ;",
            ]);
            print('#### Db connected. ####' . PHP_EOL);
        } else print('!!!! No db connection. !!!!' . PHP_EOL);
    }
    public function onWorkStart($serv, $worker_id)
    {
        echo "#### Worker#$worker_id started ####" . PHP_EOL;
        swoole_set_process_name("swoole_process_server_worker");
        // spl_autoload_register(function ($className) {
        //     $classPath = __DIR__ . "/public/" . $className . ".php";
        //     if (is_file($classPath)) {
        //         require "{$classPath}";
        //         return;
        //     }
        // });

        // former function to connect to o2switch's nextcould caldav
        if (1 === 0) {
            go(function () use ($worker_id) {
                $calConnected = false;
                $tries = 0;
                while ($calConnected === false && $tries < 5) {
                    try {
                        $tries++;
                        $this->caldav->connect(getenv('CALDAV_URL'), getenv('CALDAV_USER'), getenv('CALDAV_PASS'));
                        $calConnected = true;
                    } catch (\Exception) {
                        print("!!!! CalDAV not reachable by Worker#$worker_id. !!!!" . PHP_EOL);
                        sleep(2);
                    }
                }
                if ($calConnected === true) {
                    print("#### CalDAV connected on Worker#$worker_id ####" . PHP_EOL);
                    $this->calendars = $this->caldav->findCalendars();
                    print('#### ' . count($this->calendars) . " calendars loaded on Worker#$worker_id ####" . PHP_EOL);
                } else print("!!!! CalDAV not connected on Worker#$worker_id. !!!!" . PHP_EOL);
                // var_dump($this->calendars);
                // sleep(20);
                // $this->caldav->setCalendar($this->calendars["personal-1"]);
                // $events = $this->caldav->getEvents('20220701T000000Z');
                // var_dump($events);
            });
        }
    }
    private function wsTask(array $task)
    {
        try {
            $f = $task["f"] ?? "";
            $fd = $task["fd"];
            $iduser = $task["user"];
            $data = $task["content"] ?? null;

            /////////////////////////////////////////////////////
            // FETCH TABLE DATA  (6)
            /////////////////////////////////////////////////////

            if ($f === 6 && $task["t"]) {
                if (intval($task["t"]) === 0) {
                    // ticket overview
                    $table_conf = [
                        "autoColumns" => true,
                        "columnDefaults" => [
                            "hozAlign" => "left",
                        ],
                        "layout" => "fitColumns",
                        "reactiveData" => true,
                        "responsiveLayout" => "collapse",
                    ];
                    $query =
                        'SELECT COUNT(DISTINCT idticket) AS "Nombre de tickets" FROM ticket;';
                } elseif (intval($task["t"]) === 1) {
                    // ticket performance
                    $table_conf = [
                        "columnDefaults" => [
                            "hozAlign" => "left",
                        ],
                        "autoColumns" => true,
                        "layout" => "fitColumns",
                        "reactiveData" => true,
                        "responsiveLayout" => "collapse",
                    ];
                    $query =
                        'SELECT COUNT(DISTINCT idticket) AS "Nombre de tickets" FROM ticket;';
                } elseif (intval($task["t"]) === 2) {
                    // ticket data
                    $table_conf = [
                        "columnDefaults" => [
                            "hozAlign" => "left",
                            "resizable" => false,
                        ],
                        "columns" => [
                            [
                                "field" => "#",
                                "sorter" => "number",
                                "title" => "#",
                                "width" => 30,
                            ],
                            [
                                "field" => "subject",
                                "sorter" => "string",
                                "title" => "Sujet",
                                "tooltip" => true,
                            ],
                            [
                                "field" => "state",
                                "hozAlign" => "center",
                                "sorter" => "string",
                                "title" => "État",
                                "width" => 70,
                            ],
                            [
                                "field" => "priority",
                                "hozAlign" => "center",
                                "sorter" => "string",
                                "title" => "Priorité",
                                "width" => 90,
                            ],
                            [
                                "field" => "modified",
                                "hozAlign" => "center",
                                "sorter" => "date",
                                "title" => "Modifié le",
                                "width" => 100,
                            ],
                            [
                                "field" => "type",
                                "hozAlign" => "center",
                                "sorter" => "string",
                                "title" => "Type",
                                "width" => 70,
                            ],
                            [
                                "field" => "group",
                                "sorter" => "string",
                                "title" => "Groupe",
                            ],
                            [
                                "field" => "assignee",
                                "sorter" => "string",
                                "title" => "Assigné",
                                "tooltip" => true,
                            ],
                            [
                                "field" => "tags",
                                "sorter" => "string",
                                "title" => "Tags",
                                "tooltip" => true,
                            ],
                            [
                                "field" => "client",
                                "sorter" => "string",
                                "title" => "Client",
                                "tooltip" => true,
                            ],
                            [
                                "field" => "corp",
                                "sorter" => "string",
                                "title" => "Société",
                                "tooltip" => true,
                            ],
                        ],
                        "event" => [
                            [
                                "listener" => "rowDblClick",
                                "action" =>
                                "(e,row) => loadTicket(row.getData()['#'])",
                            ],
                        ],
                        "layout" => "fitColumns",
                        "responsiveLayout" => "hide",
                        "selectable" => true,
                    ];
                    $query = 'SELECT idticket AS "#", subject, state.name AS "state", priority.name AS "priority", DATE_FORMAT(ticket.modified, "%d/%m/%Y") AS "modified", GROUP_CONCAT(DISTINCT ticket_type.name) AS "type", user_group.name AS "group", CONCAT_WS(" ",user.last_name,user.first_name) AS "assignee", GROUP_CONCAT(DISTINCT tag.name) AS "tags", CONCAT_WS(" ",tfuser.last_name,tfuser.first_name) AS "client", userco.name AS "corp"
                    FROM ticket
                    LEFT JOIN ticket_has_type USING (idticket)
                    LEFT JOIN ticket_type USING (idticket_type)
                    LEFT JOIN user ON ticket.iduser = user.iduser
                    LEFT JOIN user_in_group ON ticket.iduser = user_in_group.iduser
                    LEFT JOIN user_group ON ticket.idgroup = user_group.idgroup
                    LEFT JOIN state USING (idstate)
                    LEFT JOIN priority USING (idpriority)
                    LEFT JOIN ticket_has_tag USING (idticket)
                    LEFT JOIN tag USING (idtag)
                    LEFT JOIN user tfuser ON ticket.about = tfuser.iduser
                    LEFT JOIN user_is_from ON tfuser.iduser = user_is_from.iduser
                    LEFT JOIN corp userco ON user_is_from.idcorp = userco.idcorp
                    WHERE idstate != 5
                    GROUP BY idticket
                    ORDER BY idticket;';
                }
                // if admin, show all tickets, ability to edit everything
                // if entreprise/lead tech, show tickets related to entreprise, ability to edit/assign
                // $query =
                // if technicien, show tickets related to entreprise assigned to him or unassigned, ability to edit
                $table_conf["data"] = $this->db->request(["query" => $query]);
                // $table_conf["data"] = $fetch->result;
                return $table_conf;
            }

            /////////////////////////////////////////////////////
            // FETCH SELECTIZE DATA (7)
            /////////////////////////////////////////////////////

            if ($f === 7) {
                if (isset($task["i"])) {
                    $search = explode(" ", $task["i"]);
                    if (count($search) > 5) {
                        return [
                            "error" => "Too much words",
                            "fail" =>
                            "La recherche est limitée à cinq mots maximum.",
                        ];
                    }
                }
                $i = 0;
                if (intval($task["s"]) === 0 && $search) {
                    // contacts' email
                    $name_where = [];
                    $corp_where = [];
                    $content = [];
                    foreach ($search as $word) {
                        $name_where[] =
                            "(last_name LIKE ? OR first_name LIKE ? OR email LIKE ?)";
                        $corp_where[] = "(name LIKE ? OR email LIKE ?)";
                        array_splice($content, 3 * $i, 0, [
                            "%{$word}%",
                            "%{$word}%",
                            "%{$word}%",
                        ]);
                        array_push($content, "%{$word}%", "%{$word}%");
                    }
                    $name_where = implode(" AND ", $name_where);
                    $corp_where = implode(" AND ", $corp_where);
                    $type = str_repeat("s", count($content));
                    $request = [
                        "query" =>
                        'SELECT CONCAT_WS(" ",last_name,first_name) AS "content", email, CONCAT("u_",iduser) AS "id", GROUP_CONCAT(DISTINCT role.short) AS "role"
                        FROM user
                        LEFT JOIN user_has_role USING (iduser)
                        LEFT JOIN role USING (idrole)
                        WHERE' .
                            $name_where .
                            ' AND idrole != 10 AND email IS NOT NULL
                        GROUP BY iduser
                        UNION
                        SELECT name, email, CONCAT("c_",idcorp) AS "id", "co." AS "role"
                        FROM corp
                        WHERE' .
                            $corp_where .
                            ' AND email IS NOT NULL
                        GROUP BY idcorp
                        LIMIT 100;',
                        "type" => $type,
                        "content" => $content,
                    ];
                } elseif (intval($task["s"]) === 1 && $search) {
                    // tags
                    $where = [];
                    $content = [];
                    foreach ($search as $word) {
                        $where[] = "name LIKE ?";
                        $content[] = "%{$word}%";
                    }
                    $type = str_repeat("s", count($content));
                    $where = implode(" AND ", $where);
                    $request = [
                        "query" =>
                        'SELECT name AS "content", idtag AS "id" FROM tag WHERE ' .
                            $where .
                            " ORDER BY name;",
                        "type" => $type,
                        "content" => $content,
                    ];
                } elseif (intval($task["s"]) === 2 && $search) {
                    // companies
                    $where = [];
                    $content = [];
                    foreach ($search as $word) {
                        $where[] = "name LIKE ?";
                        $content[] = "%{$word}%";
                    }
                    $type = str_repeat("s", count($content));
                    $where = implode(" AND ", $where);
                    $request = [
                        "query" =>
                        'SELECT name AS "content",idcorp AS "id" FROM corp WHERE ' .
                            $where .
                            " ORDER BY name;",
                        "type" => $type,
                        "content" => $content,
                    ];
                } elseif (intval($task["s"]) === 3 && $search) {
                    // employees
                    $where = [];
                    $content = [];
                    foreach ($search as $word) {
                        $where[] = "(last_name LIKE ? OR first_name LIKE ?)";
                        array_splice($content, 2 * $i++, 0, [
                            "%{$word}%",
                            "%{$word}%",
                        ]);
                    }
                    $where = implode(" AND ", $where);
                    $type = str_repeat("s", count($content));
                    $request = [
                        "query" =>
                        'SELECT CONCAT_WS(" ",last_name,first_name) AS "content", iduser as "id",GROUP_CONCAT(DISTINCT role.short) AS "role"
                        FROM user
                        LEFT JOIN user_has_role USING (iduser)
                        LEFT JOIN role USING (idrole)
                        WHERE ' .
                            $where .
                            ' AND idrole != 10
                        GROUP BY iduser',
                        "type" => $type,
                        "content" => $content,
                    ];
                } elseif (intval($task["s"]) === 4 && $search) {
                    // groups & users/group
                    $name_where = [];
                    $fname_where = [];
                    $content = [];
                    foreach ($search as $word) {
                        $name_where[] = "name LIKE ?";
                        $fname_where[] =
                            "(last_name LIKE ? OR first_name LIKE ? OR user_group.name LIKE ?)";
                        array_splice($content, $i++, 0, "%{$word}%");
                        array_push(
                            $content,
                            "%{$word}%",
                            "%{$word}%",
                            "%{$word}%"
                        );
                    }
                    $name_where = implode(" AND ", $name_where);
                    $fname_where = implode(" AND ", $fname_where);
                    $type = str_repeat("s", count($content));
                    $request = [
                        "query" =>
                        'SELECT name AS "content", CONCAT("g_",idgroup) AS "id", NULL AS "role", NULL AS "secondary"
                        FROM user_group
                        WHERE ' .
                            $name_where .
                            '
                        GROUP BY idgroup
                        UNION
                        SELECT CONCAT_WS(" ",last_name,first_name) AS "content", CONCAT("u_",iduser) as "id",GROUP_CONCAT(DISTINCT role.short) AS "role", user_group.name AS "secondary"
                        FROM user
                        LEFT JOIN user_has_role USING (iduser)
                        LEFT JOIN role USING (idrole)
                        LEFT JOIN user_in_group USING (iduser)
                        LEFT JOIN user_group USING (idgroup)
                        WHERE ' .
                            $fname_where .
                            ' AND idrole < 10
                        GROUP BY iduser;',
                        "type" => $type,
                        "content" => $content,
                    ];
                } elseif (intval($task["s"]) === 5) {
                    // ticket type
                    $request = [
                        "query" => 'SELECT name AS "content", idticket_type AS "id"
                  FROM ticket_type;',
                    ];
                } elseif (intval($task["s"]) === 6) {
                    // priority
                    $request = [
                        "query" => 'SELECT name AS "content", idpriority AS "id"
                  FROM priority;',
                    ];
                } elseif (intval($task["s"]) === 7) {
                    // state
                    $request = [
                        "query" => 'SELECT name AS "content", idstate AS "id"
                  FROM state;',
                    ];
                } elseif (intval($task["s"]) === 8 && $search) {
                    // chat users
                    $name_where = [];
                    $content = [];
                    $chat_where = "";
                    $type = "";
                    if (isset($task["c"])) {
                        $chat_where =
                            ',IF((SELECT COUNT(*) FROM user_in_chat WHERE iduser = user.iduser AND idchat = ?)>0,1,0) "inchat"';
                        $content[] = $task["c"];
                        $type = "i";
                    }
                    foreach ($search as $word) {
                        $name_where[] =
                            "(last_name LIKE ? OR first_name LIKE ?)";
                        array_splice($content, 2 * $i + 1, 0, [
                            "%{$word}%",
                            "%{$word}%",
                        ]);
                    }
                    $name_where = implode(" AND ", $name_where);
                    $type .=
                        str_repeat(
                            "s",
                            count($content) - (isset($task["c"]) ? 1 : 0)
                        ) . "i";
                    $content[] = $iduser;

                    $request = [
                        "query" => "SELECT iduser 'id',CONCAT_WS(' ',last_name,first_name) 'content',GROUP_CONCAT(DISTINCT role.short) AS 'role',ISNULL(fd) 'status'{$chat_where}
                        FROM user
                        LEFT JOIN user_has_role USING (iduser)
                        LEFT JOIN role USING (idrole)
                        LEFT JOIN session USING (iduser)
                        WHERE {$name_where} AND idrole != 10 AND idrole != 11 AND iduser != ?
                        GROUP BY iduser
                        ORDER BY iduser, last_name, first_name;",
                        "type" => $type,
                        "content" => $content,
                    ];
                }
                $res = $this->db->request($request);
                return count($res) > 0
                    ? $res
                    : ["content" => []];
            }

            /////////////////////////////////////////////////////
            // SEND MAIL (8)
            /////////////////////////////////////////////////////

            if ($f === 8) {
                // Contenu:String, Destinataire(email)-Cc(email)-Cci(email):[String]
                // if date, program mail sending to date
                // return [
                //     "data" => $data,
                //     "error" => "Failed send email.",
                //     "fail" => "🎉🎊 Message bien envoyé ! 🎉🎊 (sort of 😇).",
                // ];
                return [
                    "success" =>
                    "L'email a bien été envoyé dans l'espace intersidéral entre tes deux oreilles. Sinon faut mettre en place un service d'email hein ça marchera mieux.",
                ];
                // else send mail
            }

            /////////////////////////////////////////////////////
            // CREATE TICKET (9)
            /////////////////////////////////////////////////////

            if ($f === 9) {
                $assignee = $data["Attribué à"][0];
                $client = $data["Client"][0];
                $confirm = $task["confirm"] ?? null;
                $description = $data["Description"] ?? null;
                $priority = $data["Priorité"];
                $subject = $data["Sujet"];
                $state = $data["État"];
                $tags = $data["Tags"] ?? null;
                $types = $data["Type"];

                $linked_tables = [0, 1, 2];
                $user_success_message = "Le ticket a bien été créé !";
                $user_error_message =
                    'La création du ticket n\'a pu aboutir, merci de réessayer ultérieurement.';
                $idclient = intval($client);
                if (!$confirm) {
                    $request = [
                        "query" => "SELECT idticket,subject
                      FROM ticket
                      WHERE idstate != 5 AND about = ?
                      GROUP BY idticket;",
                        "type" => "i",
                        "content" => [$idclient],
                    ];
                    $res = $this->db->request($request);
                    if (is_array($res) && count($res) > 0) {
                        print_r($res);
                        return [
                            "data" => $data,
                            "confirm" => [
                                "content" =>
                                'Cet utilisateur est déjà lié à d\'autres tickets ouverts, souhaitez-vous en créer un nouveau ou consulter les tickets existant ?',
                            ],
                        ];
                    }
                }
                $idass = intval(substr($assignee, 2));
                if (str_starts_with($assignee, "u_")) {
                    $this->db->request([
                        "query" => 'INSERT INTO ticket (subject,description,about,isfrom,iduser,idgroup,idstate,idpriority)
                              VALUES (?,?,?,?,?,(SELECT idgroup FROM user_in_group WHERE iduser = ?),?,?);',
                        "type" => "ssiiiiii",
                        "content" => [
                            $subject,
                            $description,
                            $idclient,
                            $iduser,
                            $idass,
                            $idass,
                            $state,
                            $priority,
                        ],
                    ]);
                } elseif (str_starts_with($assignee, "g_")) {
                    $this->db->request([
                        "query" => 'INSERT INTO ticket (subject,description,about,isfrom,idgroup,idstate,idpriority)
                              VALUES (?,?,?,?,?,?,?);',
                        "type" => "ssiiiii",
                        "content" => [
                            $subject,
                            $description,
                            $idclient,
                            $iduser,
                            $idass,
                            $state,
                            $priority,
                        ],
                    ]);
                }
                $ticket = $this->db->request([
                    "query" =>
                    'SELECT MAX(idticket) "idticket" FROM ticket WHERE about = ? AND isfrom = ? AND subject = ?',
                    "type" => "iis",
                    "content" => [$idclient, $iduser, $subject],
                ]);
                $idticket = $ticket[0]["idticket"];
                $chatName = "T#" . $idticket;
                $idchat = $this->createChat($chatName);
                $this->db->request([
                    "query" =>
                    "UPDATE ticket SET idchat = ? WHERE idticket = ?",
                    "type" => "ii",
                    "content" => [$idchat, $idticket],
                ]);
                $this->db->request([
                    "query" =>
                    "INSERT INTO ticket_has_type (idticket,idticket_type) VALUES (?,?);",
                    "type" => "ii",
                    "content" => [$idticket, $types],
                ]);
                // later tickets may have more than one type :

                // foreach ($types as $type) {
                //     $stmt = $mysqli->prepare(
                //         'INSERT INTO ticket_has_type (idticket,idtype) VALUES ((SELECT LAST_INSERT_ID()),?);'
                //     );
                //     $stmt->bind_param('i', $type['data-select']);
                // }
                if ($tags) {
                    foreach ($tags as $tag) {
                        $this->db->request([
                            "query" =>
                            "INSERT INTO ticket_has_tag (idticket,idtag) VALUES (?,?);",
                            "type" => "ii",
                            "content" => [$idticket, intVal($tag)],
                        ]);
                    }
                }
                $res = $this->db->request([
                    "query" => 'SELECT idticket AS "data-select", subject AS "content", ? AS "success"
                  FROM ticket
                  WHERE idticket = ?;',
                    "type" => "si",
                    "content" => [$user_success_message, $idticket],
                ]);
                $res[0]["tables"] = $linked_tables;
                return $res[0];
            }

            /////////////////////////////////////////////////////
            // CREATE CONTACT (10)
            /////////////////////////////////////////////////////

            if ($f === 10) {
                $first_name = $data["Prénom"];
                $last_name = $data["Nom"];
                $email = $data["Adresse email"];
                $phone_number = $data["Téléphone portable"] ?? null;
                $address_1 = $data["Numéro et voie"] ?? null;
                $address_2 = $data["Code postal"] ?? null;
                $address_3 = $data["Ville"] ?? null;
                $img = $data["img"] ?? null;
                $corp = $data["Société"][0] ?? null;
                $tags = $data["Tags"] ?? null;

                $user_success_message =
                    "Le contact " .
                    $first_name .
                    " " .
                    $last_name .
                    " a bien été créé !";
                $user_error_message =
                    'La création du contact n\'a pu aboutir, merci de réessayer ultérieurement.';

                // create client
                $this->db->request([
                    "query" =>
                    "INSERT INTO user (first_name,last_name,email,phone_number,address_1,address_2,address_3,image) VALUES (?,?,?,?,?,?,?,?);",
                    "type" => "ssssssss",
                    "content" => [
                        $first_name,
                        $last_name,
                        $email,
                        $phone_number,
                        $address_1,
                        $address_2,
                        $address_3,
                        $img,
                    ],
                ]);
                // get iduser
                $res = $this->db->request([
                    "query" => "SELECT iduser FROM user WHERE email=?;",
                    "type" => "s",
                    "content" => [$email],
                ]);
                $iduser = $res[0]["iduser"];
                // set role = 11 (client)
                $this->db->request([
                    "query" =>
                    "INSERT INTO user_has_role (iduser,idrole) VALUES (?,11);",
                    "type" => "i",
                    "content" => [$iduser],
                ]);
                if ($corp !== null) {
                    $this->db->request([
                        "query" =>
                        "INSERT INTO user_is_from (iduser,idcorp) VALUES (?,?);",
                        "type" => "ii",
                        "content" => [
                            $iduser,
                            intval($corp["data-select"]),
                        ],
                    ]);
                }
                if ($tags !== null) {
                    foreach ($tags as $tag) {
                        $this->db->request([
                            "query" =>
                            "INSERT INTO user_has_tag (iduser, idtag) VALUES (?, ?);",
                            "type" => "ii",
                            "content" => [
                                $iduser,
                                intval($tag["data-select"]),
                            ],
                        ]);
                    }
                }
                $res = $this->db->request([
                    "query" =>
                    'SELECT iduser AS "id",CONCAT_WS(" ",last_name,first_name) AS "name",email, ? AS "success" FROM user WHERE iduser = ?;',
                    "type" => "ss",
                    "content" => [$user_success_message, $iduser],
                ]);
                return $res[0];
            }

            /////////////////////////////////////////////////////
            // CREATE COMPANY (11)
            /////////////////////////////////////////////////////

            if ($f === 11) {
                $name = $data["Nom"];
                $email = $data["Adresse email"];
                $phone_number = $data["Téléphone portable"] ?? null;
                $address_1 = $data["Numéro et voie"] ?? null;
                $address_2 = $data["Code postal"] ?? null;
                $address_3 = $data["Ville"] ?? null;
                $img = $data["img"] ?? null;
                $tags = $data["Tags"] ?? null;
                $employees = $data["Employés"] ?? null;

                $user_success_message =
                    'L\'entreprise ' . $name . " a bien été créée !";
                $user_error_message =
                    'La création de l\'entreprise n\'a pu aboutir, merci de réessayer ultérieurement.';

                // create corp
                $this->db->request([
                    "query" =>
                    "INSERT INTO corp (name,email,phone_number,address_1,address_2,address_3,img) VALUES (?,?,?,?,?,?,?);",
                    "type" => "sssssss",
                    "content" => [
                        $name,
                        $email,
                        $phone_number,
                        $address_1,
                        $address_2,
                        $address_3,
                        $img,
                    ],
                ]);
                // add tags
                if ($tags !== null) {
                    foreach ($tags as $tag) {
                        $this->db->request([
                            "query" =>
                            "INSERT INTO corp_has_tag (idcorp, idtag) VALUES ((SELECT idcorp FROM corp WHERE name = ?), ?);",
                            "type" => "si",
                            "content" => [
                                $name,
                                intval($tag["data-select"]),
                            ],
                        ]);
                    }
                }
                if ($employees !== null) {
                    foreach ($employees as $employee) {
                        $iduser = intval($employee["data-select"]);
                        $this->db->request([
                            "query" => "INSERT INTO user_is_from (iduser, idcorp) VALUES (?, (SELECT idcorp FROM corp WHERE name = ?))",
                            "type" => "is",
                            "content" => [$iduser, $name],
                        ]);
                    }
                }
                $res = $this->db->request([
                    "query" =>
                    'SELECT name, idcorp AS "id", email, ? AS "success" FROM corp WHERE name = ?',
                    "type" => "ss",
                    "content" => [$user_success_message, $name],
                ]);
                return $res[0];
            }

            /////////////////////////////////////////////////////
            // CREATE TAG (12)
            /////////////////////////////////////////////////////

            if ($f === 12) {
                $user_error_message =
                    'La création du tag n\'a pu aboutir, merci de réessayer ultérieurement.';
                $this->db->request([
                    "query" => "INSERT INTO tag (name) VALUES (?);",
                    "type" => "s",
                    "content" => [$task["t"]],
                ]);
                $res = $this->db->request([
                    "query" => 'SELECT idtag AS "id" FROM tag WHERE name = ?;',
                    "type" => "s",
                    "content" => [$task["t"]],
                ]);
                return $res[0];
            }

            /////////////////////////////////////////////////////
            // FETCH TICKET DATA (13)
            /////////////////////////////////////////////////////

            if ($f === 13) {
                if (isset($task["i"])) {
                    // $user_error_message =
                    //     "Le ticket n'a pu être chargé, merci de rééssayer d'ici quelques instants.";
                    // get ticket data
                    $query = 'SELECT JSON_OBJECT(
                            "subject",subject,
                            "description",description,
                            "idstate",idstate,
                            "idpriority",idpriority,
                            "modified",DATE_FORMAT(ticket.modified, "%d/%m/%Y"),
                            "idtype",JSON_EXTRACT(
                                CONCAT(
                                    "[",GROUP_CONCAT(
                                        DISTINCT JSON_OBJECT(
                                            "idticket_type",ticket_has_type.idticket_type
                                        )
                                    ),"]"
                                ),"$"
                            ),
                            "tags",JSON_EXTRACT(
                                CONCAT(
                                    "[",GROUP_CONCAT(
                                        DISTINCT JSON_OBJECT(
                                            "data-select",tag.idtag,"content",tag.name
                                        )
                                    ),"]"
                                ),"$"
                            )
                        ) "ticket",
                        JSON_EXTRACT(
                            CONCAT(
                                "[",JSON_OBJECT(
                                    "data-select",IFNULL(
                                        CONCAT(
                                            "u_",ticket.iduser
                                        ),CONCAT(
                                            "g_",ticket.idgroup
                                        )
                                    ),
                                    "content", CONCAT_WS(
                                        " ",user.last_name,user.first_name
                                    ),
                                    "group",user_group.name
                                ),"]"
                            ),"$"
                        ) "assignee",
                        JSON_EXTRACT(
                            CONCAT(
                                "[",JSON_OBJECT(
                                    "data-select",ticket.about,
                                    "content",CONCAT_WS(
                                        " ",tfuser.last_name,tfuser.first_name
                                    ),
                                    "image",tfuser.image
                                ),"]"
                            ),"$"
                        ) "client",
                        JSON_EXTRACT(
                            CONCAT(
                                "[",JSON_OBJECT(
                                    "data-select",userco.idcorp
                                    ,"content",userco.name
                                    
                                ),"]"
                            ),"$"
                        ) "corp",
                        idchat "chat",chat.name "chat_name"
                        FROM ticket
                        LEFT JOIN ticket_has_type USING (idticket)
                        LEFT JOIN user ON ticket.iduser = user.iduser
                        LEFT JOIN user_in_group ON ticket.iduser = user_in_group.iduser
                        LEFT JOIN user_group ON ticket.idgroup = user_group.idgroup
                        LEFT JOIN ticket_has_tag USING (idticket)
                        LEFT JOIN tag USING (idtag)
                        LEFT JOIN chat USING (idchat)
                        LEFT JOIN message USING (idchat)
                        LEFT JOIN user tfuser ON ticket.about = tfuser.iduser
                        LEFT JOIN user_is_from ON tfuser.iduser = user_is_from.iduser
                        LEFT JOIN corp userco ON user_is_from.idcorp = userco.idcorp
                        WHERE idticket=?
                        GROUP BY idticket;';
                    $fetch = $this->db->request([
                        "query" => $query,
                        "type" => "i",
                        "content" => [$task["i"]],
                    ]);
                    $res = [
                        "ticket" => json_decode($fetch[0]["ticket"]),
                        "assignee" => json_decode(
                            $fetch[0]["assignee"]
                        ),
                        "client" => json_decode($fetch[0]["client"]),
                        "corp" => json_decode($fetch[0]["corp"]),
                        "chat" => [
                            "id" => $fetch[0]["chat"],
                        ],
                    ];
                    $chatData = $this->userJoins($iduser, $res["chat"]["id"]);

                    // send user chat data
                    if ($chatData["user"]) {
                        foreach ($chatData["user"] as $value) {
                            $this->serv->push(
                                $value,
                                json_encode([
                                    "f" => 14,
                                    "chat" => [
                                        "id" => $chatData["id"],
                                        "content" => $chatData["content"],
                                        "name" => $chatData["name"],
                                        "participants" => $this->setUsersList(
                                            $chatData["list"],
                                            $iduser
                                        ),
                                    ],
                                ])
                            );
                        }
                    }
                    // send participants userlist update
                    foreach ($chatData["other"] as $row) {
                        $this->serv->push(
                            $row["fd"],
                            json_encode([
                                "f" => 19,
                                "chat" => [
                                    "id" => $chatData["id"],
                                    "name" => $chatData["name"],
                                    "participants" => $this->setUsersList(
                                        $chatData["list"],
                                        $row["iduser"]
                                    ),
                                ],
                            ])
                        );
                    }
                    return $res;
                }
            }

            /////////////////////////////////////////////////////
            // JOIN CHAT (14)
            /////////////////////////////////////////////////////

            if (
                $f === 14 &&
                $task["i"]
                // && isset($task["z"])
            ) {
                $chatData = $this->userJoins($iduser, $task["i"]);
                // send user chat data
                $user = $chatData["user"] ?? [$fd];
                foreach ($user as $session) {
                    $this->serv->push(
                        $session,
                        // $chatData["user"],
                        json_encode([
                            "f" => 14,
                            "chat" => [
                                "id" => $chatData["id"],
                                "content" => $chatData["content"],
                                "name" => $chatData["name"],
                                "participants" => $this->setUsersList(
                                    $chatData["list"],
                                    $iduser
                                ),
                            ],
                            // "z" => $task["z"],
                        ])
                    );
                }
                // send participants userlist update
                foreach ($chatData["other"] as $row) {
                    $this->serv->push(
                        $row["fd"],
                        json_encode([
                            "f" => 19,
                            "chat" => [
                                "id" => $task["i"],
                                "participants" => $this->setUsersList(
                                    $chatData["list"],
                                    $row["iduser"]
                                ),
                            ],
                        ])
                    );
                }
                return;
            }

            /////////////////////////////////////////////////////
            // TYPING IN CHAT (15)
            /////////////////////////////////////////////////////

            if ($f === 15 && $task["i"]) {
                $fds = $this->getChatUsersFd($task["i"], $iduser);
                foreach ($fds as $fd) {
                    $this->serv->push(
                        $fd["fd"],
                        json_encode([
                            "f" => 15,
                            "idchat" => $task["i"],
                            "iduser" => $iduser,
                        ])
                    );
                }
                return;
                // for user of users
                // send user notification that user is typing until server says ortherwise.
                // user side, if this chat is shown, display typing info, or display on chat tab if present
                // timer 5 sec
                // if no typing info received in five sec, send users user ended typing
            }

            /////////////////////////////////////////////////////
            // SEND MESSAGE TO CHAT (16)
            /////////////////////////////////////////////////////

            if ($f === 16 && $task["i"] && $task["m"]) {
                $mess = $this->addMessage($iduser, $task["i"], $task["m"]);
                $users = $mess["users"];
                unset($mess["users"]);
                foreach ($users as $user) {
                    $this->serv->push(
                        $user["fd"],
                        json_encode([
                            "response" => $mess,
                            "f" => 16,
                            "i" => $task["i"],
                        ])
                    );
                }
                return;
            }

            /////////////////////////////////////////////////////
            // USER CHAT REQUEST HANDLING (17)
            /////////////////////////////////////////////////////

            if ($f === 17) {
                if (isset($task["i"])) {
                    $sender = self::getUserInfo($iduser);
                    $chat = $task["c"] ?? $this->createChat("new");
                    foreach ($task["i"] as $recipient) {
                        $recipient = self::getUserFd($recipient);
                        if ($recipient) {
                            // if multiple sessions, send request to each one, and close request on all sessions when accepted or refused on one of them.
                            $role = strtolower($sender["role"]);
                            foreach ($recipient as $session) {
                                $this->serv->push(
                                    $session,
                                    json_encode([
                                        "f" => 17,
                                        "response" => [
                                            "type" => "request",
                                            "sender" => $iduser,
                                            "success" => "{$sender["name"]} ({$role}) souhaite vous inviter dans une discussion instantannée.",
                                            "chat" => $chat,
                                        ],
                                    ])
                                );
                            }
                            return [
                                "type" => "success",
                                "success" =>
                                'Requête transmise à l\'utilisateur.',
                                "chat" => $chat,
                            ];
                        } else {
                            return [
                                "type" => "fail",
                                "fail" =>
                                'L\'utilisateur n\'est pas connecté actuellement.',
                                "error" => "No session found for user {$task["i"]}.",
                            ];
                        }
                    }
                } elseif (isset($task["j"])) {
                    // response, j=0:refusal,j=1:postpone,j=2:accept
                    if ($task["j"] === 2) {
                        // if getusersinchat false, insert task['u'] in chat
                        if (!$this->getChatUsersFd($task["c"])) {
                            // insert host in chat
                            $chatData = $this->userJoins($task["u"], $task["c"]);
                            foreach ($chatData["user"] as $session) {
                                $this->serv->push(
                                    $session,
                                    json_encode([
                                        "f" => 14,
                                        "chat" => [
                                            "id" => $chatData["id"],
                                            "content" => $chatData["content"],
                                            "name" => $chatData["name"],
                                            "participants" => $this->setUsersList(
                                                $chatData["list"],
                                                $task["u"]
                                            ),
                                        ],
                                    ])
                                );
                            }
                        }

                        // if (isset($task["c"])) {
                        $chatData = $this->userJoins($iduser, $task["c"]);
                        $user = $chatData["user"] ?? [$fd];
                        foreach ($user as $session) {
                            $this->serv->push(
                                $session,
                                json_encode([
                                    "f" => 14,
                                    "chat" => [
                                        "id" => $chatData["id"],
                                        "content" => $chatData["content"],
                                        "name" => $chatData["name"],
                                        "participants" => $this->setUsersList(
                                            $chatData["list"],
                                            $iduser
                                        ),
                                    ],
                                ])
                            );
                        }
                        // send participants userlist update
                        foreach ($chatData["other"] as $row) {
                            $this->serv->push(
                                $row["fd"],
                                json_encode([
                                    "f" => 19,
                                    "chat" => [
                                        "id" => $chatData["id"],
                                        "participants" => $this->setUsersList(
                                            $chatData["list"],
                                            $row["iduser"]
                                        ),
                                    ],
                                ])
                            );
                        }
                    } elseif ($task["j"] === 0) {
                        $type = "refused";
                    } elseif ($task["j"] === 1) {
                        $type = "delayed";
                    }
                    $users = [
                        ...$this->getUserFd($task["u"]),
                        ...array_filter($this->getUserFd($iduser), function (
                            $v
                        ) use ($fd) {
                            return $v !== $fd;
                        }),
                    ];
                    foreach ($users as $session) {
                        $this->serv->push(
                            $session,
                            json_encode([
                                "f" => 17,
                                "response" => [
                                    "type" => $type,
                                    "issuer" => $iduser,
                                ],
                            ])
                        );
                    }
                }
            }

            /////////////////////////////////////////////////////
            // USER JOINS CHAT (18)
            /////////////////////////////////////////////////////

            if ($f === 18) {
            }

            /////////////////////////////////////////////////////
            // USER LEAVES CHAT (19)
            /////////////////////////////////////////////////////

            if ($f === 19 && $task["i"]) {
                $chatData = $this->userLeaves($iduser, $task["i"]);
                foreach ($chatData["deserter"] as $deserter) {
                    $this->serv->push(
                        $deserter,
                        json_encode([
                            "f" => 19,
                            "chat" => [
                                "id" => $task["i"],
                                "deserted" => true,
                            ],
                        ])
                    );
                }
                if (isset($chatData["users"])) {
                    foreach ($chatData["users"] as $row) {
                        $this->serv->push(
                            $row["fd"],
                            json_encode([
                                "f" => 19,
                                "chat" => [
                                    "id" => $task["i"],
                                    "participants" => $this->setUsersList(
                                        $chatData["list"],
                                        $row["iduser"]
                                    ),
                                ],
                            ])
                        );
                    }
                }
                return;
            }

            /////////////////////////////////////////////////////
            // FETCH TAB DATA (20)
            /////////////////////////////////////////////////////

            if ($f === 20 && $task["i"]) {
                // check if iduser has right to load tab
                $res = $this->db->request([
                    "query" =>
                    "SELECT COUNT(*) FROM user_has_role LEFT JOIN role_has_tab USING (idrole) WHERE iduser = ? AND idtab = ?;",
                    "type" => "ii",
                    "content" => [$iduser, $task["i"]],
                    "array" => true,
                ]);
                if ($res[0][0] > 0) {
                    return $this->tabs[$task["i"]];
                } else {
                    return [
                        "error" => "Forbidden content.",
                        "fail" => "Vous n'avez pas accès à ce contenu.",
                    ];
                }
            }

            /////////////////////////////////////////////////////
            // FETCH CALDAV DATA (21)
            /////////////////////////////////////////////////////

            if ($f === 21 && 0 === 1) {
                // check if user has calendar, get calendars title & role
                $res = $this->db->request([
                    'query' => 'SELECT name,role FROM user_has_caldav LEFT JOIN caldav USING (idcaldav) WHERE iduser = ?;',
                    'type' => 'i',
                    'content' => [$iduser],
                    'array' => true,
                ]);
                // fetch events/tasks from period
                if (isset($res[0])) {
                    $response = [];
                    foreach ($res as $cal) {
                        $this->caldav->setCalendar($this->calendars[$cal[0]]);
                        $response[] = [
                            'events' => $this->caldav->getEvents($task['start'] ?? null, $task['end'] ?? null),
                            'name' => $cal[0],
                            'role' => $cal[1],
                        ];
                    }
                }
                // send data
                return $response;
            }

            /////////////////////////////////////////////////////
            // ADD CALDAV EVENT (22)
            /////////////////////////////////////////////////////

            /////////////////////////////////////////////////////
            // UPDATE CALDAV EVENT (23)
            /////////////////////////////////////////////////////

            /////////////////////////////////////////////////////
            // REMOVE CALDAV EVENT (24)
            /////////////////////////////////////////////////////

            /////////////////////////////////////////////////////
            // CREATE CALDAV CALENDAR (25)
            /////////////////////////////////////////////////////

            /////////////////////////////////////////////////////
            // ADD EXISTING CALDAV (26)
            /////////////////////////////////////////////////////

            /////////////////////////////////////////////////////
            // SHARE CALDAV (27)
            /////////////////////////////////////////////////////

            /////////////////////////////////////////////////////
            // FETCH boptable DATA (2501)
            /////////////////////////////////////////////////////

            if ($f === 2501) {
                if ($task["t"] === 0) {
                    // get tickets data
                    $result = $this->db->request([
                        "query" => 'SELECT idticket, iduser, idgroup, isfrom, about, subject, idstate, idpriority, modified, created
                    FROM ticket
                    WHERE idstate!=5
                    GROUP BY idticket
                    ORDER BY idticket;',
                        "array" => true,
                    ]);
                    $tickets = [];
                    $idtickets = [];
                    $idusers = [];
                    array_map(
                        function ($value) use (
                            &$tickets,
                            &$idtickets,
                            &$idusers
                        ) {
                            $tickets[$value[0]] = $value;
                            $idtickets[] = $value[0];
                            array_map(
                                function ($i) use ($value, &$idusers) {
                                    if (
                                        isset($value[$i]) &&
                                        !in_array($value[$i], $idusers)
                                    ) {
                                        $idusers[] = $value[$i];
                                    }
                                },
                                // ["iduser", "isfrom", "about"]
                                [1, 3, 4]
                            );
                        },
                        $result
                    );
                    $response = [
                        "cols" => [
                            "0" => [
                                "action" => [
                                    "dblclick" =>
                                    "()=>loadTicket(parseInt(rowData[col.id]))",
                                ],
                                "id" => 0,
                                "name" => "#",
                                "width" => "1.5rem",
                            ],
                            "1" => [
                                "id" => 1,
                                "name" => "iduser",
                                "options" => "users",
                                "sortby" => 1,
                                "width" => "0fr",
                            ],
                            "2" => [
                                "id" => 2,
                                "name" => "idgroup",
                                "options" => "groups",
                                "width" => "0fr",
                            ],
                            "3" => [
                                "id" => 3,
                                "name" => "isfrom",
                                "options" => "users",
                                "width" => "0fr",
                            ],
                            "4" => [
                                "id" => 4,
                                "name" => "about",
                                "options" => "users",
                                "sortby" => 1,
                            ],
                            "5" => [
                                "id" => 5,
                                "name" => "subject",
                            ],
                            "6" => [
                                "groupby" => 0,
                                "id" => 6,
                                "name" => "idstate",
                                "options" => "states",
                                "sorting" => 0,
                            ],
                            "7" => [
                                // "groupby" => 2,
                                "id" => 7,
                                "name" => "idpriority",
                                "options" => "priorities",
                                "width" => "0fr",
                            ],
                            "8" => [
                                // "groupby" => 1,
                                "id" => 8,
                                "name" => "modified",
                                "width" => "0fr",
                            ],
                            "9" => [
                                "id" => 9,
                                "name" => "created",
                                "width" => "0fr",
                            ],
                            "10" => [
                                "id" => 10,
                                "multi" => true,
                                "name" => "types",
                                "options" => "types",
                            ],
                            "11" => [
                                "id" => 11,
                                "multi" => true,
                                "name" => "tags",
                                "options" => "tags",
                                "sortby" => 1,
                            ],
                        ],
                        "tickets" => $tickets,
                    ];
                    $idtickets = implode(",", $idtickets);
                    $idusers = implode(",", $idusers);

                    //////////////////////
                    // get ticket_has_type
                    //////////////////////
                    $result = $this->db->request([
                        "query" => "SELECT idticket,idticket_type FROM ticket_has_type WHERE idticket IN ($idtickets);",
                        "array" => true,
                    ]);
                    if ($result) {
                        array_map(function ($value) use (&$response) {
                            $response["tickets"][$value[0]][10][] = $value[1];
                        }, $result);
                    }

                    //////////////////////
                    // get ticket_has_tag
                    //////////////////////
                    $result = $this->db->request([
                        "query" => "SELECT idticket,idtag FROM ticket_has_tag WHERE idticket IN ($idtickets);",
                        "array" => true,
                    ]);
                    $tags = [];
                    if ($result) {
                        array_map(function ($value) use (&$response, &$tags) {
                            $response["tickets"][$value[0]][11][] = $value[1];
                            $tags[] = $value[1];
                        }, $result);
                    }

                    //////////////////////
                    // get ticket states
                    //////////////////////
                    $result = $this->db->request([
                        "query" => "SELECT idstate,name FROM state;",
                        "array" => true,
                    ]);
                    array_map(function ($value) use (&$response) {
                        $response["options"]["states"][$value[0]]["name"] =
                            $value[1];
                    }, $result);

                    //////////////////////
                    // get priorities
                    //////////////////////
                    $result = $this->db->request([
                        "query" => "SELECT idpriority,name FROM priority;",
                        "array" => true,
                    ]);
                    array_map(function ($value) use (&$response) {
                        $response["options"]["priorities"][$value[0]]["name"] =
                            $value[1];
                    }, $result);

                    //////////////////////
                    // get ticket types
                    //////////////////////
                    $result = $this->db->request([
                        "query" =>
                        "SELECT idticket_type,name FROM ticket_type;",
                        "array" => true,
                    ]);
                    array_map(function ($value) use (&$response) {
                        $response["options"]["types"][$value[0]]["name"] =
                            $value[1];
                    }, $result);

                    //////////////////////
                    // get groups
                    //////////////////////
                    $result = $this->db->request([
                        "query" => "SELECT idgroup,name FROM user_group;",
                        "array" => true,
                    ]);
                    array_map(function ($value) use (&$response) {
                        $response["options"]["groups"][$value[0]]["name"] =
                            $value[1];
                    }, $result);

                    //////////////////////
                    // get tags
                    //////////////////////
                    if (count($tags) > 0) {
                        $tags = implode(",", $tags);
                        $result = $this->db->request([
                            "query" => "SELECT idtag,name FROM tag WHERE idtag IN ($tags)",
                            "array" => true,
                        ]);
                        array_map(function ($value) use (&$response) {
                            $response["options"]["tags"][$value[0]]["name"] =
                                $value[1];
                        }, $result);
                    }

                    //////////////////////
                    // get users data
                    //////////////////////
                    $result = $this->db->request([
                        "query" => "SELECT iduser,CONCAT_WS(' ',first_name,last_name) FROM user WHERE iduser IN ($idusers);",
                        "array" => true,
                    ]);
                    array_map(function ($value) use (&$response) {
                        $response["options"]["users"][$value[0]]["name"] =
                            $value[1];
                    }, $result);

                    //////////////////////
                    // get user_in_group
                    //////////////////////
                    $result = $this->db->request([
                        "query" => "SELECT iduser,idgroup FROM user_in_group WHERE iduser IN ($idusers);",
                        "array" => true,
                    ]);
                    if ($result) {
                        array_map(function ($value) use (&$response) {
                            $response["options"]["users"][$value[0]]["groups"][] = $value[1];
                        }, $result);
                    }
                    //////////////////////
                    // get companies data
                    //////////////////////
                    $result = $this->db->request([
                        "query" => "SELECT iduser,idcorp FROM user_is_from WHERE iduser IN ($idusers);",
                        "array" => true,
                    ]);
                    $idcorps = [];
                    if (!empty($result)) {
                        array_map(function ($value) use (&$idcorps) {
                            if (
                                isset($value[1]) &&
                                !in_array($value[1], $idcorps)
                            ) {
                                $idcorps[] = $value[1];
                            }
                            // addIfNotNullNorExists($value[1], $idcorps);
                        }, $result);
                        $idcorps = implode(",", $idcorps);
                        $result = $this->db->request([
                            "query" => "SELECT idcorp,name FROM corp WHERE idcorp IN ($idcorps);",
                            "array" => true,
                        ]);
                        array_map(function ($value) use (&$response) {
                            $response["options"]["corps"][$value[0]]["name"] =
                                $value[1];
                        }, $result);
                    }
                    array_map(function ($value) use (&$response) {
                        $response["rows"][] = $value;
                    }, $response["tickets"]);
                    unset($response["tickets"]);
                } elseif ($task["t"] === 1) {
                    // get items data
                    $res = $this->db->request([
                        "query" =>
                        "SELECT iditem,ref,name,frtitle,version,label,published,stock,nostockorder,price,idtracklist,created,modified FROM item;",
                        "array" => true,
                    ]);
                    $items = [];
                    foreach ($res as $item) {
                        $items[$item[0]] = $item;
                        $items[$item[0]][13] = [];
                        $items[$item[0]][14] = [];
                        $items[$item[0]][15] = false;
                        $items[$item[0]][16] = [];
                        $items[$item[0]][17] = [];
                        $items[$item[0]][18] = [];
                        $items[$item[0]][19] = [];
                        $items[$item[0]][20] = [];
                        $items[$item[0]][21] = [];
                        $items[$item[0]][22] = [];
                        $items[$item[0]][23] = [];
                    }
                    $response = [
                        "cols" => [
                            "0" => [
                                "id" => 0,
                                "name" => "#",
                                "width" => "0fr",
                            ],
                            "1" => [
                                "id" => 1,
                                "name" => "ref",
                                "width" => "10rem",
                            ],
                            "2" => [
                                "id" => 2,
                                "name" => "name",
                            ],
                            "3" => [
                                "id" => 3,
                                "name" => "fr",
                                "width" => "0fr",
                            ],
                            "4" => [
                                "id" => 4,
                                "name" => "version",
                                "width" => "0fr",
                            ],
                            "5" => [
                                "id" => 5,
                                "name" => "label",
                                "options" => "labels",
                            ],
                            "6" => [
                                "id" => 6,
                                "name" => "published",
                                "width" => "0fr",
                            ],
                            "7" => [
                                "id" => 7,
                                "name" => "stock",
                                "width" => "0fr",
                            ],
                            "8" => [
                                "id" => 8,
                                "name" => "nostockorder",
                                "width" => "0fr",
                            ],
                            "9" => [
                                "id" => 9,
                                "name" => "price",
                                "width" => "0fr",
                            ],
                            "10" => [
                                "id" => 10,
                                "name" => "tracklist",
                                "options" => "tracklists",
                                "width" => "0fr",
                            ],
                            "11" => [
                                "id" => 11,
                                "name" => "created",
                                "width" => "0fr",
                            ],
                            "12" => [
                                "id" => 12,
                                "name" => "modified",
                                "width" => "0fr",
                            ],
                            "13" => [
                                "id" => 13,
                                "name" => "upc",
                                "options" => "upcs",
                                "width" => "0fr",
                            ],
                            "14" => [
                                "id" => 14,
                                "name" => "tags",
                                "options" => "tags",
                                "width" => "0fr",
                            ],
                            "15" => [
                                "id" => 15,
                                "name" => "availability",
                                "structure" =>
                                "cellcontent=celldata?'available':'unavailable'",
                                "width" => "0fr",
                            ],
                            "16" => [
                                "id" => 16,
                                "name" => "supplier data",
                                "structure" =>
                                "for(const value of celldata)get supplier name: availability",
                                "width" => "0fr",
                            ],
                            "17" => [
                                "id" => 17,
                                "name" => "support",
                                "options" => "supports",
                                "width" => "8rem",
                            ],
                            "18" => [
                                "id" => 18,
                                "name" => "format",
                                "options" => "formats",
                                "width" => "8rem",
                            ],
                            "19" => [
                                "id" => 19,
                                "name" => "genre",
                                "options" => "genres",
                                "width" => "0fr",
                            ],
                            "20" => [
                                "id" => 20,
                                "name" => "artist",
                                "options" => "artists",
                                "width" => "0fr",
                            ],
                            "21" => [
                                "id" => 21,
                                "name" => "media type",
                                "options" => "medias",
                                "width" => "0fr",
                            ],
                            "22" => [
                                "id" => 22,
                                "name" => "wade reviews",
                                "structure" => "// link to modal url/review",
                                "width" => "0fr",
                            ],
                            "23" => [
                                "id" => 23,
                                "name" => "bop reviews",
                                "structure" => "// link to modal url/review",
                                "width" => "0fr",
                            ],
                        ],
                        "items" => $items,
                    ];

                    // get labels
                    $labels = [];
                    foreach ($response["items"] as $value) {
                        if (!in_array($value[5], $labels)) {
                            $labels[] = $value[5];
                        }
                    }
                    $labels = implode(",", $labels);
                    $res = $this->db->request([
                        "query" => "SELECT idcorp,name FROM corp WHERE idcorp IN ($labels) ;",
                        "array" => true,
                    ]);
                    if ($res) {
                        foreach ($res as $value) {
                            $response["options"]["labels"][$value[0]]["name"] =
                                $value[1];
                        }
                    }
                    // get tracklists
                    $tracklists = [];
                    foreach ($response["items"] as $value) {
                        if (
                            !in_array($value[10], $tracklists) &&
                            isset($value[10])
                        ) {
                            $tracklists[] = $value[10];
                        }
                    }
                    $tracklists = implode(",", $tracklists);
                    $res = $this->db->request([
                        "query" => "SELECT idtracklist,text FROM tracklist WHERE idtracklist IN ($tracklists);",
                        "array" => true,
                    ]);
                    if ($res) {
                        foreach ($res as $value) {
                            $response["options"]["tracklists"][$value[0]]["name"] = $value[1];
                        }
                    }
                    // get upc
                    $res = $this->db->request([
                        "query" =>
                        "SELECT iditem,idupc,code FROM itemident LEFT JOIN upc USING (idupc) WHERE iditem IS NOT NULL AND idupc IS NOT NULL;",
                        "array" => true,
                    ]);
                    if ($res) {
                        foreach ($res as $upc) {
                            $response["items"][$upc[0]][13][] = $upc[1];
                            $response["options"]["upcs"][$upc[1]]["name"] =
                                $upc[2];
                        }
                    }
                    // get tags
                    $res = $this->db->request([
                        "query" => "SELECT iditem,idtag FROM item_has_tag;",
                        "array" => true,
                    ]);
                    if ($res) {
                        $tags = [];
                        foreach ($res as $value) {
                            $response["items"][$value[0]][14][] = $value[1];
                            $tags[] = $value[1];
                        }
                        $tags = implode(",", $tags);
                        $res = $this->db->request([
                            "query" => "SELECT idtag,name FROM tag WHERE idtag IN ($tags);",
                            "array" => true,
                        ]);
                        foreach ($res as $value) {
                            $response["options"]["tags"][$value[0]]["name"] =
                                $value[1];
                        }
                    }
                    // get supplier availability data
                    $res = $this->db->request([
                        "query" =>
                        "SELECT iditem,idcorpitem,idcorp FROM itemident LEFT JOIN corpitem USING (idcorpitem) WHERE idcorpitem IS NOT NULL AND iditem IS NOT NULL;",
                        "array" => true,
                    ]);
                    if ($res) {
                        $idcorpitems = [];
                        $idcorps = [];
                        $corpitems = [];
                        foreach ($res as $value) {
                            $response["items"][$value[0]][16]["corpitem"]["$value[1]"] = ["id" => $value[1], "idcorp" => $value[2]];
                            $corpitems[$value[1]] = $value[0];
                            if (!in_array($value[1], $idcorpitems)) {
                                $idcorpitems[] = $value[1];
                            }
                            if (!in_array($value[2], $idcorps)) {
                                $idcorps[] = $value[2];
                            }
                        }
                        $idcorpitems = implode(",", $idcorpitems);
                        $idcorps = implode(",", $idcorps);
                        $res = $this->db->request([
                            "query" => "SELECT idcorpitem,idavailability FROM corpitem_has_invstat LEFT JOIN corpinvstat USING (idcorpinvstat) WHERE idcorpitem IN ($idcorpitems);",
                            "array" => true,
                        ]);
                        foreach ($res as $value) {
                            $response["items"][$corpitems[$value[0]]][16]["corpitem"]["$value[0]"]["availability"] = $value[1];
                        }
                        $res = $this->db->request([
                            "query" => "SELECT idcorp,name FROM corp WHERE idcorp IN ($idcorps);",
                            "array" => true,
                        ]);
                        foreach ($res as $value) {
                            $response["options"]["corps"][$value[0]]["name"] =
                                $value[1];
                        }
                        $res = $this->db->request([
                            "query" =>
                            "SELECT idavailability,name FROM availability;",
                            "array" => true,
                        ]);
                        foreach ($res as $value) {
                            $response["options"]["availabilities"][$value[0]]["name"] = $value[1];
                        }
                        // if available at any supplier, set available=true;
                        foreach ($response["items"] as $value) {
                            foreach ($value[16]["corpitem"] as $item) {
                                if (
                                    !$value[15] &&
                                    $item["availability"] !== 1
                                ) {
                                    $response["items"][$value[0]][15] = true;
                                    break;
                                }
                            }
                        }
                    }

                    // get supports
                    $res = $this->db->request([
                        "query" =>
                        "SELECT iditem,idsupport FROM item_has_support;",
                        "array" => true,
                    ]);
                    if ($res) {
                        foreach ($res as $value) {
                            $response["items"][$value[0]][17][] = $value[1];
                        }
                        $res = $this->db->request([
                            "query" => "SELECT idsupport,name FROM support;",
                            "array" => true,
                        ]);
                        foreach ($res as $value) {
                            $response["options"]["supports"][$value[0]]["name"] = $value[1];
                        }
                    }

                    // get formats
                    $res = $this->db->request([
                        "query" =>
                        "SELECT iditem,idformat FROM item_has_format;",
                        "array" => true,
                    ]);
                    if ($res) {
                        $formats = [];
                        foreach ($res as $value) {
                            $response["items"][$value[0]][18][] = $value[1];
                            if (!in_array($value[1], $formats)) {
                                $formats[] = $value[1];
                            }
                        }
                        $formats = implode(",", $formats);
                        $res = $this->db->request([
                            "query" => "SELECT idformat,name FROM format WHERE idformat IN ($formats);",
                            "array" => true,
                        ]);
                        if ($res) {
                            foreach ($res as $value) {
                                $response["options"]["formats"][$value[0]]["name"] = $value[1];
                            }
                        }
                    }

                    // get genres
                    $res = $this->db->request([
                        "query" => "SELECT iditem,idgenre FROM item_has_genre;",
                        "array" => true,
                    ]);
                    if ($res) {
                        $genres = [];
                        foreach ($res as $value) {
                            $response["items"][$value[0]][19][] = $value[1];
                            if (!in_array($value[1], $genres)) {
                                $genres[] = $value[1];
                            }
                        }
                        $genres = implode(",", $genres);
                        $res = $this->db->request([
                            "query" => "SELECT idgenre,name FROM genre WHERE idgenre IN ($genres);",
                            "array" => true,
                        ]);
                        foreach ($res as $value) {
                            $response["options"]["genres"][$value[0]]["name"] =
                                $value[1];
                        }
                    }

                    // get artists
                    $res = $this->db->request([
                        "query" =>
                        "SELECT iditem,idartist FROM item_has_artist;",
                        "array" => true,
                    ]);
                    if ($res) {
                        $artists = [];
                        foreach ($res as $value) {
                            $response["items"][$value[0]][20][] = $value[1];
                            if (!in_array($value[1], $artists)) {
                                $artists[] = $value[1];
                            }
                        }
                        $artists = implode(",", $artists);
                        $res = $this->db->request([
                            "query" => "SELECT idartist,name FROM artist WHERE idartist IN ($artists);",
                            "array" => true,
                        ]);
                        foreach ($res as $value) {
                            $response["options"]["artists"][$value[0]]["name"] =
                                $value[1];
                        }
                    }

                    // get media types
                    $res = $this->db->request([
                        "query" =>
                        "SELECT iditem,idmediatype FROM item_has_mediatype;",
                        "array" => true,
                    ]);
                    $media = [];
                    if ($res) {
                        foreach ($res as $value) {
                            $response["items"][$value[0]][21][] = $value[1];
                            if (!in_array($value[1], $media)) {
                                $media[] = $value[1];
                            }
                        }
                        $media = implode(",", $media);
                        $res = $this->db->request([
                            "query" => "SELECT idmediatype,name FROM mediatype WHERE idmediatype IN ($media);",
                            "array" => true,
                        ]);
                        foreach ($res as $value) {
                            $response["options"]["medias"][$value[0]]["name"] =
                                $value[1];
                        }
                    }

                    //get wades
                    $res = $this->db->request([
                        "query" =>
                        "SELECT iditem,idwadereview,idbopreview FROM item_has_review;",
                        "array" => true,
                    ]);
                    // $wade = [];
                    // $bop = [];
                    if ($res) {
                        foreach ($res as $value) {
                            if ($value[1]) {
                                $response["items"][$value[0]][22] = $value[1];
                            }
                            if ($value[2]) {
                                $response["items"][$value[0]][23] = $value[2];
                            }
                            // if($value[1] && !in_array($value[1],$wade))$wade[]=$value[1];
                            // if($value[2] && !in_array($value[2],$bop))$bop[]=$value[1];
                        }
                    }
                    array_map(function ($value) use (&$response) {
                        $response["rows"][] = $value;
                    }, $response["items"]);
                    unset($response["items"]);
                }
                return $response;
            }
            // incomplete server side version
            if (1 === 0) {
                // $d = isset($task["d"]) && $task["d"] === 1 ? 1 : 0; // direction of the results, 1 = up, 0 = down
                $where = isset($task["p"]) ? implode($task["p"]) : "";
                $limit = isset($task["r"])
                    ? "LIMIT {${intval($task["r"])}}"
                    : ""; // rows to send, 0 = unlimited.
                $order = isset($task["s"])
                    ? "ORDER BY {${implode($task["s"])}}"
                    : "";
                $sortDir =
                    isset($task["v"]) && $task["v"] === 1 ? "DESC" : "ASC"; // sorting direction: 0 ASC, 1 DESC
                $type = "";
                $content = [];
                if ($task["t"] === 0) {
                    // tickets table
                    $tableconf = "";
                    $arrselect = [
                        "idticket",
                        "subject",
                        "state.name",
                        "priority.name",
                        'DATE_FORMAT(ticket.modified, "%d/%m/%Y")',
                        "GROUP_CONCAT(DISTINCT ticket_type.name)",
                        "user_group.name",
                        'CONCAT_WS(" ",user.last_name,user.first_name)',
                        "GROUP_CONCAT(DISTINCT tag.name)",
                        'CONCAT_WS(" ",tfuser.last_name,tfuser.first_name)',
                        "userco.name",
                    ];
                    $from = "ticket";
                    $join = 'LEFT JOIN ticket_has_type USING (idticket)
                    LEFT JOIN ticket_type USING (idticket_type)
                    LEFT JOIN user ON ticket.iduser = user.iduser
                    LEFT JOIN user_in_group ON ticket.iduser = user_in_group.iduser
                    LEFT JOIN user_group ON ticket.idgroup = user_group.idgroup
                    LEFT JOIN state USING (idstate)
                    LEFT JOIN priority USING (idpriority)
                    LEFT JOIN ticket_has_tag USING (idticket)
                    LEFT JOIN tag USING (idtag)
                    LEFT JOIN user tfuser ON ticket.about = tfuser.iduser
                    LEFT JOIN user_is_from ON tfuser.iduser = user_is_from.iduser
                    LEFT JOIN corp userco ON user_is_from.idcorp = userco.idcorp';
                    $group = "idticket";
                    // $count = "SELECT COUNT(*) 'count' FROM ticket";
                }
                $cols = [];
                foreach ($task["c"] as $col) {
                    $cols[] = $arrselect[$col];
                }
                $select = implode($cols);
                $data = $this->db->request([
                    "query" => "SELECT $select
                    FROM $from
                    $join
                    $where
                    GROUP BY $group
                    $order
                    $sortDir
                    $limit;",
                    "type" => $type,
                    "content" => $content,
                    "array" => true,
                ]);
                $ids = $this->db->request([
                    "query" => "SELECT {$arrselect[0]}
                    FROM $from
                    GROUP BY $group
                    $order
                    $sortDir;",
                    // "query" => $count,
                ]);
                return [
                    // "cols" => $cols,
                    "tickets" => $data,
                    "ids" => $ids,
                ];
            }

            /////////////////////////////////////////////////////
            // TOOL (999)
            /////////////////////////////////////////////////////
            if ($f === 999) {
                return $this->tabs[4];
            }
        } catch (\Exception $e) {
            throw $e;
        }
    }
}

// foreach ([$chat] as $value) require_once $value;

$server = new FWServer();
