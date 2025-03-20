FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci
RUN cd backend && npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Build backend
RUN cd backend && npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install production dependencies only
RUN npm ci --production
RUN cd backend && npm ci --production

# Copy built applications
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/backend/dist ./backend/dist

# Copy necessary files for database migrations
COPY db ./db

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose ports
EXPOSE 3000
EXPOSE 3001

# Create startup script
RUN echo '#!/bin/sh\n\
cd /app/backend && node dist/index.js & \n\
cd /app && npm start\n\
wait\n\
' > /app/start.sh && chmod +x /app/start.sh

# Start application
CMD ["/app/start.sh"]
