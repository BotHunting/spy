# Spy Location Tracker 🕵️‍♂️

A modern web application to track geographic locations using IP Address and Browser Geolocation API.

## Features
- **IP Tracking**: Look up location details for any IP address.
- **Auto Detect**: Automatically detects your current public IP.
- **GPS Browser Tracking**: Real-time tracking using high-accuracy Browser Geolocation API.
- **Google Maps Integration**: Direct links to view locations on maps.
- **Dual API Support**: Uses `ip-api.com` (Free, no key needed) or `ipstack.com` (Requires API Key).

## Installation
1. Clone this repository.
2. Ensure you have a PHP environment (PHP 7.4+).
3. (Optional) Set your IPStack API key in `.env`.
4. Point your web server to the `public/` directory.

## File Structure
- `public/`: Web-accessible files (CSS, JS, index.php).
- `src/`: Backend logic and helper functions.
- `.env`: Configuration file.

## Usage
- Open the site, input an IP address to track it.
- Click "Lacak via GPS Browser" to get your exact coordinates (requires permission).

---
Developed by **Bot Hunting Company Limited**.
