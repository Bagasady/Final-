# KeepStock XPTN - Deployment Guide

## Struktur Direktori

```
public_html/
└── Kepstock/
    ├── dist/          # Frontend build output
    │   ├── index.html
    │   └── assets/    # Static assets (JS, CSS, images)
    ├── server/        # Backend Node.js files
    └── .htaccess      # Apache configuration
```

## Langkah-langkah Deployment

1. Persiapan Database
```sql
CREATE DATABASE keepstock_db;
CREATE USER 'keepstock_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON keepstock_db.* TO 'keepstock_user'@'localhost';
FLUSH PRIVILEGES;
```

2. Build Frontend
```bash
# Di lokal development
npm run build
```

3. Upload File
   - Upload seluruh isi folder `dist` ke `/public_html/Kepstock/dist/`
   - Upload folder `server` ke `/public_html/Kepstock/server/`
   - Upload `.htaccess` ke `/public_html/Kepstock/`

4. Setup Node.js di cPanel
   - Buka "Setup Node.js App" di cPanel
   - Pilih Node.js versi 18.x
   - Set direktori aplikasi: /home/xptndash/public_html/Kepstock
   - Set startup file: server/index.js
   - Set NPM dependencies mode: Production
   - Klik "Create"

5. Konfigurasi Environment Variables di cPanel
   - NODE_ENV=production
   - DB_HOST=localhost
   - DB_USER=xptndash_user
   - DB_NAME=xptndash_keepstock_db
   - DB_PASSWORD=your_password
   - JWT_SECRET=your_secure_jwt_secret
   - FRONTEND_URL=https://xptndashboard.site

6. Restart Aplikasi
   - Di cPanel, buka "Setup Node.js App"
   - Pilih aplikasi KeepStock
   - Klik "Restart"

## Struktur URL

- Frontend: https://xptndashboard.site/Kepstock/dist/
- API Endpoint: https://xptndashboard.site/api/

## Troubleshooting

1. Jika aset tidak dimuat:
   - Periksa path di Network tab browser
   - Pastikan MIME types di .htaccess sesuai
   - Verifikasi permissions folder dist/assets (755)

2. Jika API tidak merespons:
   - Periksa error log Node.js di cPanel
   - Verifikasi konfigurasi Passenger di .htaccess
   - Pastikan environment variables terset dengan benar

3. Jika routing SPA tidak berfungsi:
   - Pastikan RewriteBase di .htaccess sesuai
   - Periksa konfigurasi React Router
   - Verifikasi base URL di vite.config.ts

## Catatan Penting

- File .htaccess ditempatkan di /public_html/Kepstock/
- Semua request API harus melalui /api/
- Frontend di-serve dari /Kepstock/dist/
- Pastikan SSL/HTTPS aktif untuk keamanan

## Monitoring

- Pantau error log Node.js di cPanel
- Periksa Apache error log untuk masalah server
- Monitor penggunaan CPU/Memory di cPanel

## Backup

- Backup database secara berkala
- Simpan salinan konfigurasi .htaccess
- Arsipkan source code dan build files

## Keamanan

- Gunakan HTTPS
- Aktifkan rate limiting
- Set permissions file yang tepat
- Jaga kerahasiaan JWT_SECRET
- Update dependencies secara berkala