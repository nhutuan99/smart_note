/**
 * useWeather — Fetches real-time weather & air quality data.
 *
 * APIs used (all completely free, no key required):
 *  - Open-Meteo:       https://open-meteo.com
 *  - Open-Meteo AQI:   https://air-quality-api.open-meteo.com
 *  - ip-api.com:       https://ip-api.com  (IP-based location fallback)
 *  - Browser Geolocation API (primary location source)
 */

import { ref, onMounted } from 'vue'
import { useEventListener } from '@/composables/useEventListener'


// ── Types ─────────────────────────────────────────────────────────────────────

export interface WeatherData {
  temperature: number       // °C
  feelsLike: number         // °C
  humidity: number          // %
  windSpeed: number         // km/h
  weatherCode: number       // WMO code
  uvIndex: number
  city: string
  country: string
  lat: number
  lon: number
}

export interface AirQualityData {
  aqi: number               // US AQI
  pm25: number              // μg/m³
}

export interface TrafficLevel {
  level: 'low' | 'medium' | 'high'
  label: string
  emoji: string
}

// ── WMO Weather Code Map ──────────────────────────────────────────────────────

export const WMO_MAP: Record<number, { label: string; emoji: string }> = {
  0:  { label: 'Trời quang',        emoji: '☀️' },
  1:  { label: 'Ít mây',            emoji: '🌤️' },
  2:  { label: 'Có mây',            emoji: '⛅' },
  3:  { label: 'Nhiều mây',         emoji: '☁️' },
  45: { label: 'Sương mù',          emoji: '🌫️' },
  48: { label: 'Sương mù đặc',      emoji: '🌫️' },
  51: { label: 'Mưa phùn nhẹ',      emoji: '🌦️' },
  53: { label: 'Mưa phùn',          emoji: '🌦️' },
  55: { label: 'Mưa phùn dày',      emoji: '🌧️' },
  61: { label: 'Mưa nhẹ',           emoji: '🌧️' },
  63: { label: 'Mưa vừa',           emoji: '🌧️' },
  65: { label: 'Mưa to',            emoji: '🌧️' },
  71: { label: 'Tuyết nhẹ',         emoji: '🌨️' },
  73: { label: 'Tuyết vừa',         emoji: '🌨️' },
  75: { label: 'Tuyết dày',         emoji: '❄️' },
  80: { label: 'Mưa rào nhẹ',       emoji: '🌦️' },
  81: { label: 'Mưa rào vừa',       emoji: '🌦️' },
  82: { label: 'Mưa rào to',        emoji: '⛈️' },
  95: { label: 'Dông',              emoji: '⛈️' },
  99: { label: 'Dông + mưa đá',     emoji: '⛈️' },
}

export function getWeatherInfo(code: number) {
  // Find nearest code match
  if (WMO_MAP[code]) return WMO_MAP[code]
  // Fallback by range
  if (code <= 3)  return WMO_MAP[code] ?? WMO_MAP[0]
  if (code <= 49) return WMO_MAP[45]
  if (code <= 67) return WMO_MAP[61]
  if (code <= 77) return WMO_MAP[71]
  if (code <= 82) return WMO_MAP[80]
  return WMO_MAP[95]
}

// ── AQI Helpers ───────────────────────────────────────────────────────────────

export function getAqiInfo(aqi: number): { label: string; color: string; emoji: string } {
  if (aqi <= 50)  return { label: 'Tốt',             color: '#10b981', emoji: '😊' }
  if (aqi <= 100) return { label: 'Trung bình',      color: '#f59e0b', emoji: '😐' }
  if (aqi <= 150) return { label: 'Không tốt',       color: '#f97316', emoji: '😷' }
  if (aqi <= 200) return { label: 'Xấu',             color: '#ef4444', emoji: '🤧' }
  if (aqi <= 300) return { label: 'Rất xấu',         color: '#7c3aed', emoji: '☠️' }
  return           { label: 'Nguy hiểm',             color: '#7f1d1d', emoji: '☠️' }
}

// ── Traffic Estimate (time-based, Vietnam patterns) ───────────────────────────

export function getTrafficLevel(): TrafficLevel {
  const now   = new Date()
  const hour  = now.getHours()
  const min   = now.getMinutes()
  const day   = now.getDay() // 0=Sun, 6=Sat
  const t     = hour + min / 60

  // Weekend → generally light
  if (day === 0 || day === 6) {
    if (t >= 10 && t < 12) return { level: 'medium', label: 'Hơi đông',    emoji: '🟡' }
    return                         { level: 'low',    label: 'Thông thoáng', emoji: '🟢' }
  }

  // Weekday peak: morning rush 7–9, evening rush 17–19:30
  if ((t >= 7 && t < 9.5) || (t >= 17 && t < 19.5)) {
    return { level: 'high',   label: 'Đông đúc',    emoji: '🔴' }
  }
  // Semi-peak: lunch 11:30–13, post-evening 19:30–20:30
  if ((t >= 11.5 && t < 13.5) || (t >= 9.5 && t < 11) || (t >= 19.5 && t < 20.5)) {
    return { level: 'medium', label: 'Hơi đông',    emoji: '🟡' }
  }
  return   { level: 'low',    label: 'Thông thoáng', emoji: '🟢' }
}

// ── UV Index Helpers ──────────────────────────────────────────────────────────

export function getUvInfo(uv: number): { label: string; color: string } {
  if (uv <= 2)  return { label: 'Thấp',     color: '#10b981' }
  if (uv <= 5)  return { label: 'Trung bình', color: '#f59e0b' }
  if (uv <= 7)  return { label: 'Cao',       color: '#f97316' }
  if (uv <= 10) return { label: 'Rất cao',   color: '#ef4444' }
  return         { label: 'Cực cao',         color: '#7c3aed' }
}

// ── Greeting ──────────────────────────────────────────────────────────────────

export function getGreeting(name?: string): string {
  const h   = new Date().getHours()
  const who = name ? `, ${name.split(' ').pop()}` : ''
  if (h >= 5  && h < 12) return `Chào buổi sáng${who} ☀️`
  if (h >= 12 && h < 14) return `Chào buổi trưa${who} 🌤️`
  if (h >= 14 && h < 18) return `Chào buổi chiều${who} ⛅`
  if (h >= 18 && h < 22) return `Chào buổi tối${who} 🌆`
  return                         `Còn thức muộn thế${who}? 🌙`
}

// ── Main Composable ───────────────────────────────────────────────────────────

export function useWeather() {
  const weather    = ref<WeatherData | null>(null)
  const airQuality = ref<AirQualityData | null>(null)
  const traffic    = ref<TrafficLevel>(getTrafficLevel())
  const loading    = ref(false)
  const error      = ref('')

  // ── Location detection ────────────────────────────────────────────────────

  async function detectLocation(): Promise<{ lat: number; lon: number; city: string; country: string }> {
    // 1. Browser Geolocation (most accurate)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 6000,
            maximumAge: 10 * 60 * 1000 // 10 min cache
          })
        })
        const { latitude: lat, longitude: lon } = pos.coords

        // Reverse geocode via Nominatim (free, no key)
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=vi`,
            { headers: { 'Accept-Language': 'vi' } }
          )
          const data = await res.json()
          const addr = data.address || {}
          const city =
            addr.city || addr.town || addr.village || addr.county ||
            addr.state_district || addr.state || 'Vị trí của bạn'
          const country = addr.country || ''
          return { lat, lon, city, country }
        } catch {
          return { lat, lon, city: 'Vị trí của bạn', country: '' }
        }
      } catch {
        // Permission denied or timeout → fall through to IP
      }
    }

    // 2. IP-based fallback (using freeipapi which supports HTTPS)
    try {
      const res  = await fetch('https://freeipapi.com/api/json')
      const data = await res.json()
      if (data && data.latitude && data.longitude) {
        let city = data.cityName || 'Vị trí của bạn'
        if (city.includes('Ho Chi Minh') || city === 'Thành phố Hồ Chí Minh') city = 'Hồ Chí Minh'
        if (city.includes('Ha Noi') || city === 'Hanoi') city = 'Hà Nội'
        if (city.includes('Da Nang') || city === 'Danang') city = 'Đà Nẵng'
        return { lat: data.latitude, lon: data.longitude, city, country: data.countryName }
      }
    } catch { /* ignore */ }

    // 2.5 IP-based fallback alternative (ipapi.co)
    try {
      const res = await fetch('https://ipapi.co/json/')
      const data = await res.json()
      if (data && data.latitude && data.longitude) {
        let city = data.city || 'Vị trí của bạn'
        if (city.includes('Ho Chi Minh') || city === 'Thành phố Hồ Chí Minh') city = 'Hồ Chí Minh'
        if (city.includes('Ha Noi') || city === 'Hanoi') city = 'Hà Nội'
        if (city.includes('Da Nang') || city === 'Danang') city = 'Đà Nẵng'
        return { lat: data.latitude, lon: data.longitude, city, country: data.country_name }
      }
    } catch { /* ignore */ }

    // 3. Default to Hanoi
    return { lat: 21.0285, lon: 105.8542, city: 'Hà Nội', country: 'Việt Nam' }
  }

  // ── Fetch weather + AQI ───────────────────────────────────────────────────

  async function fetchWeather() {
    loading.value = true
    error.value   = ''

    try {
      const loc = await detectLocation()

      const [weatherRes, aqiRes] = await Promise.allSettled([
        fetch(
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${loc.lat}&longitude=${loc.lon}` +
          `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,uv_index` +
          `&timezone=auto`
        ),
        fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality` +
          `?latitude=${loc.lat}&longitude=${loc.lon}` +
          `&current=us_aqi,pm2_5` +
          `&timezone=auto`
        )
      ])

      if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
        const wData = await weatherRes.value.json()
        const cur   = wData.current
        weather.value = {
          temperature: Math.round(cur.temperature_2m),
          feelsLike:   Math.round(cur.apparent_temperature),
          humidity:    Math.round(cur.relative_humidity_2m),
          windSpeed:   Math.round(cur.wind_speed_10m),
          weatherCode: cur.weather_code,
          uvIndex:     Math.round(cur.uv_index ?? 0),
          city:        loc.city,
          country:     loc.country,
          lat:         loc.lat,
          lon:         loc.lon,
        }
      }

      if (aqiRes.status === 'fulfilled' && aqiRes.value.ok) {
        const aData = await aqiRes.value.json()
        const cur   = aData.current
        airQuality.value = {
          aqi:  Math.round(cur.us_aqi ?? 0),
          pm25: Math.round(cur.pm2_5  ?? 0),
        }
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Không thể tải dữ liệu thời tiết'
    } finally {
      loading.value = false
    }
  }

  // ── Visibility-based refresh ─────────────────────────────────────────────
  // Fetch on mount (once), then again whenever the tab becomes visible.
  // 5-minute cooldown prevents redundant calls on rapid tab switching.
  // _lastFetchAt is per-instance to avoid cross-mount interference.

  const COOLDOWN_MS = 5 * 60 * 1000
  let _lastFetchAt = 0

  // Override fetchWeather to track last-fetch timestamp after completion
  const _rawFetch = fetchWeather
  async function fetchWeatherWithTracking() {
    await _rawFetch()
    _lastFetchAt = Date.now()
  }

  function _onVisibilityChange() {
    if (document.visibilityState !== 'visible') return
    if (Date.now() - _lastFetchAt < COOLDOWN_MS) return
    fetchWeatherWithTracking()
  }

  onMounted(() => fetchWeatherWithTracking())

  // ✅ useEventListener — auto-cleanup on unmount, no manual removeEventListener
  useEventListener(document, 'visibilitychange', _onVisibilityChange)

  return { weather, airQuality, loading, error, fetchWeather: fetchWeatherWithTracking }
}
