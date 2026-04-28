import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import i18n from './i18n'
import App from './App.vue'
import { setHttpClientRouter } from './shared/api/httpClient'
import './assets/styles/base.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// Give httpClient access to Vue Router for SPA-safe 401 redirects
setHttpClientRouter(router)

app.mount('#app')

// Fade out the PWA splash screen after Vue has mounted
setTimeout(() => {
  ;(window as any).__removeSplash?.()
}, 800)
