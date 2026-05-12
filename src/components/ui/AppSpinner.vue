<template>
  <svg class="app-spinner" viewBox="0 0 50 50" :style="{ width: size + 'px', height: size + 'px' }">
    <circle class="path" cx="25" cy="25" r="20" fill="none" :stroke-width="strokeWidth"></circle>
  </svg>
</template>

<script setup lang="ts">
defineProps({
  size: {
    type: [Number, String],
    default: 16
  },
  strokeWidth: {
    type: [Number, String],
    default: 5
  }
})
</script>

<style scoped>
.app-spinner {
  animation: rotate 2s linear infinite;
  display: inline-block;
  vertical-align: middle;
}
.app-spinner .path {
  stroke: currentColor;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}
@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}
@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>
