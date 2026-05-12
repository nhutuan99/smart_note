/**
 * Finance Reminder Service
 *
 * Sends personalized push notifications for financial planning features:
 *   - 🎯 Savings Goals: daily reminder at user-set time (if not yet completed)
 *   - 💰 Debts: 7-day, 3-day, 1-day warning before dueDate
 *   - 🔄 Recurring Transactions: reminder when nextDate is today
 *
 * Called by Cloudflare Cron Trigger every 15 minutes.
 *
 * Registry: KV key "public/finance-reminder-users" (string[])
 * Auto-managed: savings controller adds/removes users when reminderTime is set/cleared.
 * Debt & Recurring reminders are always checked for all users with active items.
 */

import { Env, SavingsData, DebtData, RecurringData } from '../types'
import { getJSON, putJSON } from './kv.service'
import { sendPushToUser } from '../controllers/push.controller'

const REGISTRY_KEY = 'public/finance-reminder-users'

// ── VN timezone helper ──────────────────────────────────────────────────────

function toVnTime(date: Date): { hour: number; minute: number; dateStr: string } {
  const VN_OFFSET_MS = 7 * 60 * 60 * 1000
  const vnDate = new Date(date.getTime() + VN_OFFSET_MS)
  return {
    hour: vnDate.getUTCHours(),
    minute: vnDate.getUTCMinutes(),
    dateStr: vnDate.toISOString().substring(0, 10)
  }
}

function daysUntil(dateStr: string, todayStr: string): number {
  const target = new Date(dateStr).getTime()
  const today = new Date(todayStr).getTime()
  return Math.ceil((target - today) / 86_400_000)
}

function formatVND(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`
  return amount.toLocaleString('vi-VN')
}

// ── 1. Savings Goal Reminders ───────────────────────────────────────────────

async function checkSavingsReminders(userId: string, env: Env, vnToday: string, nowMinutes: number): Promise<number> {
  const goals = (await getJSON<SavingsData[]>(env.SMART_NOTE_KV, `users/${userId}/savings`)) || []
  let sent = 0
  let modified = false

  for (const goal of goals) {
    // Skip completed or no reminder
    if (!goal.reminderTime || goal.currentAmount >= goal.targetAmount) continue

    // Parse reminderTime "HH:MM"
    const [rH, rM] = goal.reminderTime.split(':').map(Number)
    if (isNaN(rH) || isNaN(rM)) continue

    const reminderMinutes = rH * 60 + rM
    const diff = Math.abs(nowMinutes - reminderMinutes)
    const withinWindow = diff <= 15 || diff >= 24 * 60 - 15

    if (!withinWindow) continue
    if (goal.reminderNotifiedDate === vnToday) continue

    // Calculate daily saving needed
    const remaining = goal.targetAmount - goal.currentAmount
    const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100)
    const daysLeft = goal.deadline ? daysUntil(goal.deadline, vnToday) : null

    let body = `Đã tiết kiệm ${pct}% • Còn thiếu ${formatVND(remaining)}`
    if (daysLeft !== null && daysLeft > 0) {
      const dailyNeeded = Math.ceil(remaining / daysLeft)
      body += ` • Cần ~${formatVND(dailyNeeded)}/ngày (còn ${daysLeft} ngày)`
    } else if (daysLeft === 0) {
      body = `⏰ HÔM NAY là deadline! Còn thiếu ${formatVND(remaining)}`
    }

    await sendPushToUser(userId, env, {
      title: `${goal.icon} Nhắc nạp tiền — ${goal.name}`,
      body,
      tag: `savings-${goal.id}-${vnToday}`,
      url: '/plan/savings',
      data: { type: 'savings_reminder', goalId: goal.id }
    })

    goal.reminderNotifiedDate = vnToday
    goal.updatedAt = new Date().toISOString()
    modified = true
    sent++
  }

  if (modified) {
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/savings`, goals)
  }

  return sent
}

// ── 2. Debt Due-Date Reminders ──────────────────────────────────────────────

const DEBT_WARN_DAYS = [7, 3, 1]

async function checkDebtReminders(userId: string, env: Env, vnToday: string): Promise<number> {
  const debts = (await getJSON<DebtData[]>(env.SMART_NOTE_KV, `users/${userId}/debts`)) || []
  let sent = 0
  let modified = false

  for (const debt of debts) {
    if (debt.status !== 'active' || !debt.dueDate) continue

    const days = daysUntil(debt.dueDate, vnToday)

    // Only fire on specific warning days
    if (!DEBT_WARN_DAYS.includes(days) && days !== 0) continue

    const notifiedKey = `debt_notified_${days}`
    const debtMeta = (debt as any)[notifiedKey]
    if (debtMeta === vnToday) continue // Already notified this warning tier today

    const typeLabel = debt.type === 'lent' ? 'cho vay' : 'phải trả'
    let title: string
    let body: string

    if (days === 0) {
      title = `🚨 Đáo hạn HÔM NAY: ${debt.title}`
      body = `${typeLabel} ${formatVND(debt.remainingAmount)} với ${debt.counterparty}`
    } else {
      title = `⏰ Khoản nợ sắp đến hạn (${days} ngày)`
      body = `${debt.title} • ${typeLabel} ${formatVND(debt.remainingAmount)} với ${debt.counterparty}`
    }

    await sendPushToUser(userId, env, {
      title,
      body,
      tag: `debt-${debt.id}-d${days}`,
      url: '/plan/debt',
      data: { type: 'debt_reminder', debtId: debt.id, daysLeft: days }
    });

    // Mark this warning tier as notified
    (debt as any)[notifiedKey] = vnToday
    modified = true
    sent++
  }

  if (modified) {
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/debts`, debts)
  }

  return sent
}

// ── 3. Recurring Transaction Reminders ─────────────────────────────────────

async function checkRecurringReminders(userId: string, env: Env, vnToday: string, vnHour: number): Promise<number> {
  // Only send recurring reminders at 8 AM VN time (cron window ±15min)
  if (Math.abs(vnHour * 60 - 8 * 60) > 15 && Math.abs(vnHour * 60 - 8 * 60) < 24 * 60 - 15) return 0

  const items = (await getJSON<RecurringData[]>(env.SMART_NOTE_KV, `users/${userId}/recurring`)) || []
  let sent = 0

  for (const item of items) {
    if (!item.enabled || item.nextDate !== vnToday) continue

    const typeLabel = item.type === 'income' ? '💰 Thu nhập' : '💸 Chi phí'
    const freqMap: Record<string, string> = {
      daily: 'hàng ngày', weekly: 'hàng tuần',
      monthly: 'hàng tháng', yearly: 'hàng năm'
    }

    await sendPushToUser(userId, env, {
      title: `🔄 Đến hạn: ${item.note || item.category}`,
      body: `${typeLabel} ${formatVND(item.amount)} • ${freqMap[item.frequency] || item.frequency}`,
      tag: `recurring-${item.id}-${vnToday}`,
      url: '/plan/recurring',
      data: { type: 'recurring_reminder', recurringId: item.id }
    })

    sent++
  }

  return sent
}

// ── 4. Savings Deadline Early Warning (separate from daily reminder) ────────

async function checkSavingsDeadlineWarning(userId: string, env: Env, vnToday: string, vnHour: number): Promise<number> {
  // Only at 9 AM VN
  if (Math.abs(vnHour * 60 - 9 * 60) > 15) return 0

  const goals = (await getJSON<SavingsData[]>(env.SMART_NOTE_KV, `users/${userId}/savings`)) || []
  let sent = 0

  for (const goal of goals) {
    if (!goal.deadline || goal.currentAmount >= goal.targetAmount) continue

    const days = daysUntil(goal.deadline, vnToday)
    if (![30, 14, 7, 3, 1].includes(days)) continue

    const remaining = goal.targetAmount - goal.currentAmount
    let urgencyPrefix = days <= 3 ? '🚨' : days <= 7 ? '⚠️' : '📅'

    await sendPushToUser(userId, env, {
      title: `${urgencyPrefix} ${goal.icon} ${goal.name} còn ${days} ngày!`,
      body: `Còn thiếu ${formatVND(remaining)} để đạt mục tiêu • Cần ~${formatVND(Math.ceil(remaining / days))}/ngày`,
      tag: `savings-deadline-${goal.id}-d${days}`,
      url: '/plan/savings',
      data: { type: 'savings_deadline_warning', goalId: goal.id, daysLeft: days }
    })

    sent++
  }

  return sent
}

// ── Main Entry ──────────────────────────────────────────────────────────────

export async function checkFinanceReminders(env: Env): Promise<string> {
  const userIds = (await getJSON<string[]>(env.SMART_NOTE_KV, REGISTRY_KEY)) || []

  // Also check ALL users for debt & recurring (they don't need registry)
  // We build a combined set: registered users + users who have debts/recurring
  // For performance: only registry users get savings + deadline warnings
  // Debt/Recurring uses same registry (debt controller should register too)

  if (userIds.length === 0) return '[FinanceReminder] No users registered'

  const now = new Date()
  const { hour: vnHour, minute: vnMinute, dateStr: vnToday } = toVnTime(now)
  const nowMinutes = vnHour * 60 + vnMinute

  let totalSent = 0

  for (const userId of userIds) {
    try {
      const [s1, s2, s3, s4] = await Promise.all([
        checkSavingsReminders(userId, env, vnToday, nowMinutes),
        checkDebtReminders(userId, env, vnToday),
        checkRecurringReminders(userId, env, vnToday, vnHour),
        checkSavingsDeadlineWarning(userId, env, vnToday, vnHour)
      ])
      totalSent += s1 + s2 + s3 + s4
    } catch (err) {
      console.error(`[FinanceReminder] Error for user ${userId}:`, err)
    }
  }

  return `[FinanceReminder] Processed ${userIds.length} users — sent ${totalSent} notifications`
}
