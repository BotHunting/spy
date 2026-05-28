<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$target = $_POST['target'] ?? '';

if (!filter_var($target, FILTER_VALIDATE_URL)) {
    echo json_encode(['error' => 'URL tidak valid. Pastikan menggunakan http:// atau https://']);
    exit;
}

$id = substr(md5(uniqid(rand(), true)), 0, 8);
$newLink = [
    'id' => $id,
    'target' => $target,
    'created_at' => date('Y-m-d H:i:s')
];

$linksFile = '../storage/links.json';
$links = json_decode(file_get_contents($linksFile), true) ?: [];
$links[] = $newLink;
file_put_contents($linksFile, json_encode($links, JSON_PRETTY_PRINT));

// Buat URL Absolut (asumsi menggunakan HTTP_HOST)
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
$baseUrl = $protocol . "://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . "/g.php?id=" . $id;

echo json_encode([
    'success' => true,
    'id' => $id,
    'spy_url' => $baseUrl
]);
