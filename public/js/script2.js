document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const myIpBadge = document.getElementById('my-ip-badge');
    const ipToTrackInput = document.getElementById('ip-to-track');
    const btnTrackIp = document.getElementById('btn-track-ip');
    const btnTrackMe = document.getElementById('btn-track-me');
    const btnGeolocation = document.getElementById('btn-geolocation');
    
    const targetUrlInput = document.getElementById('target-url');
    const btnGenerateLink = document.getElementById('btn-generate-link');
    const generatedResult = document.getElementById('generated-result');
    const spyUrlResult = document.getElementById('spy-url-result');
    const btnCopyLink = document.getElementById('btn-copy-link');
    
    const logsBody = document.getElementById('logs-body');
    const btnRefreshLogs = document.getElementById('btn-refresh-logs');
    const btnClearLogs = document.getElementById('btn-clear-logs');
    
    const loading = document.getElementById('loading');
    const resultArea = document.getElementById('result-area');
    const geoResult = document.getElementById('geo-result');
    const geoData = document.getElementById('geo-data');

    // State & Init
    let userIp = '';
    initApp();

    function initApp() {
        fetchMyIp();
        renderLogs();
        setupTabs();
    }

    // Fix Bootstrap 5 Pills Tab Toggle behavior manually for dynamic elements if needed
    function setupTabs() {
        const triggerTabList = [].slice.call(document.querySelectorAll('#spyTabs button'));
        triggerTabList.forEach(function (triggerEl) {
            const tabTrigger = new bootstrap.Tab(triggerEl);
            triggerEl.addEventListener('click', function (event) {
                event.preventDefault();
                tabTrigger.show();
            });
        });
    }

    // 1. Ambil IP Pengguna Saat Load Awal via ipapi.co (Sangat Detail & Gratis)
    async function fetchMyIp() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            userIp = data.ip;
            myIpBadge.innerHTML = `<i class="fas fa-shield-alt me-2 text-success"></i>${userIp}`;
        } catch (error) {
            myIpBadge.innerHTML = `<i class="fas fa-exclamation-triangle me-2 text-danger"></i>Gagal Mendeteksi IP`;
        }
    }

    // 2. Fungsi Utama Melacak IP (Bisa IP Sendiri / IP Inputan)
    async function trackIpAddress(ip) {
        showLoading(true);
        resultArea.innerHTML = '';
        geoResult.classList.add('d-none');

        const queryIp = ip.trim() ? ip.trim() : userIp;
        
        if (!queryIp) {
            showLoading(false);
            alert('IP tidak terdeteksi. Silakan ketik IP secara manual.');
            return;
        }

        try {
            const response = await fetch(`https://ipapi.co/${queryIp}/json/`);
            const data = await response.json();

            showLoading(false);

            if (data.error) {
                resultArea.innerHTML = `
                    <div class="alert alert-danger border-danger border-opacity-25 animate__animated animate__fadeIn">
                        <i class="fas fa-times-circle me-2"></i> Format IP tidak valid atau tidak ditemukan.
                    </div>`;
                return;
            }

            // Render Hasil Intelijen ke UI
            resultArea.innerHTML = `
                <div class="result-card border-primary border-opacity-25 animate__animated animate__fadeInUp">
                    <h5 class="fw-bold text-primary mb-4 d-flex align-items-center">
                        <i class="fas fa-user-secret me-2"></i>Hasil Intelijen IP: ${data.ip}
                    </h5>
                    <div class="row g-3">
                        <div class="col-sm-6">
                            <div class="data-label">NEGARA / KOTA</div>
                            <div class="fs-5 text-white fw-semibold"><i class="fas fa-map-marked-alt me-2 text-muted"></i>${data.country_name} - ${data.city || 'N/A'}</div>
                        </div>
                        <div class="col-sm-6">
                            <div class="data-label">INTERNET SERVICE PROVIDER (ISP)</div>
                            <div class="fs-5 text-white fw-semibold"><i class="fas fa-server me-2 text-muted"></i>${data.org || 'N/A'}</div>
                        </div>
                        <div class="col-sm-6">
                            <div class="data-label">KODE POS & TELEPON</div>
                            <div class="text-white-50"><i class="fas fa-envelope me-2"></i>${data.postal || 'N/A'} | <i class="fas fa-phone me-2"></i>+${data.country_calling_code}</div>
                        </div>
                        <div class="col-sm-6">
                            <div class="data-label">KOORDINAT ESTIMASI (IP)</div>
                            <div class="text-white-50"><i class="fas fa-compass me-2"></i>Lat: ${data.latitude}, Lng: ${data.longitude}</div>
                        </div>
                    </div>
                </div>
            `;

            // Simpan Aktivitas ke Local Storage (Spy Logs)
            saveLog({
                ip: data.ip,
                isp: data.org || 'Unknown ISP',
                location: `${data.city || 'N/A'}, ${data.country_name}`
            });

        } catch (error) {
            showLoading(false);
            resultArea.innerHTML = `
                <div class="alert alert-danger border-danger border-opacity-25 animate__animated animate__fadeIn">
                    <i class="fas fa-exclamation-triangle me-2"></i> Gagal menghubungi server intelijen. Periksa koneksi Anda.
                </div>`;
        }
    }

    // Event Listeners Pelacakan
    btnTrackIp.addEventListener('click', () => trackIpAddress(ipToTrackInput.value));
    btnTrackMe.addEventListener('click', () => {
        ipToTrackInput.value = '';
        trackIpAddress(userIp);
    });

    // 3. Fitur GPS Geolocation Terintegrasi (Akurasi Tinggi)
    btnGeolocation.addEventListener('click', function () {
        geoResult.classList.add('d-none');
        
        if (!navigator.geolocation) {
            alert("Browser Anda tidak mendukung sensor GPS Geolocation.");
            return;
        }

        showLoading(true);

        navigator.geolocation.getCurrentPosition(
            async function (position) {
                showLoading(false);
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;

                geoResult.classList.remove('d-none');
                geoData.innerHTML = `
                    <div class="row g-3">
                        <div class="col-sm-6">
                            <div class="data-label text-info">GARIS LINTANG (LATITUDE)</div>
                            <div class="fs-4 text-white fw-bold">${lat}</div>
                        </div>
                        <div class="col-sm-6">
                            <div class="data-label text-info">GARIS BUJUR (LONGITUDE)</div>
                            <div class="fs-4 text-white fw-bold">${lng}</div>
                        </div>
                        <div class="col-12">
                            <div class="alert alert-info bg-info bg-opacity-10 border-info border-opacity-25 mb-0">
                                <i class="fas fa-crosshairs me-2"></i> <strong>Tingkat Akurasi:</strong> Radius ±${Math.round(accuracy)} meter dari titik koordinat.
                                <div class="mt-3">
                                    <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" class="btn btn-sm btn-info fw-bold text-dark">
                                        <i class="fas fa-external-link-alt me-1"></i> Buka Titik di Google Maps
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Catat koordinat GPS asli ke Log Lokal
                saveLog({
                    ip: userIp || 'Local Device',
                    isp: 'GPS Hardware Sensor',
                    location: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
                });
            },
            function (error) {
                showLoading(false);
                let msg = "Akses sensor GPS ditolak oleh pengguna.";
                if (error.code === 2) msg = "Informasi posisi tidak tersedia.";
                if (error.code === 3) msg = "Waktu permintaan akses sensor habis.";
                alert(msg);
            },
            { enableHighAccuracy: true, timeout: 7000 }
        );
    });

    // 4. Fitur Link Generator (Simulasi Klien Statis)
    btnGenerateLink.addEventListener('click', function () {
        const targetUrl = targetUrlInput.value.trim();
        if (!targetUrl) {
            alert('Masukkan URL target/kamuflase terlebih dahulu!');
            return;
        }

        // Membuat parameter acak seolah-olah link pelacak aktif
        const randomToken = Math.random().toString(36).substring(2, 8);
        const trackingUrl = `${window.location.origin}${window.location.pathname}?track=${randomToken}&redirect=${btoa(targetUrl)}`;

        spyUrlResult.value = trackingUrl;
        generatedResult.classList.remove('d-none');
    });

    btnCopyLink.addEventListener('click', function () {
        spyUrlResult.select();
        document.execCommand('copy');
        
        const originalIcon = btnCopyLink.innerHTML;
        btnCopyLink.innerHTML = '<i class="fas fa-check"></i>';
        btnCopyLink.className = 'btn btn-success';
        
        setTimeout(() => {
            btnCopyLink.innerHTML = originalIcon;
            btnCopyLink.className = 'btn btn-outline-success';
        }, 2000);
    });

    // 5. Manajemen Sistem Log Menggunakan LocalStorage
    function saveLog(logItem) {
        let logs = JSON.parse(localStorage.getItem('spy_logs')) || [];
        
        // Atur format waktu lokal (WIB)
        const now = new Date();
        const timeString = now.toLocaleDateString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const newLog = {
            time: timeString,
            ip: logItem.ip,
            isp: logItem.isp,
            location: logItem.location
        };

        logs.unshift(newLog); // Tambah data baru ke baris paling atas
        localStorage.setItem('spy_logs', JSON.stringify(logs));
        renderLogs();
    }

    function renderLogs() {
        let logs = JSON.parse(localStorage.getItem('spy_logs')) || [];
        logsBody.innerHTML = '';

        if (logs.length === 0) {
            logsBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">Belum ada aktivitas pelacakan lokal.</td></tr>`;
            return;
        }

        logs.forEach((log) => {
            const tr = document.createElement('tr');
            tr.className = 'animate__animated animate__fadeIn';
            tr.innerHTML = `
                <td class="text-info fw-bold">${log.time}</td>
                <td>
                    <span class="fw-semibold d-block text-white">${log.ip}</span>
                    <span class="text-muted extra-small">${log.isp}</span>
                </td>
                <td><i class="fas fa-map-marker-alt text-warning me-1"></i>${log.location}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-retrack" data-ip="${log.ip.includes('Lat:') ? '' : log.ip}">
                        <i class="fas fa-redo"></i>
                    </button>
                </td>
            `;
            logsBody.appendChild(tr);
        });

        // Pasang event re-track ke tombol aksi di log
        document.querySelectorAll('.btn-retrack').forEach(btn => {
            btn.addEventListener('click', function() {
                const targetIp = this.getAttribute('data-ip');
                if(targetIp) {
                    ipToTrackInput.value = targetIp;
                    trackIpAddress(targetIp);
                    // Pindah ke tab pertama (Live Tracker)
                    document.getElementById('track-tab').click();
                } else {
                    alert('Log ini merupakan data GPS, gunakan tombol koordinat untuk pembaruan baru.');
                }
            });
        });
    }

    btnRefreshLogs.addEventListener('click', renderLogs);
    btnClearLogs.addEventListener('click', function () {
        if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat pelacakan lokal Anda?')) {
            localStorage.removeItem('spy_logs');
            renderLogs();
        }
    });

    // Utilitas Tambahan
    function showLoading(status) {
        if (status) {
            loading.classList.remove('d-none');
        } else {
            loading.classList.add('d-none');
        }
    }
});