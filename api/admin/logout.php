<?php

session_start();

require_once __DIR__ . '/../../core/api.php';

unset($_SESSION['admin']);

jsonResponse(['success' => true]);
