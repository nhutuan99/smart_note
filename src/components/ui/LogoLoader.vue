<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: Number,
    default: 40
  },
  showGlow: {
    type: Boolean,
    default: false
  }
})

const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`
}))

const imgClass = computed(() => {
  if (props.size <= 24) return 'app-logo-loader__img--small'
  if (props.size <= 48) return 'app-logo-loader__img--medium'
  return 'app-logo-loader__img--large'
})
</script>

<template>
  <div class="app-logo-loader" :style="style">
    <div v-if="showGlow" class="app-logo-loader__glow"></div>
    <div class="app-logo-loader__logo">
      <img src="/images/logo-512.png" alt="Loading" class="app-logo-loader__img" :class="imgClass" />
      <div class="app-logo-loader__shimmer"></div>
    </div>
  </div>
</template>

<style scoped>
.app-logo-loader {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.app-logo-loader__glow {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 300%;
  height: 300%;
  background: radial-gradient(circle, rgba(124,111,247, 0.25) 0%, rgba(124,111,247,0.05) 40%, transparent 70%);
  border-radius: 50%;
  animation: logo-glow-pulse 3s ease-in-out infinite;
  pointer-events: none;
}
.app-logo-loader__logo {
  position: relative;
  width: 100%;
  height: 100%;
  animation: logo-float 2.5s ease-in-out infinite;
  border-radius: 25%;
}
.app-logo-loader__img {
  width: 100%; height: 100%;
  border-radius: inherit;
  object-fit: cover;
  display: block;
}
.app-logo-loader__img--small {
  box-shadow: 0 1px 4px rgba(124,111,247,0.3);
}
.app-logo-loader__img--medium {
  box-shadow: 0 4px 12px rgba(124,111,247,0.3), 0 0 0 1px rgba(124,111,247,0.15);
}
.app-logo-loader__img--large {
  box-shadow: 0 8px 40px rgba(124,111,247,0.3), 0 0 0 1px rgba(124,111,247,0.15);
}

.app-logo-loader__shimmer {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  overflow: hidden;
  z-index: 2;
  pointer-events: none;
}
.app-logo-loader__shimmer::after {
  content: '';
  position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(124,111,247,0.5), transparent 30%);
  animation: logo-shimmer-spin 2s linear infinite;
}

@keyframes logo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10%); }
}
@keyframes logo-glow-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
}
@keyframes logo-shimmer-spin {
  to { transform: rotate(360deg); }
}
</style>
