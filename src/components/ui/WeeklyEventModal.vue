<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import CatMascot from '@/components/ui/CatMascot.vue'
import { Sparkles, X, ChevronRight } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const ui = useUiStore()
const { t } = useI18n()

// Generate topics from i18n
const topics = computed(() => [
  {
    title: t('weeklyEvent.topics.t1_title'),
    desc: t('weeklyEvent.topics.t1_desc'),
    image: 'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: t('weeklyEvent.topics.t2_title'),
    desc: t('weeklyEvent.topics.t2_desc'),
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: t('weeklyEvent.topics.t3_title'),
    desc: t('weeklyEvent.topics.t3_desc'),
    image: 'https://images.unsplash.com/photo-1616514197671-15d99ce7a6f8?q=80&w=800&auto=format&fit=crop'
  }
])

const topic = ref(topics.value[0])

onMounted(() => {
  topic.value = topics.value[Math.floor(Math.random() * topics.value.length)]
})

function interact() {
  ui.showToast('success', t('weeklyEvent.success'))
  ui.completeWeeklyEvent()
}

function skip() {
  ui.completeWeeklyEvent()
}
</script>

<template>
  <transition name="bounce">
    <div v-if="ui.showWeeklyEvent" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <!-- Backdrop with Heavy Blur -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-xl"></div>
      
      <!-- Glowing Orbs in Background -->
      <div class="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-accent/30 rounded-full blur-[100px] animate-pulse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-[25rem] h-[25rem] bg-pink-500/20 rounded-full blur-[100px] animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-blue-500/10 rounded-full blur-[120px]"></div>

      <!-- Main Event Card -->
      <div class="relative z-10 w-full max-w-3xl rounded-[2rem] bg-bg-surface/60 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(142,125,250,0.3)] overflow-visible">
        
        <!-- Header -->
        <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent to-pink-500 text-white px-8 py-2 rounded-full font-bold shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center gap-2 uppercase tracking-wider text-sm sm:text-base border border-white/20">
          <Sparkles :size="18" class="animate-spin-slow" />
          {{ t('weeklyEvent.title') }}
          <Sparkles :size="18" class="animate-spin-slow" />
        </div>

        <button @click="skip" class="absolute top-6 right-6 p-2 bg-black/20 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-md z-20">
          <X :size="24" />
        </button>

        <!-- Content Layout -->
        <div class="flex flex-col md:flex-row relative z-10 pt-12 pb-8 px-6 sm:px-10 gap-8 items-center">
          
          <!-- Image Section -->
          <div class="w-full md:w-1/2 relative group">
            <div class="absolute inset-0 bg-gradient-to-tr from-accent to-pink-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div class="relative aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10">
              <img :src="topic.image" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            </div>
            
            <!-- Mascots popping out -->
            <div class="absolute -bottom-8 -right-8 w-32 h-32 md:w-40 md:h-40 animate-float drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-20">
              <CatMascot type="orange" size="xl" animation="wave" />
            </div>
            <div class="absolute -top-8 -left-8 w-24 h-24 md:w-28 md:h-28 animate-float drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-0" style="animation-delay: 1.5s;">
              <CatMascot type="grey" size="lg" animation="float" />
            </div>
          </div>

          <!-- Text & Actions Section -->
          <div class="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
            <h2 class="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-4 leading-tight drop-shadow-sm">
              {{ topic.title }}
            </h2>
            <p class="text-lg text-white/80 mb-8 leading-relaxed font-medium">
              {{ topic.desc }}
            </p>

            <div class="flex flex-col w-full gap-4 mt-auto">
              <button @click="interact" class="relative group w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-accent to-pink-500 text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(142,125,250,0.6)] transition-all duration-300 flex justify-center items-center gap-2 overflow-hidden border border-white/20">
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
</style>
