# KeepStock XPTN - Inventory Management System

## Project Overview
KeepStock XPTN is a comprehensive inventory management system built with:
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express
- Database: MySQL
- Authentication: JWT-based

## Features
- Multi-role user system (Store, Manager, Admin)
- Real-time inventory tracking
- Box-based storage management
- Activity logging
- Analytics dashboard
- CSV data import/export
- Dark mode support

## Security Features
1. Authentication & Authorization
   - JWT-based authentication
   - Role-based access control
   - Password hashing with bcrypt
   - Token expiration and refresh

2. Database Security
   - Prepared statements for SQL injection prevention
   - Transaction support for data integrity
   - Connection pooling
   - Secure password storage

3. API Security
   - CORS protection
   - Rate limiting
   - Helmet.js security headers
   - Input validation
   - Error handling

## Local Development Setup

1. Database Setup
```sql
-- Create database
CREATE DATABASE keepstock_db;

-- Create tables (see schema in Database Setup section)
```

2. Environment Configuration
```bash
# Create .env file with:
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=keepstock_db
JWT_SECRET=your_secure_jwt_secret
FRONTEND_URL=http://localhost:5173
```

3. Install Dependencies
```bash
npm install
```

4. Start Development Servers
```bash
npm run dev
```

## Production Deployment

1. Web Server Setup (Apache/Nginx)

Apache Configuration:
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/keepstock/dist

    <Directory /var/www/keepstock/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # API Proxy
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
</Directory>
</VirtualHost>
```

Nginx Configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/keepstock/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. Database Setup
```bash
# Create production database
mysql -u root -p
CREATE DATABASE keepstock_db;
CREATE USER 'keepstock_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON keepstock_db.* TO 'keepstock_user'@'localhost';
FLUSH PRIVILEGES;

# Import schema
mysql -u keepstock_user -p keepstock_db < database/schema.sql
```

3. Node.js Setup
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Build frontend
npm run build

# Start backend with PM2
pm2 start server/index.js --name keepstock
pm2 startup
pm2 save
```

4. SSL Configuration (Let's Encrypt)
```bash
sudo apt-get install certbot
sudo certbot --apache # or --nginx
```

## Backup Strategy

1. Database Backups
```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u keepstock_user -p keepstock_db > $BACKUP_DIR/keepstock_$DATE.sql
gzip $BACKUP_DIR/keepstock_$DATE.sql

# Add to crontab (daily at 2 AM)
0 2 * * * /path/to/backup_script.sh
```

2. Application Backups
```bash
# Backup application files
tar -czf /path/to/backups/keepstock_app_$(date +%Y%m%d).tar.gz /var/www/keepstock
```

## Monitoring & Maintenance

1. Log Monitoring
- Application logs: /var/log/keepstock/
- Access logs: Apache/Nginx standard locations
- PM2 logs: pm2 logs keepstock

2. Performance Monitoring
- Server metrics: top, htop
- MySQL performance: SHOW PROCESSLIST, slow query log
- Application metrics: PM2 monitoring

3. Regular Maintenance Tasks
- Log rotation
- Database optimization
- SSL certificate renewal
- Security updates
- Backup verification

## Scaling Considerations

1. Database Scaling
- Implement connection pooling (already configured)
- Add indexes for frequently queried columns
- Consider master-slave replication for read scaling
- Implement query caching

2. Application Scaling
- Load balancing with multiple Node.js instances
- Redis for session storage
- CDN for static assets
- Containerization with Docker

## Troubleshooting

Common Issues:
1. Connection Errors
   - Check database credentials
   - Verify network connectivity
   - Check firewall rules

2. Performance Issues
   - Monitor server resources
   - Check slow query logs
   - Review application logs
   - Analyze query execution plans

3. Authentication Issues
   - Verify JWT secret
   - Check token expiration
   - Validate user permissions

## Development Guidelines

1. Code Structure
   - Frontend: /src
   - Backend: /server
   - Database: /database
   - Configuration: .env

2. API Endpoints
   - Authentication: /api/auth/*
   - Users: /api/users/*
   - Products: /api/products/*
   - Boxes: /api/boxes/*
   - Activities: /api/activities/*
   - Analytics: /api/analytics/*

3. Database Schema
   - users: User accounts and roles
   - boxes: Storage boxes
   - box_items: Items in boxes
   - products: Product catalog
   - activity_logs: System activity tracking

4. Security Best Practices
   - Use prepared statements
   - Validate all inputs
   - Implement rate limiting
   - Regular security audits
   - Keep dependencies updated

## Support and Resources
- GitHub Repository: [URL]
- Issue Tracker: [URL]
- Documentation: [URL]