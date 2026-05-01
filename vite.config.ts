import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import obsidianSync from './src/plugins/vite-obsidian-sync'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [
    vue(),
    tailwindcss(),
    // Only use obsidianSync in development (not available in CI/CD)
    ...(mode === 'development' ? [obsidianSync()] : [])
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // Production optimizations
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'markdown': ['marked', 'dompurify'],
          'chart': ['chart.js', 'vue-chartjs'],
          'i18n': ['vue-i18n']
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  }
}))
