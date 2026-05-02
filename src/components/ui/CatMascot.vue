<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  type?: 'grey' | 'orange'
  animation?: 'idle' | 'hide' | 'peek' | 'float' | 'wave' | 'jump'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  type: 'grey',
  animation: 'idle',
  size: 'md'
})

const imageSrc = computed(() => `/images/mascot_${props.type}.png`)

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-16 h-16'
    case 'md': return 'w-24 h-24'
    case 'lg': return 'w-32 h-32'
    case 'xl': return 'w-48 h-48'
    default: return 'w-24 h-24'
  }
})

const animationClass = computed(() => {
  switch (props.animation) {
    case 'float': return 'animate-mascot-float'
    case 'wave': return 'animate-mascot-wave origin-bottom'
    case 'jump': return 'animate-mascot-jump'
    case 'hide': return 'translate-y-8 opacity-40 scale-95' 
    case 'peek': return '-translate-y-2 scale-105'
    default: return ''
  }
})
</script>

<template>
  <div 
    class="relative inline-flex items-center justify-center transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)" 
    :class="[sizeClass, animationClass]"
  >
    <!-- Circular Sticker Badge Style -->
    <div class="relative w-full h-full rounded-full overflow-hidden border-2 border-white/80 shadow-[0_4px_15px_rgba(255,255,255,0.2)] bg-white">
      <img :src="imageSrc" alt="Mascot" class="w-full h-full object-cover transform scale-110" />
    </div>
  </div>
</template>

<style>
@keyframes mascot-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes mascot-wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}
@keyframes mascot-jump {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-15px) scale(1.05); }
}

.animate-mascot-float {
  animation: mascot-float 3s ease-in-out infinite;
}
.animate-mascot-wave {
  animation: mascot-wave 2s ease-in-out infinite;
}
.animate-mascot-jump {
  animation: mascot-jump 0.8s ease-in-out infinite;
}
</style>
