FROM node:20-alpine AS backend-builder

WORKDIR /usr/src/app

# Copy backend dependency manifests
COPY backend/package*.json ./

# Install backend production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy backend source code
COPY backend/ ./

FROM node:20-alpine AS frontend-builder

WORKDIR /usr/src/app

# Copy frontend dependency manifests
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install --legacy-peer-deps

# Copy frontend source code
COPY frontend/ ./

# Build frontend production assets
RUN npm run build

FROM nginx:alpine

# Install Node.js in the nginx runtime stage
RUN apk add --no-cache nodejs npm

# Create necessary directories
RUN mkdir -p /run/nginx /etc/nginx/http.d /etc/nginx/conf.d

# Copy backend from backend-builder
COPY --from=backend-builder /usr/src/app /usr/src/app

# Copy frontend build output to nginx html directory
COPY --from=frontend-builder /usr/src/app/dist /usr/share/nginx/html

# Configure nginx
RUN echo 'server { \
    listen 80; \
    server_name _; \
    \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /api { \
        proxy_pass http://127.0.0.1:5000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/http.d/default.conf

EXPOSE 80

CMD ["sh", "-c", "mkdir -p /run/nginx && (cd /usr/src/app && node server.js &) && nginx -g 'daemon off;'"]