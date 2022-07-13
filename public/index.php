<?php
$response->header("Content-Type", "text/html; charset=utf-8");
$main =
    '<!DOCTYPE html>
    <html lang="fr">

    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="author" content="Leneveu Romain, romain@seadesk.fr">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="application-name" content="Seadesk">
        <meta name="apple-mobile-web-app-title" content="Seadesk">
        <meta name="msapplication-starturl" content="index.php">

        <title>SeaDesk</title>

        <link rel="stylesheet" href="./assets/css/style.css">
        <link rel="shortcut icon" href="./favicon.ico" type="image/x-icon">

        <script defer src="./assets/js/custom.min.js"></script>
        <script defer src="./assets/js/vendor.min.js"></script>
    </head>
    <body class="loading ' .
    $theme .
    '">
        <div class="login hidden loading">
        </div>
        <nav class="navbar left hidden loading">
        </nav>
        <nav class="topbar hidden loading" ' .
    $session .
    '>
        </nav>
        <div id="chat" class="loading hidden"></div>
        <main class="hidden loading">
        </main>
        <div class="modal-container">
        </div>
        <dialog class="msg fadeout">
            <div>
                <span>Rogntudju !</span>
                <div>
                    <button class="danger">annuler</button>
                    <button class="success">ok</button>
                    <button class="info">more ok</button>
                </div>
            </div>
        </dialog>
    </body>
    </html>';

$response->end($main);
