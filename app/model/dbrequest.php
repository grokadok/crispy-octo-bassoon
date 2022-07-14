<?php
class DBRequest
{
    // private $dbHost = $EnvDbHost;
    // private $dbPort = $EnvDbPort;
    // private $dbDatabase = $EnvDbDatabase;
    // private $dbUser = $EnvDbUser;
    // private $dbPassword = $EnvDbPassword;
    private $mysqli;
    public $result;
    // public $num_rows;

    /**
     * Performs a mysqli request with prepared statement.
     * @param array $request Associative array regrouping request parameters.
     * @param boolean $request[array] Forces array as result.
     * @param string $request[query] Bla bla.
     * @param string $request[param_type] Blip bloup.
     * @param array $request[param_content] Pouet tagada.
     */
    public function __construct($request)
    {
        $dbHost = getenv('MYSQL_ADDON_HOST');
        $dbUser = getenv('MYSQL_ADDON_USER');
        $dbPassword = getenv('MYSQL_ADDON_PASSWORD');
        $dbDatabase = getenv('MYSQL_ADDON_DB');
        $dbPort = getenv('MYSQL_ADDON_PORT');
        try {
            $this->mysqli = new Mysqli(
                $dbHost,
                $dbUser,
                $dbPassword,
                $dbDatabase,
                $dbPort,
            );
            $stmt = $this->mysqli->prepare($request["query"]);
            if (
                isset($request["param_type"]) &&
                isset($request["param_content"])
            ) {
                $stmt->bind_param(
                    $request["param_type"],
                    ...$request["param_content"]
                );
            }
            $stmt->execute();
            $result = $stmt->get_result();
            $stmt->close();
            if (str_starts_with($request["query"], "SELECT")) {
                // $res = [];
                $mode = isset($request["array"]) ? MYSQLI_NUM : MYSQLI_ASSOC;
                $res = $result->fetch_all($mode);
            }
            $this->result = $res ?? $result;
            // $this->num_rows = count($this->result);
        } catch (Exception $e) {
            throw $e;
        }
    }
}
