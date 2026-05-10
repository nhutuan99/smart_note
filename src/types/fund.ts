// ── Fund Certificate (Chứng chỉ quỹ mở) ──

export interface FundPosition {
  id: string
  symbol: string         // e.g. "SSISCA", "VESAF"
  productId?: number     // Fmarket internal ID for NAV history queries
  buyPrice: number       // Giá mua (VND/CCQ)
  quantity: number       // Số lượng chứng chỉ quỹ
  fundName?: string      // Tên quỹ đầy đủ
  fundType?: 'STOCK' | 'BOND' | 'BALANCED' | string
  createdAt: string
  updatedAt: string
}

export interface FundNavPoint {
  nav: number
  time: number           // ms timestamp
}
