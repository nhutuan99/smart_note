/**
 * Wallet Brand Configuration
 *
 * Maps wallet names to brand-specific styling and logo URLs.
 * Logos are sourced from Logo.dev (free tier) with fallback to styled badges.
 */

export interface BrandConfig {
  abbr: string
  bgColor: string
  textColor: string
  fullName: string
  logoUrl: string
}

export const WALLET_BRANDS: Record<string, BrandConfig> = {
  // ── Vietnamese Banks ──
  techcombank: {
    abbr: 'TCB',
    bgColor: '#e62e2e',
    textColor: '#ffffff',
    fullName: 'Techcombank',
    logoUrl: 'https://img.logo.dev/techcombank.com.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },
  tpbank: {
    abbr: 'TP',
    bgColor: '#7b2d8e',
    textColor: '#ffffff',
    fullName: 'TPBank',
    logoUrl: 'https://img.logo.dev/tpb.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },
  vietcombank: {
    abbr: 'VCB',
    bgColor: '#006838',
    textColor: '#ffffff',
    fullName: 'Vietcombank',
    logoUrl: 'https://img.logo.dev/vietcombank.com.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },
  mbbank: {
    abbr: 'MB',
    bgColor: '#1e3765',
    textColor: '#ffffff',
    fullName: 'MBBank',
    logoUrl: 'https://img.logo.dev/mbbank.com.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },
  bidv: {
    abbr: 'BIDV',
    bgColor: '#00529b',
    textColor: '#ffffff',
    fullName: 'BIDV',
    logoUrl: 'https://img.logo.dev/bidv.com.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },
  agribank: {
    abbr: 'Agri',
    bgColor: '#d11f26',
    textColor: '#ffffff',
    fullName: 'Agribank',
    logoUrl: 'https://img.logo.dev/agribank.com.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },
  vietinbank: {
    abbr: 'CTG',
    bgColor: '#003c7d',
    textColor: '#ffffff',
    fullName: 'VietinBank',
    logoUrl: 'https://img.logo.dev/vietinbank.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },
  acb: {
    abbr: 'ACB',
    bgColor: '#1a3c6e',
    textColor: '#ffffff',
    fullName: 'ACB',
    logoUrl: 'https://img.logo.dev/acb.com.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },
  vpbank: {
    abbr: 'VP',
    bgColor: '#00843d',
    textColor: '#ffffff',
    fullName: 'VPBank',
    logoUrl: 'https://img.logo.dev/vpbank.com.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },
  hdbank: {
    abbr: 'HD',
    bgColor: '#e31837',
    textColor: '#ffffff',
    fullName: 'HDBank',
    logoUrl: 'https://img.logo.dev/hdbank.com.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },
  sacombank: {
    abbr: 'STB',
    bgColor: '#003087',
    textColor: '#ffffff',
    fullName: 'Sacombank',
    logoUrl: 'https://img.logo.dev/sacombank.com.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },

  // ── E-Wallets ──
  momo: {
    abbr: 'M',
    bgColor: '#d82d8b',
    textColor: '#ffffff',
    fullName: 'MoMo',
    logoUrl: 'https://img.logo.dev/momo.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },
  zalopay: {
    abbr: 'Z',
    bgColor: '#0068ff',
    textColor: '#ffffff',
    fullName: 'ZaloPay',
    logoUrl: 'https://img.logo.dev/zalopay.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },
  vnpay: {
    abbr: 'VN',
    bgColor: '#003087',
    textColor: '#ffffff',
    fullName: 'VNPay',
    logoUrl: 'https://img.logo.dev/vnpay.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },
  shopee: {
    abbr: 'S',
    bgColor: '#ee4d2d',
    textColor: '#ffffff',
    fullName: 'ShopeePay',
    logoUrl: 'https://img.logo.dev/shopee.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },

  // ── International ──
  visa: {
    abbr: 'V',
    bgColor: '#1a1f71',
    textColor: '#f7b600',
    fullName: 'Visa',
    logoUrl: 'https://img.logo.dev/visa.com?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },
  mastercard: {
    abbr: 'MC',
    bgColor: '#eb001b',
    textColor: '#ffffff',
    fullName: 'Mastercard',
    logoUrl: 'https://img.logo.dev/mastercard.com?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
  },

  // ── Cash ──
  'tiền mặt': {
    abbr: '₫',
    bgColor: '#10b981',
    textColor: '#000000',
    fullName: 'Tiền mặt',
    logoUrl: ''
  },
  cash: {
    abbr: '₫',
    bgColor: '#10b981',
    textColor: '#000000',
    fullName: 'Cash',
    logoUrl: ''
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
