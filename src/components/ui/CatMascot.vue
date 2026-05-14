<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  type?: 'grey' | 'orange'
  animation?: 'idle' | 'hide' | 'peek' | 'float' | 'wave' | 'jump' | 'think'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  type: 'orange',
  animation: 'idle',
  size: 'md'
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-16 h-16'
    case 'md': return 'w-24 h-24'
    case 'lg': return 'w-32 h-32'
    case 'xl': return 'w-48 h-48'
    default: return 'w-24 h-24'
  }
})

// Colors based on type
const catColor = computed(() => props.type === 'orange' ? '#F97316' : '#64748B')
const catDarkColor = computed(() => props.type === 'orange' ? '#EA580C' : '#475569')
const catLightColor = computed(() => props.type === 'orange' ? '#FDBA74' : '#94A3B8')

const isWave = computed(() => props.animation === 'wave')
const isThink = computed(() => props.animation === 'think')
const isHide = computed(() => props.animation === 'hide')
const isPeek = computed(() => props.animation === 'peek')

const containerClass = computed(() => {
  switch (props.animation) {
    case 'float': return 'animate-mascot-float'
    case 'jump': return 'animate-mascot-jump'
    case 'hide': return 'translate-y-12 opacity-0 scale-95' 
    case 'peek': return 'translate-y-2 scale-105'
    default: return 'animate-mascot-idle'
  }
})
</script>

<template>
  <div 
    class="relative inline-flex items-center justify-center transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) will-change-transform" 
    :class="[sizeClass, containerClass]"
    style="transform: translateZ(0);"
  >
    <!-- Shadow underneath -->
    <div 
      class="absolute -bottom-2 w-3/4 h-3 bg-black/15 dark:bg-black/40 blur-[4px] rounded-[100%] transition-all duration-500" 
      :class="{
        'opacity-0 scale-50': isHide,
        'scale-110 opacity-30': isPeek,
        'animate-shadow-pulse': props.animation === 'float' || props.animation === 'idle'
      }"
    ></div>

    <!-- SVG Kawaii Cat -->
    <svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-xl overflow-visible">
      <defs>
        <radialGradient id="bodyGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
          <stop offset="0%" :stop-color="catLightColor" />
          <stop offset="70%" :stop-color="catColor" />
          <stop offset="100%" :stop-color="catDarkColor" />
        </radialGradient>
        
        <radialGradient id="coinGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FEF08A" />
          <stop offset="50%" stop-color="#FACC15" />
          <stop offset="100%" stop-color="#CA8A04" />
        </radialGradient>
      </defs>

      <!-- Tail -->
      <g class="cat-tail origin-[140px_150px]">
        <path d="M 140 150 Q 180 150 170 110 Q 165 90 180 80" fill="none" :stroke="catDarkColor" stroke-width="16" stroke-linecap="round" />
      </g>

      <!-- Body / Head -->
      <g class="cat-body origin-[100px_100px]">
        <!-- Left Ear -->
        <g class="cat-ear-l origin-[60px_60px]">
          <path d="M 40 80 L 45 35 Q 50 25 60 35 L 90 60 Z" :fill="catColor" />
          <path d="M 50 65 L 53 45 Q 55 40 60 45 L 75 55 Z" fill="#FBCFE8" />
        </g>
        
        <!-- Right Ear -->
        <g class="cat-ear-r origin-[140px_60px]">
          <path d="M 160 80 L 155 35 Q 150 25 140 35 L 110 60 Z" :fill="catColor" />
          <path d="M 150 65 L 147 45 Q 145 40 140 45 L 125 55 Z" fill="#FBCFE8" />
        </g>

        <!-- Main Body Circle -->
        <circle cx="100" cy="110" r="65" fill="url(#bodyGrad)" />

        <!-- Face Elements -->
        <g class="cat-face transition-transform duration-300" :class="{'translate-y-[-5px]': isPeek, 'translate-x-[5px] translate-y-[-5px]': isThink}">
          
          <!-- Eyes -->
          <g class="cat-eyes">
            <!-- Left Eye -->
            <g class="cat-eye origin-[75px_100px]">
              <circle cx="75" cy="100" r="9" fill="#1E293B" />
              <circle cx="72" cy="97" r="3" fill="#FFFFFF" />
            </g>
            <!-- Right Eye -->
            <g class="cat-eye origin-[125px_100px]">
              <circle cx="125" cy="100" r="9" fill="#1E293B" />
              <circle cx="122" cy="97" r="3" fill="#FFFFFF" />
            </g>
          </g>

          <!-- Nose & Mouth -->
          <path d="M 97 112 Q 100 115 103 112" fill="none" stroke="#F472B6" stroke-width="3" stroke-linecap="round" />
          <path d="M 90 118 Q 95 125 100 118 Q 105 125 110 118" fill="none" stroke="#475569" stroke-width="2.5" stroke-linecap="round" />
          
          <!-- Blushes -->
          <ellipse cx="60" cy="115" rx="8" ry="4" fill="#F9A8D4" opacity="0.6" />
          <ellipse cx="140" cy="115" rx="8" ry="4" fill="#F9A8D4" opacity="0.6" />

          <!-- Whiskers -->
          <g stroke="#CBD5E1" stroke-width="2" stroke-linecap="round" opacity="0.5">
            <line x1="45" y1="105" x2="25" y2="100" class="cat-whisker" />
            <line x1="45" y1="115" x2="25" y2="120" class="cat-whisker" />
            <line x1="155" y1="105" x2="175" y2="100" class="cat-whisker" />
            <line x1="155" y1="115" x2="175" y2="120" class="cat-whisker" />
          </g>
        </g>

        <!-- Paws & Accessories -->
        <!-- Left Paw holding Coin -->
        <g class="transition-transform duration-500 origin-[70px_145px]" :class="{'translate-y-[-5px]': isThink}">
          <!-- Coin -->
          <circle cx="70" cy="140" r="18" fill="url(#coinGrad)" stroke="#A16207" stroke-width="2" />
          <path d="M 70 128 L 70 152 M 64 140 L 76 140" stroke="#A16207" stroke-width="3" stroke-linecap="round" opacity="0.5" />
          <!-- Left Paw -->
          <ellipse cx="65" cy="145" rx="12" ry="8" :fill="catLightColor" transform="rotate(-15 65 145)" />
        </g>

        <!-- Right Paw (Waving or Idle) -->
        <g class="origin-[135px_145px]" :class="{'cat-paw-wave': isWave}">
          <ellipse cx="135" cy="145" rx="12" ry="8" :fill="catLightColor" transform="rotate(15 135 145)" />
        </g>
        
        <!-- Question mark for think animation -->
        <g v-if="isThink" class="animate-bounce origin-bottom">
          <text x="135" y="60" font-size="40" font-weight="bold" fill="#FACC15" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))">?</text>
        </g>

        <!-- Sparkles for wave animation -->
        <g v-if="isWave" class="animate-pulse">
          <path d="M 160 120 L 165 110 L 170 120 L 180 125 L 170 130 L 165 140 L 160 130 L 150 125 Z" fill="#FDE047" />
          <path d="M 175 100 L 178 92 L 181 100 L 189 103 L 181 106 L 178 114 L 175 106 L 167 103 Z" fill="#FDE047" transform="scale(0.6) translate(60, -40)" />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
/* Animations */
@keyframes mascot-idle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes mascot-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes mascot-jump {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

@keyframes shadow-pulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(0.8); opacity: 0.2; }
}

@keyframes tail-wag {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(8deg); }
}

@keyframes ear-twitch-l {
  0%, 90%, 100% { transform: rotate(0deg); }
  95% { transform: rotate(-10deg); }
}

@keyframes ear-twitch-r {
  0%, 90%, 100% { transform: rotate(0deg); }
  95% { transform: rotate(10deg); }
}

@keyframes eye-blink {
  0%, 96%, 100% { transform: scaleY(1); }
  98% { transform: scaleY(0.1); }
}

@keyframes paw-wave {
  0%, 100% { transform: rotate(0deg) translateY(0); }
  25% { transform: rotate(-30deg) translateY(-15px) translateX(10px); }
  50% { transform: rotate(10deg) translateY(-10px) translateX(5px); }
  75% { transform: rotate(-20deg) translateY(-12px) translateX(8px); }
}

@keyframes body-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02) translateY(-2px); }
}

/* Classes */
.animate-mascot-idle { animation: mascot-idle 3s ease-in-out infinite; }
.animate-mascot-float { animation: mascot-float 3s ease-in-out infinite; }
.animate-mascot-jump { animation: mascot-jump 0.8s ease-in-out infinite; }
.animate-shadow-pulse { animation: shadow-pulse 3s ease-in-out infinite; }

.cat-tail { animation: tail-wag 4s ease-in-out infinite; }
.cat-ear-l { animation: ear-twitch-l 5s ease-in-out infinite; }
.cat-ear-r { animation: ear-twitch-r 6s ease-in-out infinite; }
.cat-eye { animation: eye-blink 4s linear infinite; }
.cat-paw-wave { animation: paw-wave 1.5s ease-in-out infinite; }
.cat-body { animation: body-breathe 3s ease-in-out infinite; }
</style>
