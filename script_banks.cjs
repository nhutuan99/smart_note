const fs = require('fs')

async function run() {
  const res = await fetch('https://api.vietqr.io/v2/banks')
  const json = await res.json()
  const banks = json.data

  let result = `/**
 * Wallet Brand Configuration
 *
 * Generated from VietQR API: https://api.vietqr.io/v2/banks
 */

export interface BrandConfig {
  abbr: string
  bgColor: string
  textColor: string
  fullName: string
  logoUrl: string
}

export const WALLET_BRANDS: Record<string, BrandConfig> = {
  // ── Vietnamese Banks (from VietQR API) ──
`

  // Map of known custom colors we want to keep
  const customColors = {
    'techcombank': { bg: '#e62e2e', text: '#ffffff' },
    'tpbank': { bg: '#7b2d8e', text: '#ffffff' },
    'vietcombank': { bg: '#006838', text: '#ffffff' },
    'mbbank': { bg: '#1e3765', text: '#ffffff' },
    'bidv': { bg: '#00529b', text: '#ffffff' },
    'agribank': { bg: '#d11f26', text: '#ffffff' },
    'vietinbank': { bg: '#003c7d', text: '#ffffff' },
    'acb': { bg: '#1a3c6e', text: '#ffffff' },
    'vpbank': { bg: '#00843d', text: '#ffffff' },
    'hdbank': { bg: '#e31837', text: '#ffffff' },
    'sacombank': { bg: '#003087', text: '#ffffff' }
  }

  banks.forEach(bank => {
    // lowercase key
    const shortNameKey = (bank.shortName || bank.short_name || bank.code).toLowerCase()
    const color = customColors[shortNameKey] || { bg: '#ffffff', text: '#000000' }
    
    result += `  '${shortNameKey}': {
    abbr: '${bank.code}',
    bgColor: '${color.bg}',
    textColor: '${color.text}',
    fullName: '${bank.name}',
    logoUrl: '${bank.logo}'
  },\n`
  })

  // Add other local non-bank brands
  result += `

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
  viettelpay: {
    abbr: 'VT',
    bgColor: '#ee0033',
    textColor: '#ffffff',
    fullName: 'ViettelPay',
    logoUrl: 'https://img.logo.dev/viettel.com.vn?token=pk_a8zHRmHcTi-Fv0L0E8QNRQ&size=80&format=png'
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
    textColor: '#ffffff',
    fullName: 'Tiền mặt',
    logoUrl: ''
  },
  cash: {
    abbr: '₫',
    bgColor: '#10b981',
    textColor: '#ffffff',
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

  // Partial match: sort keys by length descending to prefer longer specific matches
  const sortedKeys = Object.keys(WALLET_BRANDS).sort((a, b) => b.length - a.length)
  for (const key of sortedKeys) {
    if (lower.includes(key) || key.includes(lower)) {
      return WALLET_BRANDS[key]
    }
  }

  return null
}
`
  
  fs.writeFileSync('src/constants/walletBrands.ts', result)
  console.log('Done.')
}

run()
