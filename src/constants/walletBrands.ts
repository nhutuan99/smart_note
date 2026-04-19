/**
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
  'vietinbank': {
    abbr: 'ICB',
    bgColor: '#003c7d',
    textColor: '#ffffff',
    fullName: 'Ngân hàng TMCP Công thương Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/ICB.png'
  },
  'vietcombank': {
    abbr: 'VCB',
    bgColor: '#006838',
    textColor: '#ffffff',
    fullName: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/VCB.png'
  },
  'bidv': {
    abbr: 'BIDV',
    bgColor: '#00529b',
    textColor: '#ffffff',
    fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/BIDV.png'
  },
  'agribank': {
    abbr: 'VBA',
    bgColor: '#d11f26',
    textColor: '#ffffff',
    fullName: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/VBA.png'
  },
  'ocb': {
    abbr: 'OCB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Phương Đông',
    logoUrl: 'https://cdn.vietqr.io/img/OCB.png'
  },
  'mbbank': {
    abbr: 'MB',
    bgColor: '#1e3765',
    textColor: '#ffffff',
    fullName: 'Ngân hàng TMCP Quân đội',
    logoUrl: 'https://cdn.vietqr.io/img/MB.png'
  },
  'techcombank': {
    abbr: 'TCB',
    bgColor: '#e62e2e',
    textColor: '#ffffff',
    fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/TCB.png'
  },
  'acb': {
    abbr: 'ACB',
    bgColor: '#1a3c6e',
    textColor: '#ffffff',
    fullName: 'Ngân hàng TMCP Á Châu',
    logoUrl: 'https://cdn.vietqr.io/img/ACB.png'
  },
  'vpbank': {
    abbr: 'VPB',
    bgColor: '#00843d',
    textColor: '#ffffff',
    fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
    logoUrl: 'https://cdn.vietqr.io/img/VPB.png'
  },
  'tpbank': {
    abbr: 'TPB',
    bgColor: '#7b2d8e',
    textColor: '#ffffff',
    fullName: 'Ngân hàng TMCP Tiên Phong',
    logoUrl: 'https://cdn.vietqr.io/img/TPB.png'
  },
  'sacombank': {
    abbr: 'STB',
    bgColor: '#003087',
    textColor: '#ffffff',
    fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín',
    logoUrl: 'https://cdn.vietqr.io/img/STB.png'
  },
  'hdbank': {
    abbr: 'HDB',
    bgColor: '#e31837',
    textColor: '#ffffff',
    fullName: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh',
    logoUrl: 'https://cdn.vietqr.io/img/HDB.png'
  },
  'vietcapitalbank': {
    abbr: 'VCCB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Bản Việt',
    logoUrl: 'https://cdn.vietqr.io/img/VCCB.png'
  },
  'scb': {
    abbr: 'SCB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Sài Gòn',
    logoUrl: 'https://cdn.vietqr.io/img/SCB.png'
  },
  'vib': {
    abbr: 'VIB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Quốc tế Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/VIB.png'
  },
  'shb': {
    abbr: 'SHB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Sài Gòn - Hà Nội',
    logoUrl: 'https://cdn.vietqr.io/img/SHB.png'
  },
  'eximbank': {
    abbr: 'EIB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/EIB.png'
  },
  'msb': {
    abbr: 'MSB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Hàng Hải Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/MSB.png'
  },
  'cake': {
    abbr: 'CAKE',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'TMCP Việt Nam Thịnh Vượng - Ngân hàng số CAKE by VPBank',
    logoUrl: 'https://cdn.vietqr.io/img/CAKE.png'
  },
  'ubank': {
    abbr: 'Ubank',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'TMCP Việt Nam Thịnh Vượng - Ngân hàng số Ubank by VPBank',
    logoUrl: 'https://cdn.vietqr.io/img/UBANK.png'
  },
  'viettelmoney': {
    abbr: 'VTLMONEY',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Tổng Công ty Dịch vụ số Viettel - Chi nhánh tập đoàn công nghiệp viễn thông Quân Đội',
    logoUrl: 'https://cdn.vietqr.io/img/VIETTELMONEY.png'
  },
  'timo': {
    abbr: 'TIMO',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng số Timo by Ban Viet Bank (Timo by Ban Viet Bank)',
    logoUrl: 'https://vietqr.net/portal-service/resources/icons/TIMO.png'
  },
  'vnptmoney': {
    abbr: 'VNPTMONEY',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'VNPT Money',
    logoUrl: 'https://cdn.vietqr.io/img/VNPTMONEY.png'
  },
  'saigonbank': {
    abbr: 'SGICB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Sài Gòn Công Thương',
    logoUrl: 'https://cdn.vietqr.io/img/SGICB.png'
  },
  'bacabank': {
    abbr: 'BAB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Bắc Á',
    logoUrl: 'https://cdn.vietqr.io/img/BAB.png'
  },
  'momo': {
    abbr: 'MoMo',
    bgColor: '#d82d8b',
    textColor: '#ffffff',
    fullName: 'MoMo (M-Service)',
    logoUrl: 'https://cdn.vietqr.io/img/momo.png'
  },
  'pvcombank pay': {
    abbr: 'PVDB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Đại Chúng Việt Nam Ngân hàng số',
    logoUrl: 'https://cdn.vietqr.io/img/PVCB.png'
  },
  'pvcombank': {
    abbr: 'PVCB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Đại Chúng Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/PVCB.png'
  },
  'mbv': {
    abbr: 'MBV',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TNHH MTV Việt Nam Hiện Đại',
    logoUrl: 'https://cdn.vietqr.io/img/MBV.png'
  },
  'ncb': {
    abbr: 'NCB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Quốc Dân',
    logoUrl: 'https://cdn.vietqr.io/img/NCB.png'
  },
  'shinhanbank': {
    abbr: 'SHBVN',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TNHH MTV Shinhan Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/SHBVN.png'
  },
  'abbank': {
    abbr: 'ABB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP An Bình',
    logoUrl: 'https://cdn.vietqr.io/img/ABB.png'
  },
  'vietabank': {
    abbr: 'VAB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Việt Á',
    logoUrl: 'https://cdn.vietqr.io/img/VAB.png'
  },
  'namabank': {
    abbr: 'NAB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Nam Á',
    logoUrl: 'https://cdn.vietqr.io/img/NAB.png'
  },
  'pgbank': {
    abbr: 'PGB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Thịnh vượng và Phát triển',
    logoUrl: 'https://cdn.vietqr.io/img/PGB.png'
  },
  'vietbank': {
    abbr: 'VIETBANK',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Việt Nam Thương Tín',
    logoUrl: 'https://cdn.vietqr.io/img/VIETBANK.png'
  },
  'baovietbank': {
    abbr: 'BVB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Bảo Việt',
    logoUrl: 'https://cdn.vietqr.io/img/BVB.png'
  },
  'seabank': {
    abbr: 'SEAB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Đông Nam Á',
    logoUrl: 'https://cdn.vietqr.io/img/SEAB.png'
  },
  'coopbank': {
    abbr: 'COOPBANK',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng Hợp tác xã Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/COOPBANK.png'
  },
  'lpbank': {
    abbr: 'LPB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Lộc Phát Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/LPB.png'
  },
  'kienlongbank': {
    abbr: 'KLB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TMCP Kiên Long',
    logoUrl: 'https://cdn.vietqr.io/img/KLB.png'
  },
  'kbank': {
    abbr: 'KBank',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng Đại chúng TNHH Kasikornbank',
    logoUrl: 'https://cdn.vietqr.io/img/KBANK.png'
  },
  'mafc': {
    abbr: 'MAFC',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Công ty Tài chính TNHH MTV Mirae Asset (Việt Nam) ',
    logoUrl: 'https://cdn.vietqr.io/img/MAFC.png'
  },
  'hongleong': {
    abbr: 'HLBVN',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TNHH MTV Hong Leong Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/HLBVN.png'
  },
  'kebhanahn': {
    abbr: 'KEBHANAHN',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng KEB Hana – Chi nhánh Hà Nội',
    logoUrl: 'https://cdn.vietqr.io/img/KEBHANAHN.png'
  },
  'kebhanahcm': {
    abbr: 'KEBHANAHCM',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng KEB Hana – Chi nhánh Thành phố Hồ Chí Minh',
    logoUrl: 'https://cdn.vietqr.io/img/KEBHANAHCM.png'
  },
  'citibank': {
    abbr: 'CITIBANK',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng Citibank, N.A. - Chi nhánh Hà Nội',
    logoUrl: 'https://cdn.vietqr.io/img/CITIBANK.png'
  },
  'cbbank': {
    abbr: 'CBB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng Thương mại TNHH MTV Xây dựng Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/CBB.png'
  },
  'cimb': {
    abbr: 'CIMB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TNHH MTV CIMB Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/CIMB.png'
  },
  'dbsbank': {
    abbr: 'DBS',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'DBS Bank Ltd - Chi nhánh Thành phố Hồ Chí Minh',
    logoUrl: 'https://cdn.vietqr.io/img/DBS.png'
  },
  'vikki': {
    abbr: 'Vikki',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TNHH MTV Số Vikki',
    logoUrl: 'https://cdn.vietqr.io/img/Vikki.png'
  },
  'vbsp': {
    abbr: 'VBSP',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng Chính sách Xã hội',
    logoUrl: 'https://cdn.vietqr.io/img/VBSP.png'
  },
  'gpbank': {
    abbr: 'GPB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng Thương mại TNHH MTV Dầu Khí Toàn Cầu',
    logoUrl: 'https://cdn.vietqr.io/img/GPB.png'
  },
  'kookminhcm': {
    abbr: 'KBHCM',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng Kookmin - Chi nhánh Thành phố Hồ Chí Minh',
    logoUrl: 'https://cdn.vietqr.io/img/KBHCM.png'
  },
  'kookminhn': {
    abbr: 'KBHN',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng Kookmin - Chi nhánh Hà Nội',
    logoUrl: 'https://cdn.vietqr.io/img/KBHN.png'
  },
  'woori': {
    abbr: 'WVN',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TNHH MTV Woori Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/WVN.png'
  },
  'vrb': {
    abbr: 'VRB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng Liên doanh Việt - Nga',
    logoUrl: 'https://cdn.vietqr.io/img/VRB.png'
  },
  'hsbc': {
    abbr: 'HSBC',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TNHH MTV HSBC (Việt Nam)',
    logoUrl: 'https://cdn.vietqr.io/img/HSBC.png'
  },
  'ibkhn': {
    abbr: 'IBK - HN',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh Hà Nội',
    logoUrl: 'https://cdn.vietqr.io/img/IBK.png'
  },
  'ibkhcm': {
    abbr: 'IBK - HCM',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh TP. Hồ Chí Minh',
    logoUrl: 'https://cdn.vietqr.io/img/IBK.png'
  },
  'indovinabank': {
    abbr: 'IVB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TNHH Indovina',
    logoUrl: 'https://cdn.vietqr.io/img/IVB.png'
  },
  'unitedoverseas': {
    abbr: 'UOB',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng United Overseas - Chi nhánh TP. Hồ Chí Minh',
    logoUrl: 'https://cdn.vietqr.io/img/UOB.png'
  },
  'nonghyup': {
    abbr: 'NHB HN',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng Nonghyup - Chi nhánh Hà Nội',
    logoUrl: 'https://cdn.vietqr.io/img/NHB.png'
  },
  'standardchartered': {
    abbr: 'SCVN',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TNHH MTV Standard Chartered Bank Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/SCVN.png'
  },
  'publicbank': {
    abbr: 'PBVN',
    bgColor: '#ffffff',
    textColor: '#000000',
    fullName: 'Ngân hàng TNHH MTV Public Việt Nam',
    logoUrl: 'https://cdn.vietqr.io/img/PBVN.png'
  },


  // ── E-Wallets ──
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
