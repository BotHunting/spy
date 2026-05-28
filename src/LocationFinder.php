<?php

namespace App;

class LocationFinder {
    private $apiKey;

    public function __construct($apiKey = '') {
        $this->apiKey = $apiKey;
    }

    /**
     * Mengambil lokasi berdasarkan IP
     */
    public function findLocation($ipAddress) {
        if (!$this->validateIpAddress($ipAddress)) {
            return ['error' => 'Alamat IP tidak valid'];
        }

        $useIpStack = !empty($this->apiKey) && $this->apiKey !== 'your_api_key_here';
        
        if ($useIpStack) {
            $url = "http://api.ipstack.com/{$ipAddress}?access_key={$this->apiKey}";
        } else {
            // Gunakan ip-api.com (Gratis)
            $url = "http://ip-api.com/json/{$ipAddress}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,query";
        }

        $response = $this->fetchUrl($url);
        
        if ($response === false) {
            return ['error' => 'Gagal menghubungi layanan API. Pastikan koneksi internet tersedia dan server mengizinkan koneksi keluar (allow_url_fopen atau cURL).'];
        }

        return json_decode($response, true);
    }

    /**
     * Metode pengambil URL yang lebih tangguh
     */
    private function fetchUrl($url) {
        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SpyTracker/1.0';

        // Coba gunakan cURL jika tersedia
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, $userAgent);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            $output = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode === 200) {
                return $output;
            }
        }

        // Fallback ke file_get_contents dengan konteks User-Agent
        $opts = [
            'http' => [
                'method' => 'GET',
                'header' => "User-Agent: $userAgent\r\n",
                'timeout' => 10
            ]
        ];
        $context = stream_context_create($opts);
        return @file_get_contents($url, false, $context);
    }

    /**
     * Mendapatkan IP asli pengunjung
     */
    public function getClientIp() {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
        } else {
            return $_SERVER['REMOTE_ADDR'];
        }
    }

    public function validateIpAddress($ipAddress) {
        return filter_var($ipAddress, FILTER_VALIDATE_IP) !== false;
    }
}