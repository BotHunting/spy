<?php

/**
 * Format data lokasi untuk tampilan yang lebih informatif dan modern
 */
function formatLocationData($data) {
    if (isset($data['error'])) {
        $errorMessage = 'Unknown error';
        if (is_array($data['error'])) {
            $errorMessage = $data['error']['info'] ?? ($data['error']['type'] ?? 'API Error');
        } else {
            $errorMessage = $data['error'];
        }
        return "
        <div class='alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-25 text-danger d-flex align-items-center mb-0'>
            <i class='fas fa-exclamation-triangle me-3 fs-4'></i>
            <div>
                <h6 class='alert-heading mb-1 fw-bold'>Gagal Mengambil Data</h6>
                <p class='mb-0 small'>$errorMessage</p>
            </div>
        </div>";
    }

    if (isset($data['status']) && $data['status'] === 'fail') {
        return "
        <div class='alert alert-warning bg-warning bg-opacity-10 border-warning border-opacity-25 text-warning d-flex align-items-center mb-0'>
            <i class='fas fa-search-minus me-3 fs-4'></i>
            <div>
                <h6 class='alert-heading mb-1 fw-bold'>Data Tidak Ditemukan</h6>
                <p class='mb-0 small'>".htmlspecialchars($data['message'])."</p>
            </div>
        </div>";
    }

    $city = $data['city'] ?? ($data['city_name'] ?? 'Unknown');
    $region = $data['regionName'] ?? ($data['region_name'] ?? 'Unknown');
    $country = $data['country'] ?? ($data['country_name'] ?? 'Unknown');
    $lat = $data['lat'] ?? ($data['latitude'] ?? '0');
    $lon = $data['lon'] ?? ($data['longitude'] ?? '0');
    $isp = $data['isp'] ?? 'Unknown';
    $ip = $data['query'] ?? ($data['ip'] ?? '-');

    ob_start();
    ?>
    <div class="result-card animate__animated animate__fadeIn">
        <div class="row g-4">
            <div class="col-md-6">
                <div class="data-item d-flex align-items-start">
                    <div class="data-icon"><i class="fas fa-map-marker-alt"></i></div>
                    <div>
                        <div class="data-label">Lokasi Geografis</div>
                        <div class="data-value"><?php echo "$city, $region"; ?></div>
                        <div class="text-muted small"><?php echo $country; ?></div>
                    </div>
                </div>
                <div class="data-item d-flex align-items-start">
                    <div class="data-icon"><i class="fas fa-network-wired"></i></div>
                    <div>
                        <div class="data-label">Alamat IP</div>
                        <div class="data-value"><?php echo htmlspecialchars($ip); ?></div>
                    </div>
                </div>
                <div class="data-item d-flex align-items-start border-0">
                    <div class="data-icon"><i class="fas fa-building"></i></div>
                    <div>
                        <div class="data-label">Internet Service Provider</div>
                        <div class="data-value"><?php echo htmlspecialchars($isp); ?></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="data-item d-flex align-items-start">
                    <div class="data-icon"><i class="fas fa-compass"></i></div>
                    <div>
                        <div class="data-label">Koordinat Presisi</div>
                        <div class="data-value"><?php echo "$lat, $lon"; ?></div>
                    </div>
                </div>
                <div class="data-item d-flex align-items-start">
                    <div class="data-icon"><i class="fas fa-clock"></i></div>
                    <div>
                        <div class="data-label">Zona Waktu</div>
                        <div class="data-value"><?php echo htmlspecialchars($data['timezone'] ?? '-'); ?></div>
                    </div>
                </div>
                <div class="mt-3">
                    <a href="https://www.google.com/maps?q=<?php echo "$lat,$lon"; ?>" target="_blank" class="map-link w-100 text-center">
                        <i class="fas fa-external-link-alt me-2"></i>BUKA DI GOOGLE MAPS
                    </a>
                </div>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

/**
 * Mendapatkan nilai dari .env
 */
function getEnvValue($key, $default = '') {
    static $env = null;
    if ($env === null) {
        $path = __DIR__ . '/../.env';
        if (file_exists($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false) {
                    list($k, $v) = explode('=', $line, 2);
                    $env[trim($k)] = trim($v);
                }
            }
        }
    }
    return $env[$key] ?? $default;
}
