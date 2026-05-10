import { Env } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'
import { generateId } from '../utils/crypto'
import { getJSON, putJSON } from '../services/kv.service'

interface FundData {
  id: string
  symbol: string
  productId?: number
  buyPrice: number
  quantity: number
  fundName?: string
  fundType?: string
  createdAt: string
  updatedAt: string
}

export async function handleListFunds(userId: string, env: Env): Promise<Response> {
  const funds = (await getJSON<FundData[]>(env.SMART_NOTE_KV, `users/${userId}/funds`)) || []
  return jsonResponse({ success: true, data: funds })
}

export async function handleCreateFund(userId: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as any

  if (!body.symbol || typeof body.symbol !== 'string') {
    return errorResponse('Symbol is required', 400)
  }
  if (typeof body.buyPrice !== 'number' || body.buyPrice <= 0) {
    return errorResponse('Buy price must be a positive number', 400)
  }
  if (typeof body.quantity !== 'number' || body.quantity <= 0) {
    return errorResponse('Quantity must be a positive number', 400)
  }

  const funds = (await getJSON<FundData[]>(env.SMART_NOTE_KV, `users/${userId}/funds`)) || []

  const fund: FundData = {
    id: generateId(),
    symbol: body.symbol.toUpperCase().trim(),
    productId: typeof body.productId === 'number' ? body.productId : undefined,
    buyPrice: body.buyPrice,
    quantity: body.quantity,
    fundName: typeof body.fundName === 'string' ? body.fundName.substring(0, 200) : undefined,
    fundType: typeof body.fundType === 'string' ? body.fundType : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  funds.push(fund)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/funds`, funds)
  return jsonResponse({ success: true, data: fund }, 201)
}

export async function handleUpdateFund(userId: string, fundId: string, request: Request, env: Env): Promise<Response> {
  const funds = (await getJSON<FundData[]>(env.SMART_NOTE_KV, `users/${userId}/funds`)) || []
  const idx = funds.findIndex(f => f.id === fundId)
  if (idx === -1) return errorResponse('Fund not found', 404)

  const body = (await request.json()) as any
  if (body.symbol !== undefined) funds[idx].symbol = body.symbol.toUpperCase().trim()
  if (typeof body.buyPrice === 'number') funds[idx].buyPrice = body.buyPrice
  if (typeof body.quantity === 'number') funds[idx].quantity = body.quantity
  if (body.fundName !== undefined) funds[idx].fundName = body.fundName
  if (body.fundType !== undefined) funds[idx].fundType = body.fundType
  if (typeof body.productId === 'number') funds[idx].productId = body.productId
  funds[idx].updatedAt = new Date().toISOString()

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/funds`, funds)
  return jsonResponse({ success: true, data: funds[idx] })
}

export async function handleDeleteFund(userId: string, fundId: string, env: Env): Promise<Response> {
  const funds = (await getJSON<FundData[]>(env.SMART_NOTE_KV, `users/${userId}/funds`)) || []
  const filtered = funds.filter(f => f.id !== fundId)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/funds`, filtered)
  return jsonResponse({ success: true })
}
