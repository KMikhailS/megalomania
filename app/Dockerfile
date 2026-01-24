# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration (optional - nginx default works for most SPAs)
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]