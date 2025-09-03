# ===============================================
#!/bin/bash
# deploy.sh - Run this on your EC2 instance

set -e

REPO_URL="https://github.com/psrandapps/focus-time-manager.git"
APP_DIR="/home/ubuntu/focus-time-manager"
DOMAIN="focus.pillisureshraju.in"

echo "🚀 Starting Focus Time Manager deployment..."

# Update system and install Node.js if needed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Clone or update repository
if [ -d "$APP_DIR" ]; then
    echo "🔄 Updating existing repository..."
    cd $APP_DIR
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory
mkdir -p logs

# Stop existing PM2 process if running
pm2 stop focus-app 2>/dev/null || echo "No existing process to stop"

# Start application with PM2
echo "🚀 Starting application..."
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 startup script
pm2 startup ubuntu -u ubuntu --hp /home/ubuntu

# Update Caddyfile
echo "⚙️  Configuring Caddy..."
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy

# Setup log rotation
sudo tee /etc/logrotate.d/focus-app > /dev/null << EOF
$APP_DIR/*.log {
    weekly
    rotate 12
    compress
    delaycompress
    missingok
    notifempty
    create 644 ubuntu ubuntu
}
EOF

# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp focus_sessions.log "backups/focus_sessions_$DATE.log"
find backups/ -name "*.log" -mtime +30 -delete
echo "Backup created: focus_sessions_$DATE.log"
EOF

mkdir -p backups
chmod +x backup.sh

# Add backup to crontab (daily at 2 AM)
(crontab -l 2>/dev/null | grep -v backup.sh; echo "0 2 * * * cd $APP_DIR && ./backup.sh") | crontab -

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://$DOMAIN"
echo "📊 Health check: curl https://$DOMAIN/health"
echo "📝 View logs: pm2 logs focus-app"
echo "📈 Session data: tail -f $APP_DIR/focus_sessions.log"
