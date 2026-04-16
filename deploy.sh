#!/bin/bash

# 1. Pull latest changes
git pull origin main

# 2. Automatically detect Public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
DOMAIN="$PUBLIC_IP.nip.io"

echo "Detected Domain: $DOMAIN"

# 3. Load environment variables correctly (ignoring comments)
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# 4. Specifically override the VITE_API_URL to use the new domain
export VITE_API_URL="http://$DOMAIN:5000/api"

# 5. Check if critical environment variables are set
if [ -z "$VITE_GOOGLE_CLIENT_ID" ] || [ -z "$RAZORPAY_KEY_ID" ]; then
    echo "WARNING: VITE_GOOGLE_CLIENT_ID or RAZORPAY_KEY_ID is missing from .env!"
    echo "Check your .env file before proceeding."
fi

# 6. Build and Start
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
echo "Main App URL: http://$DOMAIN"
echo "API Health Check: http://$DOMAIN:5000/"
echo "--------------------------------------------------------"
echo "Note: Ensure ports 80 and 5000 are open in AWS Console."
echo "If backend is still failing, check logs: sudo docker logs to_do_sda_backend_1"
