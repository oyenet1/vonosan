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
 * generateSetSecrets — generates a set-secrets.sh script.
 *
 * Iterates over the provided env keys and calls
 * `wrangler secret put <KEY>` for each one.
 *
 * @param envKeys — list of environment variable names to upload
 */
export function generateSetSecrets(envKeys: string[]): string {
  const commands = envKeys
    .map((key) => `echo "Setting secret: ${key}"\nwrangler secret put ${key}`)
    .join('\n\n')

  return `#!/bin/bash
# ──────────────────────────────────────────────────────────────────
# 🏢 Bonifade Technologies — set-secrets.sh
# ──────────────────────────────────────────────────────────────────
# Uploads secrets to Cloudflare Workers via wrangler.
# Run: bash set-secrets.sh
# Each command will prompt you to enter the secret value.

set -e

echo "Uploading secrets to Cloudflare Workers..."
echo ""

${commands}

echo ""
echo "✔ All secrets uploaded successfully."
`
}
