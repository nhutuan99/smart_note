/**
 * Trading Reminder Service
 *
 * Sends a daily push notification reminding users to check in their trading P&L.
 * Runs on every Cloudflare Cron trigger (every 30 minutes).
 *
 * Logic:
 *  1. Load the public/trading-reminder-users registry
 *  2. For each userId:
 *     a. Read trading config → get reminderTime ("HH:MM", VN UTC+7)
 *     b. Compare to current VN time within a ±15-minute window
 *     c. Skip if already notified today (reminderNotifiedDate)
 *     d. Skip if user already checked-in today
 *     e. Send push notification → update reminderNotifiedDate
 */

import { Env, TradingConfigData, TradingCheckinData } from '../types'
import { getJSON, putJSON } from './kv.service'
import { sendPushToUser } from '../controllers/push.controller'

const TRADING_REMINDER_USERS_KEY = 'public/trading-reminder-users'
const TRADING_CONFIG_KEY = (userId: string) => `users/${userId}/trading/config`
const TRADING_CHECKINS_KEY = (userId: string) => `users/${userId}/trading/checkins`

/** Convert a UTC Date to "HH:MM" string in Vietnam timezone (UTC+7) */
function toVnTime(date: Date): { hour: number; minute: number; dateStr: string } {
  const VN_OFFSET_MS = 7 * 60 * 60 * 1000
  const vnMs = date.getTime() + VN_OFFSET_MS
  const vnDate = new Date(vnMs)
  const hour = vnDate.getUTCHours()
  const minute = vnDate.getUTCMinutes()
  const dateStr = vnDate.toISOString().substring(0, 10) // YYYY-MM-DD in VN time
  return { hour, minute, dateStr }
}

/**
 * Main cron entry — check all users with a trading reminder configured.
 */
export async function checkTradingReminders(env: Env): Promise<string> {
  const userIds = (await getJSON<string[]>(env.SMART_NOTE_KV, TRADING_REMINDER_USERS_KEY)) || []
  if (userIds.length === 0) return '[TradingReminder] No users registered'

  const now = new Date()
  const { hour: vnHour, minute: vnMinute, dateStr: vnToday } = toVnTime(now)
  const nowMinutes = vnHour * 60 + vnMinute

  let sent = 0
  let skipped = 0

  for (const userId of userIds) {
    try {
      const config = await getJSON<TradingConfigData>(env.SMART_NOTE_KV, TRADING_CONFIG_KEY(userId))

      // No config or no reminder time — skip (shouldn't be in registry, but guard anyway)
      if (!config?.reminderTime) {
        skipped++
        continue
      }

      // Parse reminderTime "HH:MM"
      const [rHour, rMinute] = config.reminderTime.split(':').map(Number)
      if (isNaN(rHour) || isNaN(rMinute)) {
        skipped++
        continue
      }
      const reminderMinutes = rHour * 60 + rMinute

      // Check ±15-minute window around the reminder time
      const diff = Math.abs(nowMinutes - reminderMinutes)
      const withinWindow = diff <= 15 || diff >= (24 * 60 - 15) // wrap-around midnight

      if (!withinWindow) {
        skipped++
        continue
      }

      // Already sent a reminder today? Skip.
      if (config.reminderNotifiedDate === vnToday) {
        skipped++
        continue
      }

      // Already checked in today? No need to remind.
      const checkins = (await getJSON<TradingCheckinData[]>(env.SMART_NOTE_KV, TRADING_CHECKINS_KEY(userId))) || []
      const alreadyCheckedIn = checkins.some((c) => c.date === vnToday)
      if (alreadyCheckedIn) {
        skipped++
        // Update notifiedDate so we don't keep checking KV unnecessarily
        config.reminderNotifiedDate = vnToday
        config.updatedAt = now.toISOString()
        await putJSON(env.SMART_NOTE_KV, TRADING_CONFIG_KEY(userId), config)
        continue
      }

      // Send push notification
      await sendPushToUser(userId, env, {
        title: '📊 Nhớ check-in trading hôm nay!',
        body: 'Cập nhật lãi/lỗ để theo dõi hiệu suất giao dịch của bạn',
        tag: `trading-reminder-${vnToday}`,
        url: '/trading?checkin=1',
        data: { type: 'trading_reminder', date: vnToday }
      })

      // Mark as notified for today
      config.reminderNotifiedDate = vnToday
      config.updatedAt = now.toISOString()
      await putJSON(env.SMART_NOTE_KV, TRADING_CONFIG_KEY(userId), config)

      sent++
    } catch (err) {
      console.error(`[TradingReminder] Error processing user ${userId}:`, err)
    }
  }

  return `[TradingReminder] Processed ${userIds.length} users — sent ${sent}, skipped ${skipped}`
}
