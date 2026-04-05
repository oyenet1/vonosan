/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

/**
 * generateDockerCompose — docker-compose.yml with app + redis services.
 * Redis uses a healthcheck; app depends_on redis being healthy.
 */
export function generateDockerCompose(appName: string): string {
  return `# ──────────────────────────────────────────────────────────────────
# 🏢 Bonifade Technologies — docker-compose.yml
# ──────────────────────────────────────────────────────────────────

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${appName}
    restart: unless-stopped
    ports:
      - "4000:4000"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: ${appName}-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 5s
    networks:
      - app-network

volumes:
  redis-data:

networks:
  app-network:
    driver: bridge
`
}

/**
 * generateWaitForRedis — wait-for-redis.sh script.
 * Polls Redis until it responds, then executes the given command.
 */
export function generateWaitForRedis(): string {
  return `#!/bin/sh
# ──────────────────────────────────────────────────────────────────
# 🏢 Bonifade Technologies — wait-for-redis.sh
# ──────────────────────────────────────────────────────────────────
# Usage: ./wait-for-redis.sh redis:6379 -- pm2-runtime ecosystem.config.js

set -e

HOST=$(echo "$1" | cut -d: -f1)
PORT=$(echo "$1" | cut -d: -f2)
shift
shift  # skip '--'

echo "Waiting for Redis at $HOST:$PORT..."

until redis-cli -h "$HOST" -p "$PORT" ping 2>/dev/null | grep -q PONG; do
  echo "Redis not ready — retrying in 2s..."
  sleep 2
done

echo "Redis is ready. Starting application..."
exec "$@"
`
}
