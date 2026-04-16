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

# 5. Build and Start
sudo -E docker-compose up -d --build

echo "--------------------------------------------------------"
echo "Deployment Complete!"
echo "Main App URL: http://$DOMAIN:3000"
echo "API Health Check: http://$DOMAIN:5000/"
echo "--------------------------------------------------------"
echo "Note: Ensure ports 3000 and 5000 are open in AWS Console."
