document.addEventListener('DOMContentLoaded', function() {
    const myIpBadge = document.getElementById('my-ip-badge');
    const loading = document.getElementById('loading');
    const resultArea = document.getElementById('result-area');
    const geoResult = document.getElementById('geo-result');
    const geoData = document.getElementById('geo-data');

    // Detect My IP on Load
    fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => {
            myIpBadge.innerHTML = `<i class="fas fa-shield-alt me-2"></i>${data.ip}`;
        })
        .catch(() => {
            myIpBadge.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i>Detection Failed`;
        });

    function renderLocationHTML(data) {
        const city = data.city || 'Unknown';
        const region = data.regionName || 'Unknown';
        const country = data.country || 'Unknown';
        const isp = data.isp || 'Unknown';
        const lat = data.lat || 0;
        const lon = data.lon || 0;

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
                        <div class="data-item d-flex align-items-start border-0">
                            <div class="data-icon"><i class="fas fa-building"></i></div>
                            <div>
                                <div class="data-label">ISP</div>
                                <div class="data-value">${isp}</div>
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

    function saveToLocalLogs(data, targetUrl = 'Manual Search') {
        const logs = JSON.parse(localStorage.getItem('spy_logs') || '[]');
        const newLog = {
            timestamp: new Date().toLocaleString(),
            ip: data.query || data.ip || 'Unknown',
            isp: data.isp || 'Unknown',
            location: `${data.city || 'Unknown'}, ${data.country || 'Unknown'}`,
            coords: `${data.lat || 0}, ${data.lon || 0}`,
            target: targetUrl
        };
        logs.unshift(newLog);
        localStorage.setItem('spy_logs', JSON.stringify(logs.slice(0, 50))); // Simpan max 50
    }

    function performTrack(ip = '') {
        loading.classList.remove('d-none');
        resultArea.innerHTML = '';
        geoResult.classList.add('d-none');

        const url = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,query`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                loading.classList.add('d-none');
                if (data.status === 'success') {
                    resultArea.innerHTML = renderLocationHTML(data);
                    saveToLocalLogs(data);
                } else {
                    resultArea.innerHTML = `<div class="alert alert-danger">${data.message || 'Error tracking IP'}</div>`;
                }
            })
            .catch(() => {
                loading.classList.add('d-none');
                alert('Gagal menghubungi API. Pastikan tidak ada pemblokir iklan.');
            });
    }

    // Tab 1 Events
    document.getElementById('btn-track-ip').addEventListener('click', () => {
        performTrack(document.getElementById('ip-to-track').value);
    });

    document.getElementById('btn-track-me').addEventListener('click', () => performTrack(''));

    document.getElementById('btn-geolocation').addEventListener('click', () => {
        if (!navigator.geolocation) return alert('GPS tidak didukung');
        loading.classList.remove('d-none');
        navigator.geolocation.getCurrentPosition(pos => {
            loading.classList.add('d-none');
            geoResult.classList.remove('d-none');
            const { latitude, longitude, accuracy } = pos.coords;
            geoData.innerHTML = `
                <div class="row g-4">
                    <div class="col-md-6">
                        <div class="data-item d-flex align-items-start">
                            <div class="data-icon bg-info text-info bg-opacity-10"><i class="fas fa-satellite"></i></div>
                            <div><div class="data-label">Koordinat GPS</div><div class="data-value">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</div></div>
                        </div>
                    </div>
                    <div class="col-12"><a href="https://www.google.com/maps?q=${latitude},${longitude}" target="_blank" class="map-link bg-info w-100 text-center">LIHAT POSISI GPS</a></div>
                </div>`;
        }, err => {
            loading.classList.add('d-none');
            alert(err.message);
        });
    });

    // Tab 2: Link Generator (Simulation)
    const btnGenerate = document.getElementById('btn-generate-link');
    const spyUrlResult = document.getElementById('spy-url-result');
    const generatedResult = document.getElementById('generated-result');

    btnGenerate.addEventListener('click', () => {
        const target = document.getElementById('target-url').value;
        if (!target) return alert('Masukkan URL');
        const fakeId = Math.random().toString(36).substring(7);
        const currentUrl = window.location.href.split('?')[0].split('#')[0];
        spyUrlResult.value = `${currentUrl}?sim_id=${fakeId}&target=${encodeURIComponent(target)}`;
        generatedResult.classList.remove('d-none');
    });

    document.getElementById('btn-copy-link').addEventListener('click', () => {
        spyUrlResult.select();
        document.execCommand('copy');
        alert('Link disalin ke clipboard!');
    });

    // Tab 3: Logs
    const logsBody = document.getElementById('logs-body');
    const loadLogs = () => {
        const logs = JSON.parse(localStorage.getItem('spy_logs') || '[]');
        if (logs.length === 0) {
            logsBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Belum ada riwayat.</td></tr>';
            return;
        }
        logsBody.innerHTML = logs.map(log => `
            <tr>
                <td><div class="text-info small">${log.timestamp}</div></td>
                <td><strong>${log.ip}</strong><br><span class="text-muted extra-small">${log.isp}</span></td>
                <td><span class="small">${log.location}</span></td>
                <td><a href="https://www.google.com/maps?q=${log.coords}" target="_blank" class="btn btn-xs btn-outline-primary"><i class="fas fa-map-marker-alt"></i></a></td>
            </tr>
        `).join('');
    };

    document.getElementById('logs-tab').addEventListener('click', loadLogs);
    document.getElementById('btn-refresh-logs').addEventListener('click', loadLogs);
    document.getElementById('btn-clear-logs').addEventListener('click', () => {
        if (confirm('Hapus semua riwayat lokal?')) {
            localStorage.removeItem('spy_logs');
            loadLogs();
        }
    });

    // Handle Simulation Redirect (Jika link diklik sendiri)
    const params = new URLSearchParams(window.location.search);
    if (params.has('sim_id') && params.has('target')) {
        const target = params.get('target');
        fetch('http://ip-api.com/json/')
            .then(res => res.json())
            .then(data => {
                saveToLocalLogs(data, target);
                window.location.href = target;
            })
            .catch(() => window.location.href = target);
    }
});
