<?php

session_start();

require_once __DIR__ . '/../../core/config.php';
require_once __DIR__ . '/../../core/api.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Invalid request method'], 405);
}

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($username) || empty($password)) {
    jsonResponse(['success' => false, 'message' => 'Username and password are required'], 400);
}

$stmt = $pdo->prepare("SELECT id, username, password_hash FROM admins WHERE username = :username LIMIT 1");
$stmt->execute([':username' => $username]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($password, $admin['password_hash'])) {
    jsonResponse(['success' => false, 'message' => 'Invalid username or password'], 401);
}

$_SESSION['admin'] = ['id' => $admin['id'], 'username' => $admin['username']];

jsonResponse(['success' => true, 'admin' => $_SESSION['admin']]);
