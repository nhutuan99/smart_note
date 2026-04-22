<script setup lang="ts">
// 1. Vue core
import { computed, ref } from 'vue'

// 2. Stores
import { useAuthStore } from '@/stores/auth'

// 3. Composables
import { useClock } from '@/composables/useClock'
import {
  useWeather,
  getWeatherInfo,
  getAqiInfo,
  getUvInfo,
  getGreeting,
  getTrafficLevel,
} from '@/composables/useWeather'

// 6. Icons
import { RefreshCw, MapPin, Wind, Droplets, Zap, Car, Leaf, ChevronDown } from 'lucide-vue-next'

// ── State ──────────────────────────────────────────────────────────────────────

const auth    = useAuthStore()
const { hhmm, seconds, dateStr } = useClock()
const { weather, airQuality, loading, fetchWeather } = useWeather()

const COLLAPSED_KEY = 'weather_widget_collapsed'
const isCollapsed   = ref(localStorage.getItem(COLLAPSED_KEY) === 'true')

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem(COLLAPSED_KEY, String(isCollapsed.value))
}

// ── Derived ───────────────────────────────────────────────────────────────────

const greeting    = computed(() => getGreeting(auth.user?.name ?? undefined))
const traffic     = computed(() => getTrafficLevel())
const weatherInfo = computed(() => weather.value ? getWeatherInfo(weather.value.weatherCode) : null)
const aqiInfo     = computed(() => airQuality.value ? getAqiInfo(airQuality.value.aqi) : null)
const uvInfo      = computed(() => weather.value ? getUvInfo(weather.value.uvIndex) : null)

const trafficColor = computed(() => {
  const m = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' } as const
  return m[traffic.value.level]
})

const trafficBg = computed(() => {
  const m = { low: 'rgba(16,185,129,.12)', medium: 'rgba(245,158,11,.12)', high: 'rgba(239,68,68,.12)' } as const
  return m[traffic.value.level]
})
</script>

<template>
  <div class="mb-6 animate-[fadeSlideIn_0.4s_ease_both]">
    <!-- ── Top bar: greeting + clock + toggle ── -->
    <div class="flex items-start justify-between gap-3 mb-3">
      <div>
        <p class="text-[1.125rem] font-bold text-text-primary tracking-tight leading-snug">{{ greeting }}</p>
        <p class="text-[0.75rem] text-text-tertiary mt-0.5 capitalize">{{ dateStr }}</p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <slot name="actions" />
        <!-- Clock -->
        <div class="clock-box">
          <span class="clock-colon-group">
            <span class="clock-hm">{{ hhmm }}</span>
            <span class="clock-sep">:</span>
            <span class="clock-sec">{{ seconds }}</span>
          </span>
        </div>

        <!-- Collapse toggle -->
        <button
          class="w-[1.875rem] h-[1.875rem] flex items-center justify-center rounded-lg bg-bg-elevated border border-border-default text-text-tertiary transition-all duration-200 hover:text-accent hover:border-accent hover:bg-accent-subtle cursor-pointer"
          :title="isCollapsed ? 'Mở rộng widget' : 'Thu gọn widget'"
          :aria-expanded="!isCollapsed"
          @click="toggleCollapse"
        >
          <ChevronDown :size="14" :class="['transition-transform duration-300', isCollapsed ? 'rotate-180' : '']" />
        </button>
      </div>
    </div>

    <!-- ── Collapsed mini-bar ── -->
    <Transition name="mini">
      <div
        v-if="isCollapsed && weather"
        class="flex items-center gap-1.5 bg-bg-surface border border-border-default rounded-xl px-3.5 py-2 text-[0.75rem] text-text-secondary overflow-hidden"
      >
        <span class="text-base leading-none">{{ weatherInfo?.emoji }}</span>
        <span class="font-bold text-text-primary">{{ weather.temperature }}°C</span>
        <span class="text-text-disabled">·</span>
        <span class="text-text-tertiary">{{ weatherInfo?.label }}</span>
        <span class="text-text-disabled">·</span>
        <MapPin :size="11" class="text-text-disabled shrink-0" />
        <span class="text-text-tertiary">{{ weather.city }}</span>
        <span class="text-text-disabled ml-auto">·</span>
        <span class="font-semibold" :style="`color: ${trafficColor}`">
          {{ traffic.emoji }} {{ traffic.label }}
        </span>
      </div>
    </Transition>

    <!-- ── Main card (expandable) ── -->
    <Transition name="expand">
      <div v-if="!isCollapsed" class="widget-card">
        <!-- Skeleton -->
        <template v-if="loading && !weather">
          <div class="flex items-center gap-4">
            <div class="skeleton w-16 h-16 rounded-2xl" />
            <div class="flex flex-col gap-2 flex-1">
              <div class="skeleton h-8 w-32" />
              <div class="skeleton h-4 w-20" />
            </div>
          </div>
          <div class="flex gap-2 flex-wrap">
            <div v-for="i in 4" :key="i" class="skeleton h-8 w-20 rounded-full" />
          </div>
        </template>

        <!-- Loaded -->
        <template v-else-if="weather">
          <div class="flex items-center gap-4 flex-wrap relative z-10">
            <div class="text-[3rem] leading-none shrink-0 drop-shadow-[0_2px_8px_rgba(0,0,0,.3)] animate-[iconFloat_3s_ease-in-out_infinite]">
              {{ weatherInfo?.emoji }}
            </div>
            <div class="flex-1 min-w-[7rem]">
              <div class="text-[2.5rem] font-extrabold text-text-primary leading-none tracking-tighter">
                {{ weather.temperature }}<span class="text-[1.25rem] font-normal text-text-tertiary ml-[0.1em]">°C</span>
              </div>
              <div class="text-[0.875rem] font-semibold text-accent-text mt-0.5">{{ weatherInfo?.label }}</div>
              <div class="text-[0.6875rem] text-text-tertiary mt-0.5">Cảm giác như {{ weather.feelsLike }}°</div>
            </div>
            <div class="flex items-center gap-1 text-[0.6875rem] text-text-tertiary bg-bg-elevated border border-border-subtle rounded-full px-2.5 py-1 whitespace-nowrap ml-auto shrink-0">
              <MapPin :size="13" />
              <span>{{ weather.city }}</span>
            </div>
          </div>

          <!-- Pills -->
          <div class="flex gap-2 flex-wrap relative z-10">
            <div class="pill">
              <Droplets :size="13" class="text-accent shrink-0" />
              <span class="pill-label">Độ ẩm</span>
              <span class="pill-val">{{ weather.humidity }}%</span>
            </div>
            <div class="pill">
              <Wind :size="13" class="text-accent shrink-0" />
              <span class="pill-label">Gió</span>
              <span class="pill-val">{{ weather.windSpeed }} km/h</span>
            </div>
            <div class="pill" :style="`--pill-accent: ${uvInfo?.color ?? '#10b981'}`">
              <Zap :size="13" class="shrink-0" style="color: var(--pill-accent)" />
              <span class="pill-label">UV</span>
              <span class="pill-val">{{ weather.uvIndex }} · {{ uvInfo?.label }}</span>
            </div>
            <div v-if="airQuality" class="pill" :style="`--pill-accent: ${aqiInfo?.color ?? '#10b981'}`">
              <Leaf :size="13" class="shrink-0" style="color: var(--pill-accent)" />
              <span class="pill-label">Không khí</span>
              <span class="pill-val">{{ airQuality.aqi }} · {{ aqiInfo?.label }}</span>
            </div>
            <div
              class="pill"
              :style="`background: ${trafficBg}; border-color: ${trafficColor}22`"
            >
              <Car :size="13" class="shrink-0" :style="`color: ${trafficColor}`" />
              <span class="pill-label">Giao thông</span>
              <span class="pill-val" :style="`color: ${trafficColor}`">{{ traffic.emoji }} {{ traffic.label }}</span>
            </div>
          </div>

          <!-- Refresh -->
          <button
            class="absolute top-3.5 right-3.5 w-[1.875rem] h-[1.875rem] flex items-center justify-center rounded-full bg-bg-elevated border border-border-default text-text-tertiary cursor-pointer transition-all duration-150 z-20 hover:text-accent hover:border-accent hover:bg-accent-subtle"
            :class="{ '[&_svg]:animate-spin': loading }"
            title="Làm mới"
            @click="fetchWeather"
          >
            <RefreshCw :size="14" />
          </button>
        </template>

        <!-- Error -->
        <template v-else>
          <div class="flex items-center justify-between text-[0.8125rem] text-text-tertiary relative z-10">
            <span>⚡ Không thể tải thời tiết</span>
            <button
              class="text-accent border border-accent rounded-lg px-2.5 py-1 text-[0.75rem] font-semibold bg-transparent cursor-pointer hover:bg-accent-subtle transition-colors duration-150"
              @click="fetchWeather"
            >
              Thử lại
            </button>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Keyframes (cannot be replaced by Tailwind utilities) ── */
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-3px); }
}
@keyframes blinkSep {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.15; }
}

/* ── Clock ── */
.clock-box {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 0.75rem;
  padding: 0.4rem 0.9rem;
  display: flex;
  align-items: center;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.3);
}
.clock-colon-group {
  display: flex;
  align-items: baseline;
  gap: 0.05em;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}
.clock-hm {
  font-size: 1.3rem;
  font-weight: 700;
  color: #F5F0E8;
  text-shadow: 0 0 20px rgba(245,240,232,.25), 0 0 40px rgba(245,240,232,.08);
}
.clock-sep {
  font-size: 1.3rem;
  font-weight: 300;
  color: rgba(245,240,232,.35);
  animation: blinkSep 1s step-end infinite;
  padding: 0 0.04em;
}
.clock-sec {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(245,240,232,.55);
  align-self: flex-end;
  margin-bottom: 0.1rem;
}

/* ── Main card ── */
.widget-card {
  position: relative;
  background: linear-gradient(135deg, rgba(16,185,129,.06) 0%, var(--bg-surface) 50%, rgba(59,130,246,.04) 100%);
  border: 1px solid var(--border-default);
  border-radius: 1rem;
  padding: 1.125rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: border-color 0.15s ease;
}
.widget-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 40% at 10% 20%, rgba(16,185,129,.08) 0%, transparent 70%);
  pointer-events: none;
}
.widget-card:hover { border-color: var(--border-strong); }

/* ── Pills ── */
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
  transition: all 0.15s ease;
  white-space: nowrap;
}
.pill:hover { background: var(--bg-hover); border-color: var(--border-strong); }
.pill-label { color: var(--text-tertiary); font-weight: 500; }
.pill-val   { font-weight: 700; color: var(--text-primary); }

/* ── Transitions ── */
.mini-enter-active,  .mini-leave-active  { transition: all 0.25s cubic-bezier(0.22,1,0.36,1); }
.mini-enter-from,    .mini-leave-to      { opacity: 0; transform: translateY(-4px); }

.expand-enter-active, .expand-leave-active { transition: all 0.3s cubic-bezier(0.22,1,0.36,1); overflow: hidden; }
.expand-enter-from,   .expand-leave-to    { opacity: 0; transform: translateY(-6px) scale(0.99); max-height: 0; }
.expand-enter-to,     .expand-leave-from  { max-height: 300px; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .clock-hm  { font-size: 1.1rem; }
  .clock-sec { font-size: 0.75rem; }
}
</style>
