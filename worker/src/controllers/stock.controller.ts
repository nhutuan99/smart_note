import { Env, StockData } from '../types'
import { jsonResponse, errorResponse } from '../utils/response'
import { getJSON, putJSON } from '../services/kv.service'

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
  
  return jsonResponse({ success: true })
}
