<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../../core/api.php';

jsonResponse([
    'success'   => true,
    'logged_in' => isset($_SESSION['admin']),
    'admin'     => $_SESSION['admin'] ?? null
]);
