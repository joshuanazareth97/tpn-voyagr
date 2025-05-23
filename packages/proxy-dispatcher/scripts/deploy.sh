#!/bin/bash
# Proxy Dispatcher Deployment Script
# Usage: bash deploy.sh [test|production]

# Exit on any error
set -e

# Ensure running on Ubuntu
if [ -f /etc/os-release ]; then
  . /etc/os-release
  if [ "$ID" != "ubuntu" ]; then
    echo "Error: This deployment script only supports Ubuntu."
    exit 1
  fi
else
  echo "Error: Cannot detect operating system."
  exit 1
fi

ENVIRONMENT=${1:-"test"}
echo "Deploying in $ENVIRONMENT mode..."
APP_DIR="../"

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
if ! command -v node &>/dev/null; then
  echo "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# 3. Remove old Go installations and install Go 1.23
if command -v go &>/dev/null; then
  echo "Removing old Go installation..."
  sudo rm -rf /usr/local/go
  sudo apt-get remove -y golang-go
fi

echo "Installing Go 1.23..."
wget https://go.dev/dl/go1.23.8.linux-amd64.tar.gz -O /tmp/go.tar.gz
sudo tar -C /usr/local -xzf /tmp/go.tar.gz
# Ensure Go bin paths are in PATH
grep -qxF 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' ~/.profile || echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >>~/.profile
source ~/.profile

# 3.1 Install wireproxy
if ! command -v wireproxy &>/dev/null; then
  echo "Installing wireproxy..."
  go install github.com/pufferffish/wireproxy/cmd/wireproxy@v1.0.9
  # verify wireproxy is now available
  if ! command -v wireproxy &>/dev/null; then
    GOPATH_BIN=$(go env GOPATH)/bin
    echo "wireproxy not found in PATH; adding $GOPATH_BIN to PATH"
    export PATH="$PATH:$GOPATH_BIN"
    if ! command -v wireproxy &>/dev/null; then
      echo "Error: wireproxy installation failed or not in PATH."
      exit 1
    fi
  fi
fi

# 5. Create environment file
echo "Creating environment file..."
cat >$APP_DIR/.env <<EOL
DEFAULT_REGIONS=${DEFAULT_REGIONS}
CONTROL_PORT=${CONTROL_PORT}
EOL

# 6. Start the application with Node.js
echo "Starting application with Node.js..."
cd $APP_DIR
# Run in background with nohup
nohup node src/index.js >logs/out.log 2>logs/error.log &

echo "Deployment completed! Proxy dispatcher running on port ${CONTROL_PORT}"
echo "Configure your application to use SOCKS5 proxies at 127.0.0.1:<dynamic_port> obtained from the control API"
echo "Available endpoints:"
echo " - GET /regions - List available regions"
echo " - GET /countries - List available countries"
echo " - GET /tunnel/:region - Get a tunnel for a specific region"
