<?php
class DBRequest
{
    private $dbHost = "swoole-mariadb";
    private $dbUser = "avxi1673_helpdesk";
    private $dbPassword = "^#N5Kb@qRWVGs4kkR&vUhGtU8sz6tQ9#Uj2N!Ap%";
    private $dbDatabase = "avxi1673_helpdesk";
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
        try {
            $this->mysqli = new Mysqli(
                $this->dbHost,
                $this->dbUser,
                $this->dbPassword,
                $this->dbDatabase
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