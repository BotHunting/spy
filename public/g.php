<?php
require_once '../src/LocationFinder.php';
require_once '../src/helpers.php';

use App\LocationFinder;

if (!isset($_GET['id'])) {
    header('Location: index.php');
    exit;
}

$id = $_GET['id'];
$links = json_decode(file_get_contents('../storage/links.json'), true);
$targetUrl = '';

foreach ($links as $link) {
    if ($link['id'] === $id) {
        $targetUrl = $link['target'];
        break;
    }
}

if (!$targetUrl) {
    die("Link tidak valid atau telah kedaluwarsa.");
}

// Lacak Pengunjung
$finder = new LocationFinder();
$clientIp = $finder->getClientIp();
$locationData = $finder->findLocation($clientIp);

$logEntry = [
    'link_id' => $id,
    'timestamp' => date('Y-m-d H:i:s'),
    'ip' => $clientIp,
    'location' => $locationData,
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
];

$logs = json_decode(file_get_contents('../storage/logs.json'), true);
$logs[] = $logEntry;
file_put_contents('../storage/logs.json', json_encode($logs, JSON_PRETTY_PRINT));

// Redirect ke tujuan asli
header("Location: " . $targetUrl);
exit;
