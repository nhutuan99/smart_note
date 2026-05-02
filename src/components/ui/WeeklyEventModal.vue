<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import CatMascot from '@/components/ui/CatMascot.vue'
import { Sparkles, X, ChevronRight, Loader2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { httpClient } from '@/shared/api/httpClient'

const ui = useUiStore()
const auth = useAuthStore()
const { t } = useI18n()
const router = useRouter()

const isAnimating = ref(false)
const showModalContent = ref(false)
const currentScene = ref(0)

const generatedEvent = ref<{title: string, desc: string, imagePrompt: string} | null>(null)
const generatedImageBlob = ref<string>('')
const isGeneratingText = ref(false)
const isGeneratingImage = ref(false)

// Trigger the chase animation when the modal is opened
watch(() => ui.showWeeklyEvent, async (newVal) => {
  if (newVal) {
    // Determine the next scene to show based on localStorage (0, 1, 2)
    const lastIndex = parseInt(localStorage.getItem('lastSceneIndex') || '-1')
    const nextIndex = (lastIndex + 1) % 3
    currentScene.value = nextIndex
    localStorage.setItem('lastSceneIndex', nextIndex.toString())

    isAnimating.value = true
    showModalContent.value = false
    
    isGeneratingText.value = true
    isGeneratingImage.value = true
    generatedEvent.value = null
    generatedImageBlob.value = ''
    
    // Fire and forget the AI requests
    ;(async () => {
      try {
        const textRes = await httpClient.post<{data: string}>('/api/ai', { action: 'weekly_event' })
        const eventData = JSON.parse(textRes.data || '{}')
        generatedEvent.value = eventData
        isGeneratingText.value = false
        
        if (eventData.imagePrompt) {
          const apiBase = import.meta.env.VITE_API_URL || ''
          const imgRes = await fetch(`${apiBase}/api/ai/image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${auth.token}`
            },
            body: JSON.stringify({ prompt: eventData.imagePrompt })
          })
          if (!imgRes.ok) throw new Error('Image generation failed')
          const blob = await imgRes.blob()
          generatedImageBlob.value = URL.createObjectURL(blob)
          isGeneratingImage.value = false
        }
      } catch (err) {
        console.error('AI Event Error:', err)
        isGeneratingText.value = false
        isGeneratingImage.value = false
        // Fallback
        generatedEvent.value = {
          title: t('weeklyEvent.topics.t1_title'),
          desc: t('weeklyEvent.topics.t1_desc'),
          imagePrompt: ''
        }
        generatedImageBlob.value = '/images/events/event1.png'
      }
    })()
    
    // The boom happens at 1.375s (55% of 2.5s)
    setTimeout(() => {
      showModalContent.value = true
    }, 1375)
    
    // Clean up animation elements
    setTimeout(() => {
      isAnimating.value = false
    }, 3100)
  } else {
    isAnimating.value = false
    showModalContent.value = false
  }
})

function interact() {
  ui.showToast('success', t('weeklyEvent.success'))
  ui.completeWeeklyEvent()
  router.push('/budget')
}

function skip() {
  ui.completeWeeklyEvent()
}
</script>

<template>
  <transition name="bounce">
    <div v-if="ui.showWeeklyEvent" class="fixed inset-0 z-[9999]">
      <!-- Backdrop with Heavy Blur -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-xl pointer-events-none"></div>
      
      <!-- Glowing Orbs in Background -->
      <div class="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-accent/30 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div class="absolute bottom-1/4 right-1/4 w-[25rem] h-[25rem] bg-pink-500/20 rounded-full blur-[100px] animate-pulse pointer-events-none" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <!-- The 3 CSS Scenes Layer -->
      <div v-if="isAnimating && !showModalContent" class="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden" :class="'scene-' + currentScene">
         <!-- Grey Cat (Mít) -->
         <CatMascot type="grey" size="xl" class="absolute left-1/2 top-1/2 -mt-16 -ml-16 cat-grey drop-shadow-2xl will-change-transform" />
         <!-- Orange Cat (Múp) -->
         <CatMascot type="orange" size="xl" class="absolute left-1/2 top-1/2 -mt-16 -ml-16 cat-orange drop-shadow-2xl will-change-transform" />
         <!-- Explosion Boom -->
         <div class="absolute left-1/2 top-1/2 w-96 h-96 bg-gradient-to-tr from-accent via-pink-500 to-yellow-400 rounded-full blur-[40px] mix-blend-screen animate-boom will-change-transform"></div>
         <Sparkles class="absolute left-1/2 top-1/2 text-white animate-boom-sparkles will-change-transform" />
      </div>

      <!-- Scrollable Container for Modal -->
      <div class="absolute inset-0 overflow-y-auto overflow-x-hidden pointer-events-auto">
        <div class="min-h-full flex items-center justify-center p-4 sm:p-6 pt-[max(env(safe-area-inset-top,2rem),3rem)] pb-[max(env(safe-area-inset-bottom,2rem),3rem)]">

      <!-- Main Event Card -->
      <transition name="scale-fade">
        <div v-if="showModalContent" class="relative z-10 w-full max-w-3xl rounded-[2rem] bg-bg-surface/60 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(142,125,250,0.3)] overflow-visible">
        
        <!-- Header -->
        <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent to-pink-500 text-white px-8 py-2 rounded-full font-bold shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center gap-2 uppercase tracking-wider text-sm sm:text-base border border-white/20">
          <Sparkles :size="18" class="animate-spin-slow" />
          {{ t('weeklyEvent.title') }}
          <Sparkles :size="18" class="animate-spin-slow" />
        </div>



        <!-- Content Layout -->
        <div class="flex flex-col md:flex-row relative z-10 pt-10 sm:pt-12 pb-6 sm:pb-8 px-5 sm:px-10 gap-6 sm:gap-8 items-center">
          
          <!-- Image Section -->
          <div class="w-full md:w-1/2 relative group">
            <div class="absolute inset-0 bg-gradient-to-tr from-accent to-pink-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div class="relative aspect-video sm:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10" :class="{'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500': isGeneratingImage}">
              <img v-if="!isGeneratingImage && generatedImageBlob" :src="generatedImageBlob" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
              <div v-if="isGeneratingImage" class="w-full h-full flex flex-col items-center justify-center text-white/50 px-4 text-center">
                <Loader2 :size="48" class="mb-4 opacity-50 animate-spin" />
                <p class="font-medium">AI đang vẽ ảnh minh họa...</p>
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            </div>
            
            <!-- Mascots popping out -->
            <div class="absolute -bottom-6 -right-6 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 z-20 will-change-transform" style="transform: translateZ(0);">
              <CatMascot type="orange" size="xl" animation="wave" />
            </div>
            <div class="absolute -top-6 -left-6 w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 z-0 will-change-transform" style="transform: translateZ(0);">
              <CatMascot type="grey" size="lg" animation="float" />
            </div>
          </div>

          <!-- Text & Actions Section -->
          <div class="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left min-h-[160px]">
            <template v-if="isGeneratingText">
              <div class="w-3/4 h-10 bg-white/10 rounded-lg animate-pulse mb-4"></div>
              <div class="w-full h-4 bg-white/5 rounded animate-pulse mb-2"></div>
              <div class="w-5/6 h-4 bg-white/5 rounded animate-pulse mb-2"></div>
              <div class="w-4/6 h-4 bg-white/5 rounded animate-pulse mb-8"></div>
            </template>
            <template v-else-if="generatedEvent">
              <h2 class="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-3 sm:mb-4 leading-tight drop-shadow-sm">
                {{ generatedEvent.title }}
              </h2>
              <p class="text-base sm:text-lg text-white/80 mb-6 sm:mb-8 leading-relaxed font-medium">
                {{ generatedEvent.desc }}
              </p>
            </template>

            <div class="flex flex-col w-full gap-4 mt-auto">
              <button :disabled="isGeneratingText" @click="interact" class="relative group w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-accent to-pink-500 text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(142,125,250,0.6)] transition-all duration-300 flex justify-center items-center gap-2 overflow-hidden border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
                <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span class="relative z-10">{{ t('weeklyEvent.join') }}</span>
                <ChevronRight :size="24" class="relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
              <button @click="skip" class="w-full py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-semibold transition-colors text-center backdrop-blur-md">
                {{ t('weeklyEvent.skip') }}
              </button>
            </div>
          </div>
        </div>
        </div>
      </transition>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Bounce Entrance Animation */
.bounce-enter-active {
  animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.bounce-leave-active {
  animation: bounce-in 0.4s reverse ease-in;
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(50px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-spin-slow {
  animation: spin 4s linear infinite;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}

/* --- 3 Cat Scenes Animations --- */
.scene-0 .cat-orange { animation: s0-orange 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
.scene-0 .cat-grey   { animation: s0-grey 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; }

.scene-1 .cat-orange { animation: s1-orange 2.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.scene-1 .cat-grey   { animation: s1-grey 2.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

.scene-2 .cat-orange { animation: s2-orange 2.5s ease-out forwards; }
.scene-2 .cat-grey   { animation: s2-grey 2.5s ease-out forwards; }

/* Scene 0: Chase */
@keyframes s0-orange {
  0% { transform: translate3d(-100vw, 0, 0) rotate(-15deg); opacity: 1; }
  10% { transform: translate3d(-80vw, -80px, 0) rotate(15deg); }
  20% { transform: translate3d(-60vw, 0, 0) rotate(-15deg); }
  30% { transform: translate3d(-40vw, -80px, 0) rotate(15deg); }
  40% { transform: translate3d(-20vw, 0, 0) rotate(-15deg); }
  50% { transform: translate3d(-10vw, -40px, 0) rotate(10deg); opacity: 1; }
  55% { transform: translate3d(0, 0, 0) rotate(0) scale(1.5); opacity: 0; filter: brightness(2); }
  100% { transform: translate3d(0, 0, 0) rotate(0) scale(2); opacity: 0; }
}
@keyframes s0-grey {
  0% { transform: translate3d(-130vw, 0, 0) rotate(-15deg); opacity: 1; }
  10% { transform: translate3d(-104vw, -80px, 0) rotate(15deg); }
  20% { transform: translate3d(-78vw, 0, 0) rotate(-15deg); }
  30% { transform: translate3d(-52vw, -80px, 0) rotate(15deg); }
  40% { transform: translate3d(-26vw, 0, 0) rotate(-15deg); }
  50% { transform: translate3d(-13vw, -40px, 0) rotate(10deg); opacity: 1; }
  55% { transform: translate3d(0, 0, 0) rotate(0) scale(1.5); opacity: 0; filter: brightness(2); }
  100% { transform: translate3d(0, 0, 0) rotate(0) scale(2); opacity: 0; }
}

/* Scene 1: Peekaboo Jump */
@keyframes s1-orange {
  0% { transform: translate3d(-50vw, 50vh, 0) rotate(-45deg); opacity: 0; }
  20% { transform: translate3d(-40vw, 20vh, 0) rotate(-10deg); opacity: 1; }
  30% { transform: translate3d(-40vw, 20vh, 0) rotate(-10deg) scale(1.1); }
  50% { transform: translate3d(-10vw, -10vh, 0) rotate(15deg) scale(1); opacity: 1; }
  55% { transform: translate3d(0, 0, 0) rotate(0) scale(1.2); opacity: 0; filter: brightness(2); }
  100% { transform: translate3d(0, 0, 0) scale(2); opacity: 0; }
}
@keyframes s1-grey {
  0% { transform: translate3d(50vw, 50vh, 0) rotate(45deg) scaleX(-1); opacity: 0; }
  20% { transform: translate3d(40vw, 20vh, 0) rotate(10deg) scaleX(-1); opacity: 1; }
  30% { transform: translate3d(40vw, 20vh, 0) rotate(10deg) scaleX(-1) scale(1.1); }
  50% { transform: translate3d(10vw, -10vh, 0) rotate(-15deg) scaleX(-1) scale(1); opacity: 1; }
  55% { transform: translate3d(0, 0, 0) rotate(0) scaleX(-1) scale(1.2); opacity: 0; filter: brightness(2); }
  100% { transform: translate3d(0, 0, 0) scaleX(-1) scale(2); opacity: 0; }
}

/* Scene 2: Float Spin */
@keyframes s2-orange {
  0% { transform: translate3d(-80vw, -50vh, 0) rotate(-360deg) scale(0.5); opacity: 0; }
  20% { transform: translate3d(-40vw, -20vh, 0) rotate(-180deg) scale(1); opacity: 1; }
  50% { transform: translate3d(-10vw, -10px, 0) rotate(-45deg) scale(1.2); opacity: 1; }
  55% { transform: translate3d(0, 0, 0) rotate(0) scale(1.5); opacity: 0; filter: brightness(2); }
  100% { transform: translate3d(0, 0, 0) scale(2); opacity: 0; }
}
@keyframes s2-grey {
  0% { transform: translate3d(80vw, -50vh, 0) rotate(360deg) scaleX(-1) scale(0.5); opacity: 0; }
  20% { transform: translate3d(40vw, -20vh, 0) rotate(180deg) scaleX(-1) scale(1); opacity: 1; }
  50% { transform: translate3d(10vw, -10px, 0) rotate(45deg) scaleX(-1) scale(1.2); opacity: 1; }
  55% { transform: translate3d(0, 0, 0) rotate(0) scaleX(-1) scale(1.5); opacity: 0; filter: brightness(2); }
  100% { transform: translate3d(0, 0, 0) scaleX(-1) scale(2); opacity: 0; }
}

.animate-boom {
  animation: boom 2.5s ease-out forwards;
}
@keyframes boom {
  0%, 53% { transform: translate3d(-50%, -50%, 0) scale(0); opacity: 0; }
  55% { transform: translate3d(-50%, -50%, 0) scale(1.5); opacity: 1; }
  70% { transform: translate3d(-50%, -50%, 0) scale(4); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(5); opacity: 0; }
}

.animate-boom-sparkles {
  animation: boom-sparkles 2.5s ease-out forwards;
}
@keyframes boom-sparkles {
  0%, 53% { transform: translate3d(-50%, -50%, 0) scale(0) rotate(0deg); opacity: 0; }
  55% { transform: translate3d(-50%, -50%, 0) scale(4) rotate(45deg); opacity: 1; }
  70% { transform: translate3d(-50%, -50%, 0) scale(8) rotate(90deg); opacity: 0; }
  100% { transform: translate3d(-50%, -50%, 0) scale(8) rotate(90deg); opacity: 0; }
}

/* Modal Entry Animation */
.scale-fade-enter-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scale-fade-leave-active {
  transition: all 0.3s ease-in;
}
.scale-fade-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(50px);
}
.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>
