FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Accept backend API URL as an argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the frontend
RUN npm run build

# Use NGINX for serving static files
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Replace default NGINX configuration to fallback to index.html for SPA routing
RUN echo "server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
