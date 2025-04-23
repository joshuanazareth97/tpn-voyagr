#!/bin/bash
# Proxy Dispatcher Deployment Script (No Docker)
# Usage: bash deploy.sh [test|production]

# Exit on any error
set -e

ENVIRONMENT=${1:-"test"}
echo "Deploying in $ENVIRONMENT mode..."

# Configuration
if [ "$ENVIRONMENT" = "production" ]; then
  # Production settings
  DEFAULT_REGIONS="US,GB,JP,DE,SG"
  CONTROL_PORT=1081
  # Add other production settings here
else
  # Test settings
  DEFAULT_REGIONS="US"
  CONTROL_PORT=1081
fi

# 1. Update system and install dependencies
echo "Updating system and installing dependencies..."
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y curl git build-essential

# 2. Install Node.js if not already installed
if ! command -v node &> /dev/null; then
  echo "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# 3. Install wireproxy if not already installed
if ! command -v wireproxy &> /dev/null; then
  echo "Installing wireproxy..."
  mkdir -p ~/tmp
  cd ~/tmp
  curl -sSL https://github.com/octeep/wireproxy/releases/download/v1.0.3/wireproxy-linux-amd64 -o wireproxy
  chmod +x wireproxy
  sudo mv wireproxy /usr/local/bin/
  cd -
fi

# 4. Install PM2 for process management
echo "Installing PM2..."
sudo npm install -g pm2

# 5. Setup application directory
APP_DIR="/opt/proxy-dispatcher"
echo "Setting up application in $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# 6. Copy application files
echo "Copying application files..."
cp -r ../packages/proxy-dispatcher/* $APP_DIR/

# 7. Install dependencies
echo "Installing dependencies..."
cd $APP_DIR
npm install --production

# 8. Create environment file
echo "Creating environment file..."
cat > $APP_DIR/.env << EOL
DEFAULT_REGIONS=${DEFAULT_REGIONS}
CONTROL_PORT=${CONTROL_PORT}
EOL

# 9. Setup PM2 process file
echo "Creating PM2 configuration..."
cat > $APP_DIR/ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'proxy-dispatcher',
    script: 'src/index.js',
    env: {
      NODE_ENV: '${ENVIRONMENT}',
      DEFAULT_REGIONS: '${DEFAULT_REGIONS}',
      CONTROL_PORT: ${CONTROL_PORT}
    },
    max_memory_restart: '256M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    time: true,
    restart_delay: 3000,
    max_restarts: 10
  }]
};
EOL

# 10. Create log directory
mkdir -p $APP_DIR/logs

# 11. Setup firewall
echo "Configuring firewall..."
sudo ufw allow ${CONTROL_PORT}/tcp
sudo ufw allow 10000:15000/tcp comment "SOCKS5 proxy dynamic ports"

# 12. Start the application with PM2
echo "Starting application with PM2..."
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save

# 13. Setup PM2 to start on boot
echo "Setting up PM2 to start on system boot..."
sudo pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo "Deployment completed! Proxy dispatcher running on port ${CONTROL_PORT}"
echo "Configure your application to use SOCKS5 proxies at 127.0.0.1:<dynamic_port> obtained from the control API"
echo "Available endpoints:"
echo " - GET /regions - List available regions"
echo " - GET /countries - List available countries"
echo " - GET /tunnel/:region - Get a tunnel for a specific region"