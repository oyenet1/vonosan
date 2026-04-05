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
 * generateEcosystemConfig — generates a PM2 ecosystem.config.js file.
 *
 * Bun:  fork mode, interpreter: 'bun', instances: 1
 * Node: cluster mode, instances: 'max'
 */
export function generateEcosystemConfig(
  runtime: 'bun' | 'node',
  appName: string,
): string {
  const isBun = runtime === 'bun'

  const runtimeConfig = isBun
    ? `    exec_mode: 'fork',
    interpreter: 'bun',
    instances: 1,`
    : `    exec_mode: 'cluster',
    instances: 'max',`

  return `/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: ${new Date().toISOString().slice(0, 10)}
 * 🔄 Updated Date: ${new Date().toISOString().slice(0, 10)}
 * ──────────────────────────────────────────────────────────────────
 */

module.exports = {
  apps: [
    {
      name: '${appName}',
      script: './dist/server/index.js',
${runtimeConfig}
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
      min_uptime: '5s',
      max_restarts: 10,
      restart_delay: 4000,
      max_memory_restart: '512M',
      kill_timeout: 5000,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
}
`
}
