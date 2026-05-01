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
 * Proxies request to fawazahmed0/currency-api
 */
export async function handleProxyExchangeRate(request: Request): Promise<Response> {
  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/vnd.json', {
      headers: {
        'User-Agent': 'Cloudflare-Worker'
      }
    })

    if (!res.ok) {
      return errorResponse(`Exchange rate API HTTP ${res.status}`, 502)
    }

    const data = await res.json()
    return jsonResponse({
      success: true,
      data
    })
  } catch (err: any) {
    return errorResponse(err.message, 500)
  }
}
