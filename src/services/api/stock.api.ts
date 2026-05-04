import { httpClient } from '@/shared/api/httpClient'
import type { StockPosition, StockAlert } from '@/types'

export const stockApi = {
  getPositions: () => httpClient.get<StockPosition[]>('/api/stocks'),
  
  createPosition: (data: Partial<StockPosition>) => 
    httpClient.post<StockPosition>('/api/stocks', data),
    
  updatePosition: (id: string, data: Partial<StockPosition>) => 
    httpClient.put<StockPosition>(`/api/stocks/${id}`, data),
    
  deletePosition: (id: string) => 
    httpClient.del(`/api/stocks/${id}`),

  getCurrentPrice: (symbol: string) =>
    httpClient.get<{ currentPrice: number, symbol: string }>(`/api/proxy/stock-price?symbol=${symbol}`),

  getStockHistory: (symbol: string, days: number = 7) =>
    httpClient.get<{ history: { price: number, time: number }[], symbol: string }>(`/api/proxy/stock-history?symbol=${symbol}&days=${days}`),

  // ── Alert CRUD ──
  addAlert: (stockId: string, data: { targetPrice: number; direction: 'above' | 'below'; label?: string }) =>
    httpClient.post<StockAlert>(`/api/stocks/${stockId}/alerts`, data),

  deleteAlert: (stockId: string, alertId: string) =>
    httpClient.del(`/api/stocks/${stockId}/alerts/${alertId}`),

  resetAlert: (stockId: string, alertId: string) =>
    httpClient.post<StockAlert>(`/api/stocks/${stockId}/alerts/${alertId}/reset`)
}
