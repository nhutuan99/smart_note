<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()

const isAuthPage = computed(() => route.name === 'login')
</script>

<template>
  <div id="smart-note-app">
    <!-- Auth pages: no layout -->
    <router-view v-if="isAuthPage" />
    <!-- App pages: with layout -->
    <AppLayout v-else />
  </div>
</template>

<style>
#smart-note-app {
  min-height: 100vh;
}
</style>
