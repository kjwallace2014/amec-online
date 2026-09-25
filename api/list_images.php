<?php

require_once __DIR__ . '/../core/config.php';
require_once __DIR__ . '/../core/api.php';
require_once __DIR__ . '/../core/auth.php';

header('Content-Type: application/json');

requireAdmin();

$imagesRoot = realpath(__DIR__ . '/../assets/images');
if ($imagesRoot === false) {
    jsonResponse(['success' => false, 'message' => 'assets/images folder not found'], 404);
}

$allowedExt = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
$images = [];

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($imagesRoot, FilesystemIterator::SKIP_DOTS)
);

foreach ($iterator as $file) {
    if (!$file->isFile()) continue;
    $ext = strtolower(pathinfo($file->getFilename(), PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExt, true)) continue;

    $realPath = $file->getRealPath();
    $relative = 'assets/images' . str_replace('\\', '/', substr($realPath, strlen($imagesRoot)));
    $images[] = $relative;
}

sort($images);

jsonResponse(['success' => true, 'images' => $images]);