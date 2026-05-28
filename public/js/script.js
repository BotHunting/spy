document.addEventListener('DOMContentLoaded', function () {
    const myIpBadge = document.getElementById('my-ip-badge');
    const loading = document.getElementById('loading');
    const resultArea = document.getElementById('result-area');
    const geoResult = document.getElementById('geo-result');
    const geoData = document.getElementById('geo-data');
    const logsBody = document.getElementById('logs-body');

    // 1. Fungsi Utility untuk Loading
    function showLoading(show) {
        if (show) loading.classList.remove('d-none');
        else loading.classList.add('d-none');
    }

    // 2. Deteksi IP Sendiri saat Load
    async function detectMyIp() {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            myIpBadge.innerHTML = `<i class="fas fa-shield-alt me-2 text-primary"></i>${data.ip}`;
            return data.ip;
        } catch (err) {
            myIpBadge.innerHTML = `<i class="fas fa-exclamation-triangle me-2 text-warning"></i>Offline / Blocked`;
            return null;
        }
    }
    detectMyIp();

    // 3. Render HTML Hasil Pelacakan
    function renderIntelHTML(data) {
        const ip = data.ip || data.query || 'Unknown';
        const city = data.city || 'Unknown';
        const country = data.country_name || data.country || 'Unknown';
        const isp = data.org || data.isp || 'Unknown';
        const lat = data.latitude || data.lat || 0;
        const lon = data.longitude || data.lon || 0;
        const timezone = data.timezone || '-';

        return `
            <div class="result-card border-primary border-opacity-25 animate__animated animate__fadeInUp">
                <h5 class="fw-bold text-primary mb-4 d-flex align-items-center">
                    <i class="fas fa-user-secret me-2"></i>Hasil Intelijen IP: ${ip}
                </h5>
                <div class="row g-3">
                    <div class="col-sm-6">
                        <div class="data-label">LOKASI GEOGRAFIS</div>
                        <div class="fs-5 text-white fw-semibold"><i class="fas fa-map-marked-alt me-2 text-muted"></i>${city}, ${country}</div>
                    </div>
                    <div class="col-sm-6">
                        <div class="data-label">KOORDINAT PRESISI</div>
                        <div class="fs-5 text-white fw-semibold"><i class="fas fa-compass me-2 text-muted"></i>${lat}, ${lon}</div>
                    </div>
                    <div class="col-sm-6">
                        <div class="data-label">PENYEDIA LAYANAN (ISP)</div>
                        <div class="text-white opacity-75"><i class="fas fa-building me-2 text-muted"></i>${isp}</div>
                    </div>
                    <div class="col-sm-6">
                        <div class="data-label">ZONA WAKTU</div>
                        <div class="text-white opacity-75"><i class="fas fa-clock me-2 text-muted"></i>${timezone}</div>
                    </div>
                </div>
                <div class="mt-4">
                    <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" class="map-link w-100 text-center py-2">
                        <i class="fas fa-external-link-alt me-2"></i>BUKA DI GOOGLE MAPS
                    </a>
                </div>
            </div>`;
    }

    // 4. Logika Penyimpanan Log Lokal (localStorage)
    function saveLog(data, type = 'Manual') {
        const logs = JSON.parse(localStorage.getItem('spy_logs') || '[]');
        const newEntry = {
            id: Date.now(),
            timestamp: new Date().toLocaleString('id-ID'),
            ip: data.ip || data.query || 'Unknown',
            isp: data.org || data.isp || 'Unknown',
            location: `${data.city || 'Unknown'}, ${data.country_name || data.country || 'Unknown'}`,
            coords: `${data.latitude || data.lat || 0}, ${data.longitude || data.lon || 0}`,
            type: type
        };
        logs.unshift(newEntry);
        localStorage.setItem('spy_logs', JSON.stringify(logs.slice(0, 30)));
    }

    // 5. Fungsi Utama Pelacakan (AJAX)
    async function performTrack(targetIp) {
        showLoading(true);
        resultArea.innerHTML = '';
        geoResult.classList.add('d-none');

        // Jika IP kosong, ambil IP sendiri dulu
        let queryIp = targetIp;
        if (!queryIp) {
            queryIp = await detectMyIp();
        }

        if (!queryIp) {
            showLoading(false);
            alert('IP tidak terdeteksi. Silakan ketik IP secara manual.');
            return;
        }

        try {
            // Menggunakan ipapi.co (HTTPS friendly & No Key needed for basic use)
            const response = await fetch(`https://ipapi.co/${queryIp}/json/`);
            const data = await response.json();
            
            showLoading(false);
            if (data.error) {
                resultArea.innerHTML = `<div class="alert alert-danger border-danger border-opacity-25 animate__animated animate__fadeIn"><i class="fas fa-times-circle me-2"></i> Format IP tidak valid atau tidak ditemukan.</div>`;
                return;
            }

            resultArea.innerHTML = renderIntelHTML(data);
            saveLog(data, targetIp ? 'Target Search' : 'Self Track');
        } catch (err) {
            showLoading(false);
            // Fallback ke ip-api.com jika ipapi.co gagal (Note: ip-api.com hanya support HTTP unless paid)
            resultArea.innerHTML = `<div class="alert alert-warning border-warning border-opacity-25">Gagal menghubungi server utama. Pastikan koneksi internet stabil.</div>`;
        }
    }

    // 6. Event Listeners Tab 1 (Tracker)
    document.getElementById('btn-track-ip').addEventListener('click', () => {
        const ip = document.getElementById('ip-to-track').value.trim();
        performTrack(ip);
    });

    document.getElementById('btn-track-me').addEventListener('click', () => performTrack(''));

    document.getElementById('btn-geolocation').addEventListener('click', () => {
        if (!navigator.geolocation) return alert('GPS tidak didukung browser ini.');
        showLoading(true);
        navigator.geolocation.getCurrentPosition(pos => {
            showLoading(false);
            geoResult.classList.remove('d-none');
            const { latitude, longitude } = pos.coords;
            geoData.innerHTML = `
                <div class="row g-4">
                    <div class="col-12">
                        <div class="data-item d-flex align-items-center mb-3">
                            <div class="data-icon bg-info text-info bg-opacity-10"><i class="fas fa-satellite"></i></div>
                            <div>
                                <div class="data-label">KOORDINAT GPS REAL-TIME</div>
                                <div class="fs-4 text-white fw-bold">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</div>
                            </div>
                        </div>
                        <a href="https://www.google.com/maps?q=${latitude},${longitude}" target="_blank" class="map-link bg-info w-100 text-center py-2">
                            <i class="fas fa-map-marked-alt me-2"></i>LIHAT POSISI GPS
                        </a>
                    </div>
                </div>`;
            geoResult.scrollIntoView({ behavior: 'smooth' });
        }, err => {
            showLoading(false);
            alert(`Akses GPS ditolak: ${err.message}`);
        });
    });

    // 7. Event Listeners Tab 2 (Link Generator)
    const btnGenerate = document.getElementById('btn-generate-link');
    const spyUrlResult = document.getElementById('spy-url-result');
    const generatedResult = document.getElementById('generated-result');

    btnGenerate.addEventListener('click', () => {
        const targetUrl = document.getElementById('target-url').value.trim();
        if (!targetUrl || !targetUrl.startsWith('http')) {
            return alert('Masukkan URL lengkap (dengan http:// atau https://)');
        }
        
        const currentUrl = window.location.href.split('?')[0];
        const spyId = Math.random().toString(36).substring(2, 10);
        spyUrlResult.value = `${currentUrl}?id=${spyId}&redir=${encodeURIComponent(targetUrl)}`;
        generatedResult.classList.remove('d-none');
    });

    document.getElementById('btn-copy-link').addEventListener('click', () => {
        spyUrlResult.select();
        document.execCommand('copy');
        alert('Link jebakan berhasil disalin!');
    });

    // 8. Event Listeners Tab 3 (Logs)
    function loadLogs() {
        const logs = JSON.parse(localStorage.getItem('spy_logs') || '[]');
        if (logs.length === 0) {
            logsBody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-muted opacity-50"><i class="fas fa-history d-block fs-1 mb-3"></i>Belum ada aktivitas intelijen.</td></tr>';
            return;
        }

        logsBody.innerHTML = logs.map(log => `
            <tr class="animate__animated animate__fadeIn">
                <td><div class="text-primary small fw-bold">${log.timestamp}</div><div class="extra-small opacity-50">${log.type}</div></td>
                <td><strong>${log.ip}</strong><br><span class="text-muted extra-small text-truncate d-inline-block" style="max-width: 150px;">${log.isp}</span></td>
                <td><span class="small text-white">${log.location}</span></td>
                <td><a href="https://www.google.com/maps?q=${log.coords}" target="_blank" class="btn btn-xs btn-outline-primary"><i class="fas fa-map-marker-alt"></i></a></td>
            </tr>
        `).join('');
    }

    document.getElementById('logs-tab').addEventListener('click', loadLogs);
    document.getElementById('btn-refresh-logs').addEventListener('click', loadLogs);
    document.getElementById('btn-clear-logs').addEventListener('click', () => {
        if (confirm('Hapus semua data intelijen lokal?')) {
            localStorage.removeItem('spy_logs');
            loadLogs();
        }
    });

    // 9. Handle Logika Redirection (Jika link diklik target)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('id') && urlParams.has('redir')) {
        const redirTarget = urlParams.get('redir');
        // Lakukan pelacakan diam-diam sebelum redirect
        fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
                saveLog(data, 'Trap Link Click');
                window.location.href = redirTarget;
            })
            .catch(() => {
                window.location.href = redirTarget;
            });
    }
});
