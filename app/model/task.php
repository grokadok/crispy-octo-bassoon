<?php
// use ContextManager as CM;

function task($post)
{
    try {
        // $post = CM::get("_POST");
        $f = intval($post["f"]);

        /////////////////////////////////////////////////////
        // CHECK MAIL  (3)
        /////////////////////////////////////////////////////

        if ($f === 3 && $post["a"]) {
            $responseType = "text/html; charset=UTF-8";
            $email = $post["a"];
            $fetch = new DBRequest([
                "query" => "SELECT null FROM user WHERE email = ?;",
                "param_type" => "s",
                "param_content" => [$email],
            ]);
            $responseContent = count($fetch->result);
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
                new DBRequest([
                    "query" =>
                        "INSERT INTO user (email,password,phone_number) VALUES (?,?,?);",
                    "param_type" => "sss",
                    "param_content" => [$email, $password, $phone],
                ]);
                new DBRequest([
                    "query" =>
                        "INSERT INTO user_has_role (iduser) VALUES ((SELECT iduser FROM user WHERE email = ?));",
                    "param_type" => "s",
                    "param_content" => [$email],
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
    } catch (Exception $e) {
        throw $e;
    }
}
