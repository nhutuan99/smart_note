import { Env } from '../types'
import { jsonResponse, errorResponse } from '../utils/response'

/**
 * Handle /api/proxy/location
 * Detects the user's location based on Cloudflare's `request.cf` object.
 * If running locally without `cf`, falls back to a free IP API.
 */
export async function handleProxyLocation(request: Request): Promise<Response> {
  const cf = request.cf

  // When running on Cloudflare Workers, `cf` contains geolocation data
  if (cf && cf.latitude && cf.longitude) {
    let city = cf.city as string || 'Vị trí của bạn'
    if (city.includes('Ho Chi Minh') || city === 'Thành phố Hồ Chí Minh' || city === 'TP.HCM' || city.includes('TP. HCM')) city = 'Ho Chi Minh City'
    if (city.includes('Ha Noi') || city === 'Hanoi') city = 'Hà Nội'
    if (city.includes('Da Nang') || city === 'Danang') city = 'Đà Nẵng'

    return jsonResponse({
      success: true,
      data: {
        lat: parseFloat(cf.latitude as string),
        lon: parseFloat(cf.longitude as string),
        city,
        country: cf.country || ''
      }
    })
  }

  // Fallback for local dev (wrangler dev might not populate cf)
  try {
    const res = await fetch('https://freeipapi.com/api/json')
    const data = await res.json() as any
    if (data && data.latitude && data.longitude) {
      let city = data.cityName || 'Vị trí của bạn'
      if (city.includes('Ho Chi Minh') || city === 'Thành phố Hồ Chí Minh' || city === 'TP.HCM' || city.includes('TP. HCM')) city = 'Ho Chi Minh City'
      if (city.includes('Ha Noi') || city === 'Hanoi') city = 'Hà Nội'
      if (city.includes('Da Nang') || city === 'Danang') city = 'Đà Nẵng'
      
      return jsonResponse({
        success: true,
        data: {
          lat: data.latitude,
          lon: data.longitude,
          city,
          country: data.countryName || ''
        }
      })
    }
  } catch (err) {
    // Ignore and fallback
  }

  return jsonResponse({
    success: true,
    data: {
      lat: 10.8231,
      lon: 106.6297,
      city: 'Ho Chi Minh City',
      country: 'Việt Nam'
    }
  })
}

/**
 * Handle /api/proxy/weather
 * Requires ?lat=...&lon=...
 * Proxies requests to Open-Meteo to bypass client-side adblockers
 */
export async function handleProxyWeather(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const lat = url.searchParams.get('lat')
  const lon = url.searchParams.get('lon')

  if (!lat || !lon) {
    return errorResponse('Missing lat and lon query parameters', 400)
  }

  try {
    const [weatherRes, aqiRes] = await Promise.allSettled([
      fetch(
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,uv_index` +
        `&timezone=auto`
      ),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality` +
        `?latitude=${lat}&longitude=${lon}` +
        `&current=us_aqi,pm2_5` +
        `&timezone=auto`
      )
    ])

    if (weatherRes.status === 'rejected') {
      return errorResponse(`Weather proxy failed: ${weatherRes.reason?.message || weatherRes.reason}`, 502)
    }

    if (weatherRes.status === 'fulfilled' && !weatherRes.value.ok) {
      return errorResponse(`Open-Meteo returned HTTP ${weatherRes.value.status}`, 502)
    }

    let weatherData = null
    let aqiData = null

    if (weatherRes.status === 'fulfilled') {
      weatherData = await weatherRes.value.json()
    }

    if (aqiRes.status === 'fulfilled' && aqiRes.value.ok) {
      aqiData = await aqiRes.value.json()
    }

    return jsonResponse({
      success: true,
      data: {
        weather: weatherData,
        aqi: aqiData
      }
    })
  } catch (err: any) {
    return errorResponse(err.message, 500)
  }
}

/**
 * Handle /api/proxy/exchange-rate
 * Proxies request to exchangerate-api.com for real-time USD/VND data
 */
export async function handleProxyExchangeRate(request: Request): Promise<Response> {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      headers: {
        'User-Agent': 'Cloudflare-Worker'
      }
    })

    if (!res.ok) {
      return errorResponse(`Exchange rate API HTTP ${res.status}`, 502)
    }

    const data = await res.json() as any
    const vndRate = data?.rates?.VND
    
    if (!vndRate) {
      return errorResponse('Failed to parse exchange rate', 500)
    }

    // Convert from (1 USD = X VND) to (1 VND = X USD)
    const usdPerVnd = 1 / vndRate

    return jsonResponse({
      success: true,
      data: {
        vnd: { usd: usdPerVnd }
      }
    })
  } catch (err: any) {
    return errorResponse(err.message, 500)
  }
}

/**
 * Handle /api/proxy/stock-price
 * Fetch from DNSE API and cache in KV to prevent rate limits
 */
export async function handleProxyStockPrice(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const symbol = url.searchParams.get('symbol')?.toUpperCase()

  if (!symbol) {
    return errorResponse('Missing symbol query parameter', 400)
  }

  const cacheKey = `public/stocks/${symbol}`
  const now = Date.now()

  try {
    // Try cache first (valid for 5 minutes)
    const cachedStr = await env.SMART_NOTE_KV.get(cacheKey)
    if (cachedStr) {
      const cached = JSON.parse(cachedStr)
      if (now - cached.timestamp < 5 * 60 * 1000) {
        return jsonResponse({ success: true, data: { currentPrice: cached.price, symbol } })
      }
    }

    // Fetch new price
    const to = Math.floor(now / 1000)
    const from = to - 86400 * 15 // Last 15 days to handle holidays
    const res = await fetch(`https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${from}&to=${to}&symbol=${symbol}&resolution=1D`)

    if (!res.ok) {
      return errorResponse(`DNSE API HTTP ${res.status}`, 502)
    }

    const data = await res.json() as any
    if (!data || !data.c || data.c.length === 0) {
      return errorResponse('Symbol not found or no data', 404)
    }

    const currentPrice = data.c[data.c.length - 1]

    // Cache the result
    await env.SMART_NOTE_KV.put(cacheKey, JSON.stringify({ price: currentPrice, timestamp: now }), { expirationTtl: 3600 })

    return jsonResponse({
      success: true,
      data: { currentPrice, symbol }
    })
  } catch (err: any) {
    return errorResponse(err.message, 500)
  }
}
