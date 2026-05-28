<?php
header('Content-Type: application/json');

$logs = json_decode(file_get_contents('../storage/logs.json'), true) ?: [];
$links = json_decode(file_get_contents('../storage/links.json'), true) ?: [];

// Balik urutan log supaya yang terbaru di atas
$logs = array_reverse($logs);

// Gabungkan data link untuk informasi target
$enrichedLogs = array_map(function($log) use ($links) {
    foreach ($links as $link) {
        if ($link['id'] === $log['link_id']) {
            $log['target_url'] = $link['target'];
            break;
        }
    }
    return $log;
}, $logs);

echo json_encode($enrichedLogs);
