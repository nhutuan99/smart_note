<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { ArrowRight, Bot, ShieldCheck, Sparkles, Smartphone, PenTool, LayoutDashboard, Target, Zap, TrendingUp, CheckCircle2, Moon, Sun } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const isStarting = ref(false)

async function startGuest() {
  if (isStarting.value) return
  isStarting.value = true
  try {
    await auth.startGuestMode(router)
  } finally {
    isStarting.value = false
  }
}

function goToLogin() {
  router.push('/login')
}

// Simple floating animation
const floatOffset = ref(0)
let animationFrameId: number

// Scroll reveal
const observer = ref<IntersectionObserver | null>(null)

// Typewriter effect
const typeWriterText = ref('')
const isTyping = ref(true)

onMounted(() => {
  let start = Date.now()
  const animate = () => {
    const elapsed = Date.now() - start
    floatOffset.value = Math.sin(elapsed / 1000) * 10
    animationFrameId = requestAnimationFrame(animate)
  }
  animate()

  // Typewriter logic
  const fullText = t('landing.hero.titlePart1') + '\\n' + t('landing.hero.titlePart2')
  let i = 0
  const typeWriter = () => {
    if (i < fullText.length) {
      typeWriterText.value += fullText.charAt(i)
      i++
      setTimeout(typeWriter, 50)
    } else {
      isTyping.value = false
    }
  }
  setTimeout(typeWriter, 300)

  // Intersection Observer for scroll animations
  observer.value = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible')
        observer.value?.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

  document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    observer.value?.observe(el)
  })
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (observer.value) observer.value.disconnect()
})
</script>

<template>
  <div class="min-h-screen bg-bg-base text-text-primary overflow-x-hidden selection:bg-accent/30 font-sans">
    <!-- Navbar -->
    <nav class="fixed top-0 w-full z-50 glass-nav border-b border-border-default">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/images/logo-512.png" alt="FinNote" class="w-8 h-8 rounded-lg shadow-lg shadow-accent/20 object-cover" />
          <span class="font-bold text-lg tracking-tight">FinNote</span>
        </div>
        <div class="flex items-center gap-4">
          <button @click="goToLogin" class="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            {{ t('landing.nav.login') }}
          </button>
          <button @click="startGuest" class="bg-accent hover:bg-accent/90 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5 flex items-center gap-2">
            <span v-if="!isStarting">{{ t('landing.nav.tryNow') }}</span>
            <span v-else>{{ t('landing.nav.starting') }}</span>
            <ArrowRight :size="16" v-if="!isStarting" />
          </button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <main class="pt-32 pb-20 relative px-6">
      <!-- Glow backgrounds -->
      <div class="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/15 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      
      <div class="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-4">
          <Sparkles :size="14" />
          <span>{{ t('landing.hero.badge') }}</span>
        </div>
        
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-text-primary via-text-primary to-text-disabled leading-[1.1] min-h-[120px] md:min-h-[160px] whitespace-pre-line">
          {{ typeWriterText }}<span v-if="isTyping" class="animate-pulse text-text-primary">|</span>
        </h1>
        
        <p class="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
          {{ t('landing.hero.description') }}
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button @click="startGuest" class="w-full sm:w-auto bg-text-primary text-bg-base hover:opacity-90 text-base font-bold px-8 py-3.5 rounded-2xl transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:scale-105 flex items-center justify-center gap-2" style="color: var(--bg-base);">
            {{ t('landing.hero.ctaPrimary') }}
            <ArrowRight :size="18" />
          </button>
          <a href="#features" class="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-semibold text-text-secondary hover:text-text-primary bg-bg-surface hover:bg-bg-elevated border border-border-default transition-all text-center">
            {{ t('landing.hero.ctaSecondary') }}
          </a>
        </div>
        
        <p class="text-xs text-text-tertiary flex items-center justify-center gap-1.5">
          <ShieldCheck :size="14" />
          {{ t('landing.hero.privacyNote') }}
        </p>
      </div>

      <!-- Cool UI Demo Mockup -->
      <div class="max-w-5xl mx-auto mt-20 relative perspective-1000 reveal-on-scroll" :style="`transform: translateY(${floatOffset}px)`">
        <!-- Mockup Container -->
        <div class="rounded-3xl border border-border-strong bg-bg-surface/80 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-border-default">
          <!-- Window Controls -->
          <div class="h-12 border-b border-border-default flex items-center px-4 gap-2 bg-bg-elevated/50">
            <div class="w-3 h-3 rounded-full bg-error/80"></div>
            <div class="w-3 h-3 rounded-full bg-warning/80"></div>
            <div class="w-3 h-3 rounded-full bg-success/80"></div>
          </div>
          
          <!-- Mockup Content -->
          <div class="p-6 md:p-8 flex flex-col md:flex-row gap-6">
            <!-- Left Sidebar Simulation -->
            <div class="w-64 hidden md:flex flex-col gap-2">
              <div class="h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center px-4 gap-3 text-accent font-medium">
                <LayoutDashboard :size="18" /> {{ t('landing.demo.dashboard') }}
              </div>
              <div class="h-10 rounded-xl hover:bg-bg-hover flex items-center px-4 gap-3 text-text-secondary cursor-pointer">
                <Target :size="18" /> {{ t('landing.demo.planning') }}
              </div>
              <div class="h-10 rounded-xl hover:bg-bg-hover flex items-center px-4 gap-3 text-text-secondary cursor-pointer">
                <TrendingUp :size="18" /> {{ t('landing.demo.stocks') }}
              </div>
            </div>

            <!-- Main Dashboard Area -->
            <div class="flex-1 space-y-6">
              <div class="flex justify-between items-end">
                <div>
                  <p class="text-sm text-text-tertiary">{{ t('landing.demo.totalAssets') }}</p>
                  <h2 class="text-4xl font-bold tracking-tight text-text-primary mt-1">294.900.000đ</h2>
                </div>
                <div class="flex items-center gap-2 text-success bg-success/10 px-3 py-1.5 rounded-lg text-sm font-semibold border border-success/20">
                  <TrendingUp :size="16" /> {{ t('landing.demo.thisMonth') }}
                </div>
              </div>

              <!-- Widgets -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- AI Widget -->
                <div class="p-5 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 relative overflow-hidden group">
                  <div class="absolute -right-6 -top-6 w-24 h-24 bg-accent/20 blur-2xl rounded-full"></div>
                  <div class="flex items-center gap-3 mb-3">
                    <div class="p-2 bg-accent/20 rounded-lg text-accent">
                      <Bot :size="20" />
                    </div>
                    <span class="font-bold text-accent">{{ t('landing.demo.aiAdvisor') }}</span>
                  </div>
                  <p class="text-sm text-text-secondary leading-relaxed">
                    {{ t('landing.demo.aiMessage') }}
                  </p>
                </div>
                
                <!-- Notification / SMS Widget -->
                <div class="p-5 rounded-2xl bg-bg-elevated border border-border-default shadow-sm">
                  <div class="flex items-center gap-3 mb-3">
                    <div class="p-2 bg-info/20 rounded-lg text-info">
                      <Zap :size="20" />
                    </div>
                    <span class="font-bold text-text-primary">{{ t('landing.demo.syncSms') }}</span>
                  </div>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-text-secondary flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-error"></div> {{ t('landing.demo.coffee') }}</span>
                      <span class="font-mono text-error font-semibold">-55.000đ</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-text-secondary flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-success"></div> {{ t('landing.demo.salary') }}</span>
                      <span class="font-mono text-success font-semibold">+25.000.000đ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- App Demo Video Section -->
    <section class="py-12 px-6 relative reveal-on-scroll">
      <div class="max-w-5xl mx-auto text-center">
        <h2 class="text-3xl font-bold mb-8 text-text-primary">{{ t('landing.demoVideo') }}</h2>
        <div class="rounded-3xl border border-border-strong bg-bg-surface overflow-hidden shadow-2xl ring-1 ring-border-default mx-auto relative group">
          <img src="/images/demo_video.webp" alt="App Demo Video" class="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-500" />
        </div>
      </div>
    </section>

    <!-- Bento Grid Features -->
    <section id="features" class="py-24 px-6 relative">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-3xl md:text-5xl font-bold mb-16 text-center">{{ t('landing.features.title') }}</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          
          <!-- Card 1 -->
          <div class="md:col-span-2 bg-bg-surface border border-border-default rounded-3xl p-8 hover:bg-bg-elevated transition-colors relative overflow-hidden group shadow-sm reveal-on-scroll" style="transition-delay: 0.1s">
            <div class="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Smartphone class="text-accent mb-6" :size="40" stroke-width="1.5" />
            <h3 class="text-2xl font-bold mb-3">{{ t('landing.features.sms.title') }}</h3>
            <p class="text-text-secondary text-lg leading-relaxed max-w-md relative z-10">
              {{ t('landing.features.sms.desc') }}
            </p>
            <div class="absolute -right-10 -bottom-10 opacity-[0.03] text-text-primary group-hover:scale-110 group-hover:text-accent transition-all duration-500 z-0 pointer-events-none">
              <Zap :size="200" />
            </div>
          </div>
          
          <!-- Card 2 -->
          <div class="bg-bg-surface border border-border-default rounded-3xl p-8 hover:bg-bg-elevated transition-colors relative overflow-hidden group shadow-sm reveal-on-scroll" style="transition-delay: 0.2s">
            <ShieldCheck class="text-success mb-6" :size="40" stroke-width="1.5" />
            <h3 class="text-xl font-bold mb-3">{{ t('landing.features.privacy.title') }}</h3>
            <p class="text-text-secondary">
              {{ t('landing.features.privacy.desc') }}
            </p>
          </div>
          
          <!-- Card 3 -->
          <div class="bg-bg-surface border border-border-default rounded-3xl p-8 hover:bg-bg-elevated transition-colors relative overflow-hidden group shadow-sm reveal-on-scroll" style="transition-delay: 0.3s">
            <LayoutDashboard class="text-warning mb-6" :size="40" stroke-width="1.5" />
            <h3 class="text-xl font-bold mb-3">{{ t('landing.features.allInOne.title') }}</h3>
            <p class="text-text-secondary">
              {{ t('landing.features.allInOne.desc') }}
            </p>
          </div>
          
          <!-- Card 4 -->
          <div class="md:col-span-2 bg-bg-surface border border-border-default rounded-3xl p-8 hover:bg-bg-elevated transition-colors relative overflow-hidden group shadow-sm reveal-on-scroll" style="transition-delay: 0.4s">
            <PenTool class="text-info mb-6" :size="40" stroke-width="1.5" />
            <h3 class="text-2xl font-bold mb-3">{{ t('landing.features.knowledge.title') }}</h3>
            <p class="text-text-secondary text-lg leading-relaxed max-w-md relative z-10">
              {{ t('landing.features.knowledge.desc') }}
            </p>
            <div class="absolute -right-10 -bottom-10 opacity-[0.03] text-text-primary group-hover:scale-110 group-hover:text-info transition-all duration-500 z-0 pointer-events-none">
              <PenTool :size="200" />
            </div>
          </div>
          
        </div>
      </div>
    </section>

    <!-- Bottom CTA -->
    <section class="py-24 px-6 reveal-on-scroll">
      <div class="max-w-4xl mx-auto bg-gradient-to-br from-accent/15 to-transparent border border-accent/20 rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden shadow-lg shadow-accent/5">
        <h2 class="text-4xl md:text-5xl font-bold mb-6 text-text-primary">{{ t('landing.cta.title') }}</h2>
        <p class="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
          {{ t('landing.cta.desc') }}
        </p>
        <button @click="startGuest" class="w-full sm:w-auto bg-text-primary text-bg-base hover:opacity-90 text-lg font-bold px-10 py-4 rounded-2xl transition-all shadow-xl hover:scale-105 flex items-center justify-center gap-3 mx-auto" style="color: var(--bg-base);">
          <span v-if="!isStarting">{{ t('landing.cta.button') }}</span>
          <span v-else>{{ t('landing.cta.starting') }}</span>
          <ArrowRight :size="20" v-if="!isStarting" />
        </button>
      </div>
    </section>
    
    <!-- Footer -->
    <footer class="py-8 border-t border-border-default text-center text-text-tertiary text-sm">
      <p>{{ t('landing.footer.copyright') }}</p>
    </footer>
  </div>
</template>

<style scoped>
.glass-nav {
  background: color-mix(in srgb, var(--bg-base) 80%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.perspective-1000 {
  perspective: 1000px;
}

.reveal-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.reveal-visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
