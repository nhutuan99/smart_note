<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { } from 'lucide-vue-next'
import LogoLoader from '@/components/ui/LogoLoader.vue'

const emit = defineEmits<{
  (e: 'refresh', done: () => void): void
}>()

const props = defineProps<{
  disabled?: boolean
}>()

const containerRef = ref<HTMLElement | null>(null)

// State
const startY = ref(0)
const currentY = ref(0)
const refreshing = ref(false)
const pulling = ref(false)
const distance = ref(0)

const MAX_PULL = 120
const THRESHOLD = 60

function onTouchStart(e: TouchEvent) {
  if (props.disabled || refreshing.value) return
  // Only allow pull-to-refresh if we are at the very top of the scroll container
  const scrollable = getScrollParent(e.target as HTMLElement)
  if (scrollable && scrollable.scrollTop > 0) return

  startY.value = e.touches[0].clientY
  currentY.value = startY.value
  pulling.value = true
}

function onTouchMove(e: TouchEvent) {
  if (!pulling.value || refreshing.value) return

  const y = e.touches[0].clientY
  const delta = y - startY.value

  // Only handle pulling down
  if (delta > 0) {
    // Prevent default scrolling when pulling down at the top
    if (e.cancelable) {
      e.preventDefault()
    }
    
    // Add friction for a native feel
    distance.value = Math.min(delta * 0.5, MAX_PULL)
  } else {
    distance.value = 0
  }
}

function onTouchEnd() {
  if (!pulling.value || refreshing.value) return
  
  pulling.value = false

  if (distance.value >= THRESHOLD) {
    refreshing.value = true
    distance.value = THRESHOLD // snap back to loading position
    
    // Call the parent handler and pass a done callback
    emit('refresh', () => {
      refreshing.value = false
      distance.value = 0
    })
  } else {
    distance.value = 0
  }
}

// Find the closest scrollable parent to check scrollTop
function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null
  if (node === document.body || node === document.documentElement) return document.body
  
  const overflowY = window.getComputedStyle(node).overflowY
  const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden'
  
  if (isScrollable && node.scrollHeight > node.clientHeight) {
    return node
  }
  
  return getScrollParent(node.parentElement)
}

onMounted(() => {
  // We attach passive: false to touchmove to allow preventDefault
  if (containerRef.value) {
    containerRef.value.addEventListener('touchstart', onTouchStart, { passive: true })
    containerRef.value.addEventListener('touchmove', onTouchMove, { passive: false })
    containerRef.value.addEventListener('touchend', onTouchEnd, { passive: true })
  }
})

onBeforeUnmount(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('touchstart', onTouchStart)
    containerRef.value.removeEventListener('touchmove', onTouchMove)
    containerRef.value.removeEventListener('touchend', onTouchEnd)
  }
})
</script>

<template>
  <div ref="containerRef" class="relative w-full h-full">
    <!-- Spinner Area -->
    <div 
      class="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden z-0"
      :style="{ height: `${MAX_PULL}px`, transform: `translateY(${distance - MAX_PULL}px)` }"
    >
      <div 
        class="w-8 h-8 rounded-full bg-bg-elevated shadow-lg flex items-center justify-center text-text-secondary transition-transform duration-200"
        :class="{ 'rotate-180': distance >= THRESHOLD && !refreshing, 'text-accent': distance >= THRESHOLD }"
      >
        <LogoLoader 
          :size="20"
          class="transition-all duration-300"
          :class="{ 'opacity-50 grayscale': !refreshing }"
          :style="{ transform: refreshing ? 'none' : `rotate(${distance * 2}deg)` }"
        />
      </div>
    </div>

    <!-- Content Area -->
    <div 
      class="w-full h-full relative z-10 transition-transform bg-bg-primary"
      :class="{ 'duration-300 ease-out': !pulling }"
      :style="{ transform: `translateY(${distance}px)` }"
    >
      <slot />
    </div>
  </div>
</template>
