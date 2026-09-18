# Frontend Dockerfile - Multi-stage build
FROM node:18-alpine AS builder

# Build argument to pass environment variable at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Break cache with timestamp - Force rebuild on 2026-09-18
RUN echo "Build timestamp: 2026-09-18-22:15:00" > /tmp/buildtime

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
