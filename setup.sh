#!/bin/bash
# MGNREGA Performance Tracker - Automated Setup Script for Ubuntu/Linux

set -e

echo "================================================"
echo "MGNREGA Performance Tracker - Setup Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root"
    exit 1
fi

# Update system
print_info "Updating system packages..."
sudo apt update
sudo apt upgrade -y
print_success "System updated"

# Install Node.js
print_info "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node_version=$(node --version)
print_success "Node.js installed: $node_version"

# Install PostgreSQL
print_info "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
print_success "PostgreSQL installed and started"

# Install Docker (optional but recommended)
print_info "Installing Docker..."
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
print_success "Docker installed"

# Setup database
print_info "Setting up database..."
read -sp "Enter PostgreSQL password for new database: " db_password
echo ""

sudo -u postgres psql << EOF
CREATE DATABASE mgnrega_db;
CREATE USER mgnrega_user WITH PASSWORD '$db_password';
GRANT ALL PRIVILEGES ON DATABASE mgnrega_db TO mgnrega_user;
\q
EOF

print_success "Database created"

# Clone repository (assuming you're in the project directory)
cd ~/
if [ ! -d "MGNREGA" ]; then
    print_info "Cloning repository..."
    git clone <your-repo-url> MGNREGA || print_error "Failed to clone. Make sure to update the repo URL"
fi

cd MGNREGA

# Initialize database schema
print_info "Initializing database schema..."
sudo -u postgres psql -d mgnrega_db -f database/schema.sql
print_success "Database schema initialized"

# Setup Backend
print_info "Setting up backend..."
cd backend
npm install

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mgnrega_db
DB_USER=mgnrega_user
DB_PASSWORD=$db_password
CORS_ORIGIN=*
CACHE_TTL=3600
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SYNC_SCHEDULE=0 */6 * * *
LOG_LEVEL=info
DATA_GOV_API_KEY=your_api_key_here
DATA_GOV_API_URL=https://api.data.gov.in/resource/854e5a1f-a4e3-4177-8586-2bcc27b74552
EOF

print_success "Backend configured"

# Install PM2 for process management
sudo npm install -g pm2

# Seed database
print_info "Seeding database with sample data..."
npm run seed
print_success "Database seeded"

# Start backend
print_info "Starting backend server..."
pm2 start src/index.js --name mgnrega-backend
pm2 save
pm2 startup
print_success "Backend started"

# Setup Frontend
print_info "Setting up frontend..."
cd ../frontend
npm install
npm run build
print_success "Frontend built"

# Install and configure Nginx
print_info "Installing and configuring Nginx..."
sudo apt install -y nginx

# Create nginx configuration
sudo tee /etc/nginx/sites-available/mgnrega << 'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/mgnrega;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Deploy frontend files
sudo mkdir -p /var/www/mgnrega
sudo cp -r dist/* /var/www/mgnrega/
sudo chown -R www-data:www-data /var/www/mgnrega

# Enable site
sudo ln -sf /etc/nginx/sites-available/mgnrega /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
print_success "Nginx configured and started"

# Configure firewall
print_info "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable
print_success "Firewall configured"

# Create backup script
print_info "Creating backup script..."
cat > ~/backup_mgnrega.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="$HOME/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump mgnrega_db > $BACKUP_DIR/mgnrega_backup_$DATE.sql
find $BACKUP_DIR -name "mgnrega_backup_*.sql" -mtime +7 -delete
echo "Backup completed: mgnrega_backup_$DATE.sql"
EOF

chmod +x ~/backup_mgnrega.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * $HOME/backup_mgnrega.sh") | crontab -
print_success "Backup script created and scheduled"

# Get server IP
server_ip=$(hostname -I | awk '{print $1}')

echo ""
echo "================================================"
print_success "Setup completed successfully!"
echo "================================================"
echo ""
echo "Your MGNREGA Performance Tracker is now running!"
echo ""
echo "Access your application at:"
echo "  Frontend: http://$server_ip"
echo "  Backend API: http://$server_ip/api"
echo "  Health Check: http://$server_ip/api/health"
echo ""
echo "Management commands:"
echo "  View backend logs: pm2 logs mgnrega-backend"
echo "  Restart backend: pm2 restart mgnrega-backend"
echo "  Check status: pm2 status"
echo "  Backup database: ~/backup_mgnrega.sh"
echo ""
print_info "Next steps:"
echo "  1. Update DATA_GOV_API_KEY in backend/.env with real API key"
echo "  2. Configure your domain name (optional)"
echo "  3. Setup SSL with: sudo certbot --nginx -d yourdomain.com"
echo "  4. Monitor logs regularly"
echo ""
print_info "For Docker deployment, run: docker-compose up -d"
echo ""
echo "================================================"
