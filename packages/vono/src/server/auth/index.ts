/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

// Authorization — Gates & Policies
export {
  registerGate,
  registerPolicy,
  checkGate,
  checkPolicy,
  can,
  authorize,
  gate,
  policy,
} from './gates.js'
export type { GateHandler, PolicyHandler } from './gates.js'
