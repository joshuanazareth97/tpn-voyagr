#!/usr/bin/env bash
# Control API port (defaults to 1081)
CONTROL_PORT=${CONTROL_PORT:-1081}

# Fetch available regions
COUNTRIES_URL="http://127.0.0.1:${CONTROL_PORT}/countries"
echo "Fetching available regions from $COUNTRIES_URL..."
regions=$(curl -s "$COUNTRIES_URL" | jq -r '.countries[]')
if [[ -z "$regions" ]]; then
  echo "Error fetching regions: $regions" >&2
  exit 1
fi
# Present options
declare -a options
i=1
for region in $regions; do
  echo "$i) $region"
  options[$i]="$region"
  ((i++))
done
read -rp "Select region [1-$((i - 1))]: " choice
region=${options[$choice]}
if [[ -z "$region" ]]; then
  echo "Invalid selection" >&2
  exit 1
fi
# Set API_URL dynamically
API_URL="http://127.0.0.1:${CONTROL_PORT}/tunnel/${region}"
echo "Requesting tunnel for region $region at $API_URL"

# Lease a SOCKS5 proxy on localhost
response=$(curl -s --max-time 5 "$API_URL" 2>&1)
echo "API response: $response"
port=$(echo "$response" | jq -r '.port')
echo "Obtained port: $port"

if [[ -z "$port" || "$port" == "null" ]]; then
  echo "Error obtaining port: $response" >&2
  exit 1
fi

# Test connectivity via the leased SOCKS5 proxy
echo "Testing public IP via socks5 proxy on port $port..."
curl --socks5-hostname 127.0.0.1:${port} https://ifconfig.me
