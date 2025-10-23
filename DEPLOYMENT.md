# MGNREGA Performance Tracker - Deployment Guide

## Prerequisites
- VPS/VM with Ubuntu 20.04+ or similar
- At least 2GB RAM, 20GB disk space
- Docker and Docker Compose installed
- Domain name (optional)

## Quick Start - Docker Deployment

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MGNREGA
```

### 2. Configure Environment Variables
```bash
# Create .env file in the root directory
cat > .env << EOF
DB_PASSWORD=your_secure_password_here
CORS_ORIGIN=*
DATA_GOV_API_KEY=your_api_key_here
EOF
```

### 3. Build and Start Services
```bash
# Build and start all services
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Initialize Database with Sample Data
```bash
# Wait for database to be ready (30 seconds)
sleep 30

# Seed the database with sample data
docker-compose exec backend npm run seed
```

### 5. Access the Application
- Frontend: `http://your-server-ip`
- Backend API: `http://your-server-ip/api`
- Health Check: `http://your-server-ip/api/health`

## Manual Deployment (Without Docker)

### 1. Install Dependencies

#### PostgreSQL
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE mgnrega_db;
CREATE USER mgnrega_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mgnrega_db TO mgnrega_user;
\q

# Initialize schema
psql -U mgnrega_user -d mgnrega_db -f database/schema.sql
```

#### Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
nano .env

# Start backend with PM2
npm install -g pm2
pm2 start src/index.js --name mgnrega-backend
pm2 startup
pm2 save

# Seed data
npm run seed
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run build

# Install nginx
sudo apt install nginx

# Copy build files
sudo cp -r dist/* /var/www/html/

# Configure nginx
sudo cp nginx.conf /etc/nginx/sites-available/mgnrega
sudo ln -s /etc/nginx/sites-available/mgnrega /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Production Configuration

### SSL/HTTPS Setup with Let's Encrypt
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

### Firewall Setup
```bash
# Configure UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Database Backup
```bash
# Create backup script
cat > /home/ubuntu/backup_db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U postgres mgnrega_db > $BACKUP_DIR/mgnrega_backup_$DATE.sql
# Keep only last 7 days of backups
find $BACKUP_DIR -name "mgnrega_backup_*.sql" -mtime +7 -delete
EOF

chmod +x /home/ubuntu/backup_db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup_db.sh") | crontab -
```

## Monitoring and Maintenance

### View Logs
```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# PM2 logs (manual deployment)
pm2 logs mgnrega-backend
```

### Check Application Status
```bash
# Health check
curl http://localhost/api/health

# Database connection
docker-compose exec postgres psql -U postgres -d mgnrega_db -c "SELECT COUNT(*) FROM districts;"
```

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or for manual deployment
cd backend
git pull
npm install
pm2 restart mgnrega-backend

cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/html/
```

## Performance Optimization

### 1. Database Optimization
```sql
-- Run these queries periodically
VACUUM ANALYZE;
REINDEX DATABASE mgnrega_db;
```

### 2. Enable Caching
The application already uses in-memory caching. For production, consider adding Redis:

```bash
# Add Redis to docker-compose.yml
# Update backend to use Redis instead of node-cache
```

### 3. CDN for Static Assets
- Upload built frontend assets to a CDN
- Update nginx configuration to serve from CDN

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database connection - verify DB_HOST and credentials
# 2. Port already in use - change PORT in docker-compose.yml
```

### Frontend Shows Errors
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Rebuild frontend
docker-compose up -d --build frontend
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection
docker-compose exec postgres psql -U postgres -d mgnrega_db
```

## Security Checklist

- [ ] Change default database password
- [ ] Configure firewall (UFW)
- [ ] Enable SSL/HTTPS
- [ ] Set up regular backups
- [ ] Configure rate limiting
- [ ] Enable security headers (already in nginx.conf)
- [ ] Keep Docker images updated
- [ ] Monitor application logs
- [ ] Set up monitoring/alerts

## Cost Estimation

### VPS Requirements
- **Basic** (100-1000 users): 2GB RAM, 2 CPU cores - ~$10-15/month
- **Medium** (1000-10000 users): 4GB RAM, 2 CPU cores - ~$20-30/month
- **Large** (10000+ users): 8GB RAM, 4 CPU cores - ~$40-80/month

### Recommended Providers
- DigitalOcean (Droplets)
- AWS EC2 (t3.small or larger)
- Linode
- Vultr
- Hetzner Cloud

## Support and Updates

For issues or questions:
1. Check logs first
2. Verify all services are running
3. Consult this documentation
4. Check GitHub issues

## License
MIT License - See LICENSE file for details
