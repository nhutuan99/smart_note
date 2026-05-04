import { Env, StockData, StockAlert } from '../types'
import { jsonResponse, errorResponse } from '../utils/response'
import { getJSON, putJSON } from '../services/kv.service'
import { registerAlertUser, unregisterAlertUserIfEmpty } from '../services/stock-alert.service'

function generateId(): string {
  return crypto.randomUUID()
}

export async function handleListStocks(userId: string, env: Env): Promise<Response> {
  const stocks = await getJSON<StockData[]>(env.SMART_NOTE_KV, `users/${userId}/stocks`) || []
  return jsonResponse(stocks)
}

export async function handleCreateStock(userId: string, request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Partial<StockData>
  if (!body.symbol || !body.buyPrice || !body.quantity) {
    return errorResponse('Missing required fields', 400)
  }

  const stocks = await getJSON<StockData[]>(env.SMART_NOTE_KV, `users/${userId}/stocks`) || []
  
  const newStock: StockData = {
    id: generateId(),
    symbol: body.symbol.toUpperCase(),
    buyPrice: body.buyPrice,
    quantity: body.quantity,
    targetProfit: body.targetProfit,
    stopLoss: body.stopLoss,
    alerts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  stocks.push(newStock)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`, stocks)
  
  return jsonResponse(newStock)
}

export async function handleUpdateStock(userId: string, stockId: string, request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Partial<StockData>
  const stocks = await getJSON<StockData[]>(env.SMART_NOTE_KV, `users/${userId}/stocks`) || []
  const index = stocks.findIndex(s => s.id === stockId)
  
  if (index === -1) {
    return errorResponse('Stock not found', 404)
  }
  
  const updatedStock = {
    ...stocks[index],
    ...body,
    updatedAt: new Date().toISOString()
  }
  
  stocks[index] = updatedStock
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`, stocks)
  
  return jsonResponse(updatedStock)
}

export async function handleDeleteStock(userId: string, stockId: string, env: Env): Promise<Response> {
  const stocks = await getJSON<StockData[]>(env.SMART_NOTE_KV, `users/${userId}/stocks`) || []
  const newStocks = stocks.filter(s => s.id !== stockId)
  
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`, newStocks)
  await unregisterAlertUserIfEmpty(userId, env)
  
  return jsonResponse({ success: true })
}

// ── Stock Alert CRUD ──────────────────────────────────────────

export async function handleAddStockAlert(userId: string, stockId: string, request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { targetPrice: number; direction: 'above' | 'below'; label?: string }
  
  if (!body.targetPrice || !body.direction) {
    return errorResponse('Missing targetPrice or direction', 400)
  }

  const stocks = await getJSON<StockData[]>(env.SMART_NOTE_KV, `users/${userId}/stocks`) || []
  const stock = stocks.find(s => s.id === stockId)
  if (!stock) return errorResponse('Stock not found', 404)

  if (!stock.alerts) stock.alerts = []

  // Max 10 alerts per stock
  if (stock.alerts.length >= 10) {
    return errorResponse('Maximum 10 alerts per stock', 400)
  }

  const newAlert: StockAlert = {
    id: generateId(),
    symbol: stock.symbol,
    targetPrice: body.targetPrice,
    direction: body.direction,
    label: body.label || (body.direction === 'below' ? 'Mốc mua' : 'Mốc bán'),
    triggered: false,
    createdAt: new Date().toISOString()
  }

  stock.alerts.push(newAlert)
  stock.updatedAt = new Date().toISOString()
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`, stocks)

  // Register user for cron-based alert checking
  await registerAlertUser(userId, env)

  return jsonResponse(newAlert)
}

export async function handleDeleteStockAlert(userId: string, stockId: string, alertId: string, env: Env): Promise<Response> {
  const stocks = await getJSON<StockData[]>(env.SMART_NOTE_KV, `users/${userId}/stocks`) || []
  const stock = stocks.find(s => s.id === stockId)
  if (!stock) return errorResponse('Stock not found', 404)

  if (!stock.alerts) return errorResponse('Alert not found', 404)
  stock.alerts = stock.alerts.filter(a => a.id !== alertId)
  stock.updatedAt = new Date().toISOString()

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`, stocks)
  await unregisterAlertUserIfEmpty(userId, env)

  return jsonResponse({ success: true })
}

export async function handleResetStockAlert(userId: string, stockId: string, alertId: string, env: Env): Promise<Response> {
  const stocks = await getJSON<StockData[]>(env.SMART_NOTE_KV, `users/${userId}/stocks`) || []
  const stock = stocks.find(s => s.id === stockId)
  if (!stock) return errorResponse('Stock not found', 404)

  const alert = stock.alerts?.find(a => a.id === alertId)
  if (!alert) return errorResponse('Alert not found', 404)

  alert.triggered = false
  alert.notifiedAt = undefined
  stock.updatedAt = new Date().toISOString()

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`, stocks)
  await registerAlertUser(userId, env)

  return jsonResponse(alert)
}
