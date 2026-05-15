<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'
import { ArrowRight, Bot, ShieldCheck, Sparkles, Smartphone, PenTool, LayoutDashboard, Target, Zap, TrendingUp, CheckCircle2, Moon, Sun } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

const { t, locale } = useI18n()
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
  const fullText = t('landing.hero.titlePart1') + '\n' + t('landing.hero.titlePart2')
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
          <div class="flex items-center gap-1 mr-2">
            <button 
              @click="setLocale('vi')"
              :class="['text-[0.8125rem] font-semibold transition-colors rounded-lg px-2 py-1.5', locale === 'vi' ? 'text-accent bg-accent/10' : 'text-text-tertiary hover:text-text-primary hover:bg-bg-hover']"
            >
              VI
            </button>
            <span class="text-border-strong text-xs select-none">|</span>
            <button 
              @click="setLocale('en')"
              :class="['text-[0.8125rem] font-semibold transition-colors rounded-lg px-2 py-1.5', locale === 'en' ? 'text-accent bg-accent/10' : 'text-text-tertiary hover:text-text-primary hover:bg-bg-hover']"
            >
              EN
            </button>
          </div>
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
          <button @click="startGuest" class="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white text-base font-bold px-8 py-3.5 rounded-2xl transition-all shadow-[0_0_40px_rgba(124,111,247,0.3)] hover:scale-105 flex items-center justify-center gap-2">
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

      <!-- App Demo Video (Main Demo) -->
      <div class="max-w-5xl mx-auto mt-24 relative perspective-1000 reveal-on-scroll">
        <!-- Glow effect behind the video -->
        <div class="absolute -inset-4 bg-gradient-to-r from-accent/40 via-purple-500/30 to-accent/40 blur-3xl opacity-50 rounded-[3rem] -z-10 animate-pulse" style="animation-duration: 4s;"></div>
        
        <div class="rounded-3xl border border-white/10 bg-bg-surface/80 backdrop-blur-xl overflow-hidden shadow-[0_0_80px_rgba(124,111,247,0.2)] ring-1 ring-border-default mx-auto relative group">
          <!-- Window Controls -->
          <div class="h-12 border-b border-white/5 flex items-center px-5 gap-2 bg-gradient-to-r from-bg-elevated/80 to-bg-surface/80 absolute top-0 w-full z-10 backdrop-blur-md">
            <div class="flex gap-2">
              <div class="w-3.5 h-3.5 rounded-full bg-error/90 shadow-[0_0_10px_rgba(255,82,82,0.5)]"></div>
              <div class="w-3.5 h-3.5 rounded-full bg-warning/90 shadow-[0_0_10px_rgba(251,140,0,0.5)]"></div>
              <div class="w-3.5 h-3.5 rounded-full bg-success/90 shadow-[0_0_10px_rgba(67,160,71,0.5)]"></div>
            </div>
            <div class="mx-auto flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/20 border border-white/5 text-xs text-text-tertiary font-medium">
              <ShieldCheck :size="12" class="text-accent/80" />
              app.finnote.vn
            </div>
            <div class="w-[54px]"></div> <!-- Spacer for centering -->
          </div>
          
          <div class="relative w-full aspect-video bg-[#0b0c10] mt-12 overflow-hidden">
            <!-- Video Player (Veo 3 Demo) -->
            <video 
              src="/images/demo-veo3.mp4" 
              poster="/images/demo_video.webp"
              autoplay 
              loop 
              muted 
              playsinline 
              class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-1000 ease-out"
            ></video>
            
            <!-- Play Overlay (Subtle Gradient) -->
            <div class="absolute inset-0 bg-gradient-to-t from-[#04060d]/80 via-transparent to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>
    </main>



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
        <button @click="startGuest" class="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white text-lg font-bold px-10 py-4 rounded-2xl transition-all shadow-[0_0_40px_rgba(124,111,247,0.3)] hover:scale-105 flex items-center justify-center gap-3 mx-auto">
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
