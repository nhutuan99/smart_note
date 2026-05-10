import { httpClient } from '@/shared/api/httpClient'
import type { FundPosition } from '@/types'

export const fundApi = {
  // ── Fund Positions CRUD ──
  getPositions: () =>
    httpClient.get<FundPosition[]>('/api/funds'),

  createPosition: (data: Partial<FundPosition>) =>
    httpClient.post<FundPosition>('/api/funds', data),

  updatePosition: (id: string, data: Partial<FundPosition>) =>
    httpClient.put<FundPosition>(`/api/funds/${id}`, data),

  deletePosition: (id: string) =>
    httpClient.del(`/api/funds/${id}`),

  // ── Fund Market Data (via Worker proxy → Fmarket) ──
  getCurrentNav: (symbol: string) =>
    httpClient.get<{ nav: number; symbol: string }>(
      `/api/proxy/fund-nav?symbol=${encodeURIComponent(symbol)}`,
      { silent: true }
    ),

  getNavHistory: (symbol: string, days = 7) =>
    httpClient.get<{ history: { nav: number; time: number }[]; symbol: string }>(
      `/api/proxy/fund-history?symbol=${encodeURIComponent(symbol)}&days=${days}`,
      { silent: true }
    ),

  // Search funds from Fmarket (cached via worker)
  searchFunds: (query: string) =>
    httpClient.get<{ funds: { symbol: string; name: string; type: string; productId: number }[] }>(
      `/api/proxy/fund-list?q=${encodeURIComponent(query)}`,
      { silent: true }
    )
}
