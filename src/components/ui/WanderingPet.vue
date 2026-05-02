<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import CatMascot from '@/components/ui/CatMascot.vue'

const props = withDefaults(defineProps<{
  type?: 'grey' | 'orange'
  speed?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  actionOverride?: 'idle' | 'hide' | 'peek' | 'float' | 'wave' | null
}>(), {
  type: 'grey',
  speed: 1.5,
  size: 'md',
  actionOverride: null
})

// Position
const x = ref(Math.random() * (window.innerWidth - 100))
const y = ref(Math.random() * (window.innerHeight - 100))
const targetX = ref(x.value)
const targetY = ref(y.value)

// State
const isWalking = ref(false)
const facingRight = ref(true)
const action = ref<'idle' | 'wave' | 'jump' | 'float'>('idle')

let animationFrameId: number
let stateTimer: ReturnType<typeof setTimeout>

function loop() {
  const isPaused = props.actionOverride && props.actionOverride !== 'idle'

  if (isWalking.value && !isPaused) {
    const dx = targetX.value - x.value
    const dy = targetY.value - y.value
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < props.speed) {
      // Reached destination
      x.value = targetX.value
      y.value = targetY.value
      isWalking.value = false
      
      // Pick a random idle action
      const randomAction = Math.random()
      if (randomAction < 0.3) action.value = 'wave'
      else if (randomAction < 0.5) action.value = 'jump'
      else action.value = 'idle'

      // Schedule next walk
      stateTimer = setTimeout(pickNewTarget, 3000 + Math.random() * 5000)
    } else {
      // Move towards target
      const vx = (dx / dist) * props.speed
      const vy = (dy / dist) * props.speed
      x.value += vx
      y.value += vy
      
      // Update facing direction
      if (vx > 0.5) facingRight.value = true
      else if (vx < -0.5) facingRight.value = false
    }
  }
  animationFrameId = requestAnimationFrame(loop)
}

function pickNewTarget() {
  const margin = 100
  targetX.value = margin + Math.random() * (window.innerWidth - margin * 2)
  targetY.value = margin + Math.random() * (window.innerHeight - margin * 2)
  isWalking.value = true
  action.value = 'idle' // 'walking' can just be floating or jumping
}

// Float animation while walking makes it look like it's bouncing/walking
const currentAnimation = computed(() => {
  if (props.actionOverride && props.actionOverride !== 'idle') {
    return props.actionOverride
  }
  if (isWalking.value) return 'float'
  return action.value
})

onMounted(() => {
  // Start loop
  animationFrameId = requestAnimationFrame(loop)
  // Initial walk after 2s
  stateTimer = setTimeout(pickNewTarget, 2000)
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  clearTimeout(stateTimer)
})

const petStyle = computed(() => ({
  transform: `translate(${x.value}px, ${y.value}px) scaleX(${facingRight.value ? 1 : -1})`
}))
</script>

<template>
  <div 
    class="fixed z-[9999] pointer-events-none transition-transform duration-100 will-change-transform"
    :style="petStyle"
  >
    <div class="pointer-events-auto cursor-pointer hover:scale-110 transition-transform">
      <CatMascot :type="type" :size="size" :animation="currentAnimation" />
    </div>
  </div>
</template>
