<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  useWeather,
  getWeatherInfo,
  getAqiInfo,
  getUvInfo,
  getGreeting,
  getTrafficLevel,
} from '@/composables/useWeather'
import { RefreshCw, MapPin, Wind, Droplets, Zap, Car, Leaf } from 'lucide-vue-next'

const auth = useAuthStore()

const { weather, airQuality, loading, fetchWeather } = useWeather()

// ── Live clock ──
const now    = ref(new Date())
let clockTid = 0
onMounted(() => {
  clockTid = window.setInterval(() => { now.value = new Date() }, 1000)
})
onUnmounted(() => clearInterval(clockTid))

const timeStr = computed(() => {
  return now.value.toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })
})

const dateStr = computed(() => {
  return now.value.toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
})

// ── Traffic: derived from live clock (no API, no interval) ──
const traffic = computed(() => getTrafficLevel())

// ── Derived ──
const greeting    = computed(() => getGreeting(auth.user?.name ?? undefined))
const weatherInfo = computed(() => weather.value ? getWeatherInfo(weather.value.weatherCode) : null)
const aqiInfo     = computed(() => airQuality.value ? getAqiInfo(airQuality.value.aqi) : null)
const uvInfo      = computed(() => weather.value ? getUvInfo(weather.value.uvIndex) : null)

const trafficBg = computed(() => {
  if (!traffic.value) return 'rgba(16,185,129,.12)'
  const m = { low: 'rgba(16,185,129,.12)', medium: 'rgba(245,158,11,.12)', high: 'rgba(239,68,68,.12)' }
  return m[traffic.value.level]
})

const trafficColor = computed(() => {
  if (!traffic.value) return '#10b981'
  const m = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' }
  return m[traffic.value.level]
})
</script>

<template>
  <div class="weather-widget mb-6">
    <!-- ── Top bar: greeting + clock ── -->
    <div class="widget-top">
      <div>
        <p class="greeting">{{ greeting }}</p>
        <p class="date-str">{{ dateStr }}</p>
      </div>
      <div class="clock-box">
        <span class="clock">{{ timeStr }}</span>
      </div>
    </div>

    <!-- ── Main card ── -->
    <div class="widget-card">
      <!-- Loading skeleton -->
      <template v-if="loading && !weather">
        <div class="skeleton-row">
          <div class="skeleton" style="width:4rem;height:4rem;border-radius:1rem"></div>
          <div class="flex flex-col gap-2 flex-1">
            <div class="skeleton" style="height:2rem;width:8rem"></div>
            <div class="skeleton" style="height:1rem;width:5rem"></div>
          </div>
        </div>
        <div class="skeleton-pills">
          <div class="skeleton" style="height:2rem;width:5rem;border-radius:9999px" v-for="i in 4" :key="i"></div>
        </div>
      </template>

      <!-- Loaded content -->
      <template v-else-if="weather">
        <!-- Left: weather main -->
        <div class="weather-main">
          <div class="weather-icon">{{ weatherInfo?.emoji }}</div>
          <div class="weather-temp-col">
            <div class="weather-temp">
              {{ weather.temperature }}<span class="temp-unit">°C</span>
            </div>
            <div class="weather-desc">{{ weatherInfo?.label }}</div>
            <div class="weather-feels">Cảm giác như {{ weather.feelsLike }}°</div>
          </div>

          <!-- Location -->
          <div class="weather-location">
            <MapPin :size="13" />
            <span>{{ weather.city }}</span>
          </div>
        </div>

        <!-- Right: pills row -->
        <div class="pills-row">
          <!-- Humidity -->
          <div class="pill">
            <Droplets :size="13" class="pill-icon" />
            <span class="pill-label">Độ ẩm</span>
            <span class="pill-val">{{ weather.humidity }}%</span>
          </div>

          <!-- Wind -->
          <div class="pill">
            <Wind :size="13" class="pill-icon" />
            <span class="pill-label">Gió</span>
            <span class="pill-val">{{ weather.windSpeed }} km/h</span>
          </div>

          <!-- UV Index -->
          <div class="pill" :style="`--pill-accent: ${uvInfo?.color ?? '#10b981'}`">
            <Zap :size="13" class="pill-icon" />
            <span class="pill-label">UV</span>
            <span class="pill-val">{{ weather.uvIndex }} · {{ uvInfo?.label }}</span>
          </div>

          <!-- Air Quality -->
          <div class="pill" :style="`--pill-accent: ${aqiInfo?.color ?? '#10b981'}`" v-if="airQuality">
            <Leaf :size="13" class="pill-icon" />
            <span class="pill-label">Không khí</span>
            <span class="pill-val">{{ airQuality.aqi }} · {{ aqiInfo?.label }}</span>
          </div>

          <!-- Traffic -->
          <div
            class="pill traffic-pill"
            :style="`background: ${trafficBg}; border-color: ${trafficColor}22;`"
          >
            <Car :size="13" class="pill-icon" :style="`color:${trafficColor}`" />
            <span class="pill-label">Giao thông</span>
            <span class="pill-val" :style="`color:${trafficColor}`">
              {{ traffic.emoji }} {{ traffic.label }}
            </span>
          </div>
        </div>

        <!-- Refresh button -->
        <button class="refresh-btn" @click="fetchWeather" :class="{ spinning: loading }" title="Làm mới">
          <RefreshCw :size="14" />
        </button>
      </template>

      <!-- Error state -->
      <template v-else>
        <div class="error-state">
          <span>⚡ Không thể tải thời tiết</span>
          <button class="refresh-btn" @click="fetchWeather">Thử lại</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* ── Widget wrapper ── */
.weather-widget {
  animation: fadeSlideIn 0.4s ease both;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Top bar ── */
.widget-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.875rem;
  gap: 0.75rem;
}

.greeting {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.date-str {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 0.15rem;
  text-transform: capitalize;
}

.clock-box {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 0.625rem;
  padding: 0.375rem 0.75rem;
  flex-shrink: 0;
}

.clock {
  font-size: 1.25rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
  letter-spacing: 0.04em;
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
}

/* ── Main card ── */
.widget-card {
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.06) 0%,
    var(--bg-surface) 50%,
    rgba(59, 130, 246, 0.04) 100%
  );
  border: 1px solid var(--border-default);
  border-radius: 1rem;
  padding: 1.125rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: border-color var(--transition-base);
}

.widget-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 40% at 10% 20%, rgba(16,185,129,.08) 0%, transparent 70%);
  pointer-events: none;
}

.widget-card:hover {
  border-color: var(--border-strong);
}

/* ── Skeleton ── */
.skeleton-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.skeleton {
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.5rem;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-pills {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* ── Weather main ── */
.weather-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.weather-icon {
  font-size: 3rem;
  line-height: 1;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,.3));
  animation: iconFloat 3s ease-in-out infinite;
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-3px); }
}

.weather-temp-col {
  flex: 1;
  min-width: 7rem;
}

.weather-temp {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
  letter-spacing: -0.03em;
}

.temp-unit {
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--text-tertiary);
  margin-left: 0.1em;
}

.weather-desc {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--accent-text);
  margin-top: 0.15rem;
}

.weather-feels {
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  margin-top: 0.1rem;
}

.weather-location {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 9999px;
  padding: 0.2rem 0.6rem;
  white-space: nowrap;
  margin-left: auto;
  flex-shrink: 0;
}

/* ── Pills ── */
.pills-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.pill {
  --pill-accent: var(--accent);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(255,255,255,.04);
  border: 1px solid var(--border-default);
  border-radius: 9999px;
  padding: 0.3rem 0.65rem;
  font-size: 0.6875rem;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.pill:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}

.pill-icon {
  color: var(--pill-accent);
  flex-shrink: 0;
}

.pill-label {
  color: var(--text-tertiary);
  font-weight: 500;
}

.pill-val {
  font-weight: 700;
  color: var(--text-primary);
}

.traffic-pill {
  border-color: transparent;
}

/* ── Refresh button ── */
.refresh-btn {
  position: absolute;
  top: 0.875rem;
  right: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.875rem;
  height: 1.875rem;
  border-radius: 9999px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
  z-index: 2;
}

.refresh-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-subtle);
}

.refresh-btn.spinning svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ── Error state ── */
.error-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  position: relative;
  z-index: 1;
}

.error-state .refresh-btn {
  position: static;
  width: auto;
  height: auto;
  border-radius: 0.5rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent);
  border-color: var(--accent);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .weather-temp { font-size: 2rem; }
  .weather-icon { font-size: 2.5rem; }
  .clock        { font-size: 1.05rem; }
}
</style>
