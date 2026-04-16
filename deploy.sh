#!/bin/bash

# 1. Pull latest changes
git pull origin feature/cloud-storage-asg

# 2. Automatically detect Public IP of THIS instance
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
DOMAIN="$PUBLIC_IP.nip.io"

echo "Detected IP: $PUBLIC_IP"
echo "Detected Domain: $DOMAIN"

# 3. Load environment variables from .env (ignoring comments)
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "ERROR: .env file not found! Please copy .env.example to .env and fill in your values."
    exit 1
fi

# 4. Override the VITE_API_URL to use the current instance's IP
export VITE_API_URL="http://$DOMAIN:5000/api"

# 5. Check if critical environment variables are set
MISSING=""
[ -z "$VITE_GOOGLE_CLIENT_ID" ] && MISSING="$MISSING VITE_GOOGLE_CLIENT_ID"
[ -z "$RAZORPAY_KEY_ID" ]        && MISSING="$MISSING RAZORPAY_KEY_ID"
[ -z "$DB_HOST" ]                && MISSING="$MISSING DB_HOST"
[ -z "$DB_PASSWORD" ]            && MISSING="$MISSING DB_PASSWORD"
[ -z "$CHACHA20_KEY" ]           && MISSING="$MISSING CHACHA20_KEY"

if [ -n "$MISSING" ]; then
    echo "WARNING: The following required env vars are missing:$MISSING"
    echo "Check your .env file before proceeding."
    exit 1
fi

# 6. Build and Start containers
echo "Stopping existing containers..."
if docker compose version > /dev/null 2>&1; then
    sudo -E docker compose down
    sudo -E docker compose up -d --build
else
    sudo -E docker-compose down
    sudo -E docker-compose up -d --build
fi

echo "--------------------------------------------------------"
echo "Deployment Complete!"
echo "Main App URL:      http://$DOMAIN"
echo "API Health Check:  http://$DOMAIN:5000/"
echo "Database Host:     $DB_HOST"
echo "--------------------------------------------------------"
echo "Note: Ensure ports 80 and 5000 are open in your EC2 Security Group."
