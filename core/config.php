<?php

$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
        $key = trim($key);
        $value = trim($value);
        if ($key !== '' && getenv($key) === false) {
            putenv("$key=$value");
        }
    }
}

function env(string $key, $default = null) {
    $value = getenv($key);
    return $value === false ? $default : $value;
}

$host = $_SERVER['HTTP_HOST'] ?? '';

$isLocal =
    strpos($host, 'localhost') !== false ||
    strpos($host, '127.0.0.1') !== false;

define('APP_ENV', $isLocal ? 'development' : 'production');

$dbHost = trim(env('DB_HOST', 'localhost'));
$dbPort = trim(env('DB_PORT', '5432'));
$dbName = trim(env('DB_NAME', 'amecOnline'));
$dbUser = trim(env('DB_USER', 'postgres'));
$dbPass = trim(env('DB_PASSWORD', ''));

$sslMode = $isLocal ? '' : ';sslmode=require';

$dsn =
    "pgsql:host=$dbHost;" .
    "port=$dbPort;" .
    "dbname=$dbName" .
    $sslMode;

try {

    $pdo = new PDO(
        $dsn,
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE =>
                PDO::ERRMODE_EXCEPTION,

            PDO::ATTR_DEFAULT_FETCH_MODE =>
                PDO::FETCH_ASSOC,

            PDO::ATTR_EMULATE_PREPARES =>
                false,

            PDO::ATTR_TIMEOUT =>
                15
        ]
    );

} catch (PDOException $e) {

    error_log(
        'DATABASE ERROR: ' .
        $e->getMessage()
    );

    die('Database connection failed.');
}
