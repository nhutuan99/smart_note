/**
 * Wallet Brand Configuration
 *
 * Maps wallet names to brand-specific styling (color, abbreviation).
 * Used in WalletsView and other finance components to show
 * recognizable brand badges instead of generic emojis.
 */

export interface BrandConfig {
  abbr: string       // Short abbreviation (1-3 chars)
  bgColor: string    // Brand primary color
  textColor: string  // Text color for contrast
  fullName: string   // Full display name
}

export const WALLET_BRANDS: Record<string, BrandConfig> = {
  // ── Vietnamese Banks ──
  techcombank: {
    abbr: 'TCB',
    bgColor: '#e62e2e',
    textColor: '#ffffff',
    fullName: 'Techcombank'
  },
  tpbank: {
    abbr: 'TP',
    bgColor: '#7b2d8e',
    textColor: '#ffffff',
    fullName: 'TPBank'
  },
  vietcombank: {
    abbr: 'VCB',
    bgColor: '#006838',
    textColor: '#ffffff',
    fullName: 'Vietcombank'
  },
  mbbank: {
    abbr: 'MB',
    bgColor: '#1e3765',
    textColor: '#ffffff',
    fullName: 'MBBank'
  },
  bidv: {
    abbr: 'BIDV',
    bgColor: '#00529b',
    textColor: '#ffffff',
    fullName: 'BIDV'
  },
  agribank: {
    abbr: 'Agri',
    bgColor: '#d11f26',
    textColor: '#ffffff',
    fullName: 'Agribank'
  },
  vietinbank: {
    abbr: 'CTG',
    bgColor: '#003c7d',
    textColor: '#ffffff',
    fullName: 'VietinBank'
  },
  acb: {
    abbr: 'ACB',
    bgColor: '#1a3c6e',
    textColor: '#ffffff',
    fullName: 'ACB'
  },
  vpbank: {
    abbr: 'VP',
    bgColor: '#00843d',
    textColor: '#ffffff',
    fullName: 'VPBank'
  },
  hdbank: {
    abbr: 'HD',
    bgColor: '#e31837',
    textColor: '#ffffff',
    fullName: 'HDBank'
  },
  sacombank: {
    abbr: 'STB',
    bgColor: '#003087',
    textColor: '#ffffff',
    fullName: 'Sacombank'
  },

  // ── E-Wallets ──
  momo: {
    abbr: 'M',
    bgColor: '#d82d8b',
    textColor: '#ffffff',
    fullName: 'MoMo'
  },
  zalopay: {
    abbr: 'Z',
    bgColor: '#0068ff',
    textColor: '#ffffff',
    fullName: 'ZaloPay'
  },
  vnpay: {
    abbr: 'VN',
    bgColor: '#003087',
    textColor: '#ffffff',
    fullName: 'VNPay'
  },
  shopee: {
    abbr: 'S',
    bgColor: '#ee4d2d',
    textColor: '#ffffff',
    fullName: 'ShopeePay'
  },

  // ── International ──
  visa: {
    abbr: 'V',
    bgColor: '#1a1f71',
    textColor: '#f7b600',
    fullName: 'Visa'
  },
  mastercard: {
    abbr: 'MC',
    bgColor: '#eb001b',
    textColor: '#ffffff',
    fullName: 'Mastercard'
  },
  paypal: {
    abbr: 'PP',
    bgColor: '#003087',
    textColor: '#ffffff',
    fullName: 'PayPal'
  },

  // ── Cash ──
  'tiền mặt': {
    abbr: '₫',
    bgColor: '#10b981',
    textColor: '#000000',
    fullName: 'Tiền mặt'
  },
  cash: {
    abbr: '₫',
    bgColor: '#10b981',
    textColor: '#000000',
    fullName: 'Cash'
  }
}

/**
 * Get brand config for a wallet name.
 * Matches by checking if the wallet name contains a known brand keyword.
 */
export function getWalletBrand(walletName: string): BrandConfig | null {
  const lower = walletName.toLowerCase()

  // Exact match first
  if (WALLET_BRANDS[lower]) return WALLET_BRANDS[lower]

  // Partial match
  for (const [key, config] of Object.entries(WALLET_BRANDS)) {
    if (lower.includes(key) || key.includes(lower)) return config
  }

  return null
}
