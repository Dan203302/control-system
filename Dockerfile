# syntax=docker/dockerfile:1.7

# --- Base build image ---
FROM node:20-alpine AS base
WORKDIR /app

# Install deps first (better caching)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else echo "package-lock.json not found; using npm install" && npm install; fi

# Copy source and build
COPY . ./
RUN npm run build

# --- Runtime image ---
FROM node:20-alpine AS runtime
WORKDIR /app

# Copy built app and node_modules (with dev deps to allow running migrations)
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/next.config.* ./
COPY --from=base /app/drizzle.* ./
COPY --from=base /app/db ./db
COPY --from=base /app/lib ./lib
COPY --from=base /app/app ./app

# Default envs (can be overridden by docker-compose)
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOST=0.0.0.0

# Ensure uploads directory exists inside container
RUN mkdir -p /app/uploads

EXPOSE 3000

# Run DB migrations at startup, then start the app binding to 0.0.0.0
CMD ["sh", "-c", "npm run db:migrate && npm run start -- -H 0.0.0.0"]
