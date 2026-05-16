<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'
import { ArrowRight, ShieldCheck, Sparkles, Smartphone, PenTool, LayoutDashboard, Zap, Volume2, VolumeX, Menu, X, CheckCircle2, ChevronRight } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useWindowScroll } from '@vueuse/core'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const isStarting = ref(false)
const isMuted = ref(true)
const demoVideoRef = ref<HTMLVideoElement | null>(null)
const isMobileMenuOpen = ref(false)
const isScrolled = ref(false)

function toggleMute() {
  if (demoVideoRef.value) {
    isMuted.value = !isMuted.value
    demoVideoRef.value.muted = isMuted.value
  }
}

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
      setTimeout(typeWriter, 40)
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

  // Programmatic autoplay — required in PWA / restricted browsers
  // The HTML `autoplay` attribute is often ignored; calling .play() is the reliable path.
  if (demoVideoRef.value) {
    demoVideoRef.value.play().catch(() => {
      // Autoplay blocked — video stays paused, user can tap to play (mute button still works)
    })
  }
})

const { y } = useWindowScroll()

watch(y, (newY) => {
  isScrolled.value = newY > 20
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (observer.value) observer.value.disconnect()
})
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden selection:bg-accent/30 font-sans">
    <!-- Navbar -->
    <nav :class="['fixed top-0 w-full z-50 transition-all duration-300', isScrolled ? 'glass-nav border-b border-white/10 py-3 shadow-2xl' : 'bg-transparent py-5']">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div class="flex items-center gap-3 z-50">
          <img src="/images/logo-512.png" alt="FinNote" class="w-10 h-10 rounded-xl shadow-[0_0_20px_rgba(124,111,247,0.4)] object-cover ring-2 ring-white/10" />
          <span class="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">FinNote</span>
        </div>
        
        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center gap-6">
          <div class="flex items-center bg-white/5 rounded-full p-1 border border-white/10 backdrop-blur-md">
            <button 
              @click="setLocale('vi')"
              :class="['text-sm font-semibold transition-all rounded-full px-4 py-1.5', locale === 'vi' ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-gray-400 hover:text-white']"
              aria-label="Vietnamese"
            >
              VI
            </button>
            <button 
              @click="setLocale('en')"
              :class="['text-sm font-semibold transition-all rounded-full px-4 py-1.5', locale === 'en' ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-gray-400 hover:text-white']"
              aria-label="English"
            >
              EN
            </button>
          </div>
          <button @click="goToLogin" class="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group">
            {{ t('landing.nav.login') }}
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full"></span>
          </button>
          <button @click="startGuest" class="bg-white text-black hover:bg-gray-100 text-sm font-bold px-6 py-2.5 rounded-full transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 flex items-center gap-2 group">
            <span v-if="!isStarting">{{ t('landing.nav.tryNow') }}</span>
            <span v-else>{{ t('landing.nav.starting') }}</span>
            <ArrowRight :size="16" v-if="!isStarting" class="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <!-- Mobile Menu Toggle -->
        <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="md:hidden z-50 p-2 text-gray-300 hover:text-white" aria-label="Toggle menu">
          <Menu v-if="!isMobileMenuOpen" :size="24" />
          <X v-else :size="24" />
        </button>
      </div>

      <!-- Mobile Menu Overlay -->
      <div :class="['md:hidden fixed inset-0 bg-[#0a0a0f]/95 backdrop-blur-xl z-40 transition-all duration-300 flex flex-col justify-center items-center gap-8', isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none']">
        <div class="flex items-center bg-white/10 rounded-full p-1 border border-white/20">
            <button @click="setLocale('vi'); isMobileMenuOpen = false" :class="['text-sm font-semibold rounded-full px-6 py-2', locale === 'vi' ? 'bg-accent text-white' : 'text-gray-400']">VI</button>
            <button @click="setLocale('en'); isMobileMenuOpen = false" :class="['text-sm font-semibold rounded-full px-6 py-2', locale === 'en' ? 'bg-accent text-white' : 'text-gray-400']">EN</button>
        </div>
        <button @click="goToLogin(); isMobileMenuOpen = false" class="text-2xl font-bold text-gray-300 hover:text-white">{{ t('landing.nav.login') }}</button>
        <button @click="startGuest(); isMobileMenuOpen = false" class="bg-accent text-white text-xl font-bold px-8 py-4 rounded-full shadow-[0_0_30px_rgba(124,111,247,0.4)] w-[80%] max-w-[300px]">
          {{ isStarting ? t('landing.nav.starting') : t('landing.nav.tryNow') }}
        </button>
      </div>
    </nav>

    <!-- Hero Section -->
    <main class="pt-40 pb-20 relative px-4 sm:px-6 lg:px-8 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
      <!-- Background Effects -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-accent/20 blur-[150px] rounded-full pointer-events-none -z-10 animate-pulse-slow"></div>
      <div class="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>
      <div class="absolute bottom-20 left-20 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>
      
      <div class="max-w-5xl mx-auto text-center space-y-8 relative z-10 w-full">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-bold mb-4 backdrop-blur-md hover:bg-accent/20 transition-colors cursor-default reveal-on-scroll">
          <Sparkles :size="16" class="animate-pulse" />
          <span>{{ t('landing.hero.badge') }}</span>
        </div>
        
        <h1 class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-100 to-gray-500 leading-[1.15] min-h-[140px] sm:min-h-[160px] md:min-h-[200px] whitespace-pre-line drop-shadow-2xl px-2 pb-3">
          {{ typeWriterText }}<span v-if="isTyping" class="animate-pulse text-white">|</span>
        </h1>
        
        <p class="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-medium reveal-on-scroll" style="transition-delay: 0.2s">
          {{ t('landing.hero.description') }}
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8 reveal-on-scroll w-full sm:w-auto px-4" style="transition-delay: 0.3s">
          <button @click="startGuest" class="w-full sm:w-auto bg-gradient-to-r from-accent to-[#9381ff] text-white text-lg font-bold px-8 py-4 rounded-full transition-all shadow-[0_0_40px_rgba(124,111,247,0.4)] hover:shadow-[0_0_60px_rgba(124,111,247,0.6)] hover:scale-105 active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group">
            <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
            <span class="relative z-10" v-if="!isStarting">{{ t('landing.hero.ctaPrimary') }}</span>
            <span class="relative z-10" v-else>{{ t('landing.hero.starting') }}</span>
            <ArrowRight :size="20" v-if="!isStarting" class="relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>
          <a href="#features" class="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all text-center hover:scale-105 active:scale-95 flex justify-center items-center gap-2">
            {{ t('landing.hero.ctaSecondary') }}
            <ChevronRight :size="18" />
          </a>
        </div>
        
        <p class="text-sm text-gray-500 flex items-center justify-center gap-2 mt-8 reveal-on-scroll" style="transition-delay: 0.4s">
          <ShieldCheck :size="16" class="text-success" />
          {{ t('landing.hero.privacyNote') }}
        </p>
      </div>

      <!-- App Demo Video -->
      <div class="w-full max-w-6xl mx-auto mt-24 relative perspective-1000 reveal-on-scroll" style="transition-delay: 0.5s">
        <div class="absolute -inset-4 sm:-inset-8 bg-gradient-to-r from-accent/30 via-purple-500/20 to-accent/30 blur-[100px] opacity-60 rounded-[3rem] -z-10 animate-pulse-slow"></div>
        
        <div class="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0b0c10]/80 backdrop-blur-2xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.8)] ring-1 ring-white/5 mx-auto relative group">
          <!-- Window Controls -->
          <div class="h-10 sm:h-12 border-b border-white/5 flex items-center px-4 sm:px-5 gap-2 bg-gradient-to-r from-white/5 to-transparent absolute top-0 w-full z-10 backdrop-blur-md">
            <div class="flex gap-2">
              <div class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-error/90 hover:bg-error transition-colors cursor-pointer"></div>
              <div class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-warning/90 hover:bg-warning transition-colors cursor-pointer"></div>
              <div class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-success/90 hover:bg-success transition-colors cursor-pointer"></div>
            </div>
            <div class="mx-auto flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md sm:rounded-full bg-black/40 border border-white/5 text-[10px] sm:text-xs text-gray-400 font-medium truncate max-w-[200px] sm:max-w-xs">
              <ShieldCheck :size="12" class="text-accent/80 flex-shrink-0" />
              <span class="truncate">finnote-f4n.pages.dev</span>
            </div>
            <div class="w-12 sm:w-[54px]"></div>
          </div>
          
          <div class="relative w-full aspect-[16/9] sm:aspect-video bg-[#0b0c10] mt-10 sm:mt-12 overflow-hidden cursor-pointer" @click="toggleMute">
            <video 
              ref="demoVideoRef"
              src="/images/demo-veo3.mp4" 
              autoplay 
              loop 
              muted 
              playsinline
              webkit-playsinline
              preload="auto"
              class="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-1000 ease-out"
            ></video>
            
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none"></div>
            
            <div class="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 flex flex-col gap-1 sm:gap-2">
                <span class="text-white font-bold text-lg sm:text-2xl drop-shadow-md">{{ t('landing.demo.actionTitle') }}</span>
                <span class="text-gray-300 text-xs sm:text-sm drop-shadow-md">{{ t('landing.demo.actionDesc') }}</span>
            </div>

            <button 
              @click.stop="toggleMute" 
              class="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 shadow-xl"
              :aria-label="isMuted ? 'Unmute video' : 'Mute video'"
            >
              <VolumeX v-if="isMuted" :size="20" class="sm:w-6 sm:h-6" />
              <Volume2 v-else :size="20" class="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>
    </main>


    <!-- Bento Grid Features -->
    <section id="features" class="py-32 px-4 sm:px-6 relative">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-20 reveal-on-scroll">
            <h2 class="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 pb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{{ t('landing.features.title') }}</h2>
            <p class="text-xl text-gray-400 max-w-2xl mx-auto">{{ t('landing.features.subtitle') }}</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[350px]">
          
          <!-- Card 1 -->
          <div class="md:col-span-2 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/10 rounded-[2rem] p-8 sm:p-10 hover:border-accent/50 transition-all duration-500 relative overflow-hidden group shadow-xl reveal-on-scroll">
            <div class="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div class="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(124,111,247,0.2)]">
                        <Smartphone :size="32" stroke-width="1.5" />
                    </div>
                    <h3 class="text-3xl font-bold mb-4 text-white">{{ t('landing.features.sms.title') }}</h3>
                    <p class="text-gray-400 text-lg leading-relaxed max-w-md">
                        {{ t('landing.features.sms.desc') }}
                    </p>
                </div>
            </div>
            <div class="absolute -right-20 -bottom-20 opacity-[0.05] text-accent group-hover:scale-110 group-hover:opacity-10 transition-all duration-700 z-0 pointer-events-none rotate-12">
              <Zap :size="300" />
            </div>
          </div>
          
          <!-- Card 2 -->
          <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/10 rounded-[2rem] p-8 sm:p-10 hover:border-success/50 transition-all duration-500 relative overflow-hidden group shadow-xl reveal-on-scroll" style="transition-delay: 0.1s">
            <div class="relative z-10 flex flex-col h-full">
                <div class="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center mb-6 text-success group-hover:scale-110 transition-transform duration-500">
                    <ShieldCheck :size="28" stroke-width="1.5" />
                </div>
                <h3 class="text-2xl font-bold mb-4 text-white">{{ t('landing.features.privacy.title') }}</h3>
                <p class="text-gray-400 leading-relaxed">
                    {{ t('landing.features.privacy.desc') }}
                </p>
            </div>
          </div>
          
          <!-- Card 3 -->
          <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/10 rounded-[2rem] p-8 sm:p-10 hover:border-warning/50 transition-all duration-500 relative overflow-hidden group shadow-xl reveal-on-scroll" style="transition-delay: 0.2s">
            <div class="relative z-10 flex flex-col h-full">
                <div class="w-14 h-14 rounded-2xl bg-warning/20 flex items-center justify-center mb-6 text-warning group-hover:scale-110 transition-transform duration-500">
                    <LayoutDashboard :size="28" stroke-width="1.5" />
                </div>
                <h3 class="text-2xl font-bold mb-4 text-white">{{ t('landing.features.allInOne.title') }}</h3>
                <p class="text-gray-400 leading-relaxed">
                    {{ t('landing.features.allInOne.desc') }}
                </p>
            </div>
          </div>
          
          <!-- Card 4 -->
          <div class="md:col-span-2 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/10 rounded-[2rem] p-8 sm:p-10 hover:border-info/50 transition-all duration-500 relative overflow-hidden group shadow-xl reveal-on-scroll" style="transition-delay: 0.3s">
            <div class="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div class="w-16 h-16 rounded-2xl bg-info/20 flex items-center justify-center mb-6 text-info group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        <PenTool :size="32" stroke-width="1.5" />
                    </div>
                    <h3 class="text-3xl font-bold mb-4 text-white">{{ t('landing.features.knowledge.title') }}</h3>
                    <p class="text-gray-400 text-lg leading-relaxed max-w-md">
                        {{ t('landing.features.knowledge.desc') }}
                    </p>
                </div>
            </div>
            <div class="absolute -right-10 -bottom-10 opacity-[0.05] text-info group-hover:scale-110 group-hover:opacity-10 transition-all duration-700 z-0 pointer-events-none -rotate-12">
              <PenTool :size="250" />
            </div>
          </div>
          
        </div>
      </div>
    </section>

    <!-- Bottom CTA -->
    <section class="py-24 px-4 sm:px-6 reveal-on-scroll mb-20 relative">
        <div class="absolute inset-0 bg-accent/5 blur-3xl rounded-full max-w-3xl mx-auto z-0 pointer-events-none"></div>
      <div class="max-w-5xl mx-auto bg-gradient-to-br from-white/10 to-transparent border border-white/10 backdrop-blur-xl rounded-[3rem] p-10 sm:p-16 md:p-24 text-center relative overflow-hidden shadow-2xl">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>
        <h2 class="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 text-white relative z-10">{{ t('landing.cta.title') }}</h2>
        <p class="text-xl text-gray-300 mb-12 max-w-2xl mx-auto relative z-10 font-medium">
          {{ t('landing.cta.desc') }}
        </p>
        <button @click="startGuest" class="w-full sm:w-auto bg-white text-black hover:bg-gray-100 text-xl font-bold px-12 py-5 rounded-full transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:shadow-[0_0_80px_rgba(255,255,255,0.5)] hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto relative z-10 group">
          <span v-if="!isStarting">{{ t('landing.cta.button') }}</span>
          <span v-else>{{ t('landing.cta.starting') }}</span>
          <ArrowRight :size="24" v-if="!isStarting" class="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    </section>
    
    <!-- Footer -->
    <footer class="py-10 border-t border-white/10 bg-[#050508] text-center text-gray-500 text-sm">
        <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="flex items-center gap-2">
                <img src="/images/logo-512.png" alt="Logo" class="w-6 h-6 rounded-md opacity-50 grayscale" />
                <span class="font-bold opacity-80">{{ t('landing.footer.copyright') }}</span>
            </div>
            <div class="flex gap-6">
                <a href="mailto:admin@finnote.vn" class="hover:text-white transition-colors">{{ t('landing.footer.contact') }}</a>
            </div>
        </div>
    </footer>
  </div>
</template>

<style scoped>
.glass-nav {
  background: rgba(10, 10, 15, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.perspective-1000 {
  perspective: 1000px;
}

.reveal-on-scroll {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal-visible {
  opacity: 1;
  transform: translateY(0);
}

.animate-pulse-slow {
    animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
}
</style>
