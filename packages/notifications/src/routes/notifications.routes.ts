/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-04-05
 * 🔄 Updated Date: 2026-04-05
 * ──────────────────────────────────────────────────────────────────
 */

import { Hono } from 'hono'
import type { AppVariables } from 'vonosan/types'
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../controller/notifications.controller.js'

const notificationsRouter = new Hono<{ Variables: AppVariables }>()

notificationsRouter.get('/', listNotifications)
notificationsRouter.patch('/read-all', markAllNotificationsRead)
notificationsRouter.patch('/:id/read', markNotificationRead)
notificationsRouter.delete('/:id', deleteNotification)
notificationsRouter.get('/preferences', getNotificationPreferences)
notificationsRouter.put('/preferences', updateNotificationPreferences)

export default notificationsRouter
