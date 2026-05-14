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

// Load images based on type and animation
const imageSrc = computed(() => {
  const color = props.type === 'grey' ? 'grey' : ''
  const prefix = color ? `_${color}` : ''
  
  if (props.animation === 'think') return `/images/cat${prefix}_think_nobg.png`
  if (props.animation === 'wave') return `/images/cat${prefix}_wave_nobg.png`
  return `/images/cat${prefix}_idle_nobg.png`
})

const isHide = computed(() => props.animation === 'hide')
const isPeek = computed(() => props.animation === 'peek')

const containerClass = computed(() => {
  switch (props.animation) {
    case 'float': return 'animate-mascot-float'
    case 'jump': return 'animate-mascot-jump'
    case 'hide': return 'translate-y-12 opacity-0 scale-95' 
    case 'peek': return 'translate-y-2 scale-105'
    case 'wave': return 'animate-mascot-wave'
    case 'think': return 'animate-mascot-think'
    default: return 'animate-mascot-idle'
  }
})
</script>

<template>
  <div 
    class="relative inline-flex items-center justify-center transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) will-change-transform drop-shadow-xl" 
    :class="[sizeClass, containerClass]"
    style="transform: translateZ(0);"
  >
    <!-- Realistic AI Cat Image with Behavior Animations -->
    <img :src="imageSrc" alt="Mascot" class="w-full h-full object-contain relative z-10 transition-all duration-300" loading="lazy" />
  </div>
</template>

<style scoped>
/* Behavior Animations for Realistic Cat */
@keyframes mascot-idle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px) scale(1.02); }
}

@keyframes mascot-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px) rotate(2deg); }
}

@keyframes mascot-jump {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

@keyframes mascot-wave {
  0%, 100% { transform: rotate(0deg) translateY(0); }
  25% { transform: rotate(-5deg) translateY(-2px); }
  75% { transform: rotate(5deg) translateY(-2px); }
}

@keyframes mascot-think {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(3deg) translateY(-3px); }
}

/* Classes */
.animate-mascot-idle { animation: mascot-idle 4s ease-in-out infinite; }
.animate-mascot-float { animation: mascot-float 3s ease-in-out infinite; }
.animate-mascot-jump { animation: mascot-jump 0.8s ease-in-out infinite; }
.animate-mascot-wave { animation: mascot-wave 2s ease-in-out infinite; }
.animate-mascot-think { animation: mascot-think 3s ease-in-out infinite; }
</style>
