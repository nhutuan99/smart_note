import { httpClient } from '@/shared/api/httpClient'
import type { StockPosition, ApiResponse } from '@/types'

export const stockApi = {
  getPositions: () => httpClient.get<StockPosition[]>('/api/stocks'),
  
  createPosition: (data: Partial<StockPosition>) => 
    httpClient.post<StockPosition>('/api/stocks', data),
    
  updatePosition: (id: string, data: Partial<StockPosition>) => 
    httpClient.put<StockPosition>(`/api/stocks/${id}`, data),
    
  deletePosition: (id: string) => 
    httpClient.del(`/api/stocks/${id}`),

  getCurrentPrice: (symbol: string) =>
    httpClient.get<{ currentPrice: number, symbol: string }>(`/api/proxy/stock-price?symbol=${symbol}`)
}
