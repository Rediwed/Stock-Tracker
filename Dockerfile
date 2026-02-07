# ── Stage 1: Build the React frontend ────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install server dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Install client dependencies & build
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# ── Stage 2: Production image ───────────────────────────────────────
FROM node:20-alpine

LABEL maintainer="Rediwed"
LABEL description="Stock Tracker — household food, liquid & medicine inventory tracker"

WORKDIR /app

# better-sqlite3 needs these at runtime on Alpine
RUN apk add --no-cache python3 make g++

# Copy server dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && apk del python3 make g++

# Copy server code
COPY server/ ./server/
COPY seed-sample.js ./

# Copy built frontend from builder stage
COPY --from=builder /app/client/dist ./client/dist

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose default port
EXPOSE 3001

# Database is stored in /app/data — mount a volume here to persist
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server/index.js"]
