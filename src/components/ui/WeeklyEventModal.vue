<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import CatMascot from '@/components/ui/CatMascot.vue'
import { Sparkles, ChevronRight, Loader2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { httpClient } from '@/shared/api/httpClient'

const ui = useUiStore()
const auth = useAuthStore()
const { t } = useI18n()
const router = useRouter()

const showModalContent = ref(false)

const generatedEvent = ref<{title: string, desc: string, imagePrompt: string} | null>(null)
const generatedImageBlob = ref<string>('')
const isGeneratingText = ref(false)
const isGeneratingImage = ref(false)

watch(() => ui.showWeeklyEvent, async (newVal) => {
  if (newVal) {
    showModalContent.value = false
    isGeneratingText.value = true
    isGeneratingImage.value = true
    generatedEvent.value = null
    generatedImageBlob.value = ''

    // Show modal content after a brief delay for smooth entrance
    setTimeout(() => {
      showModalContent.value = true
    }, 100)

    // Fire AI requests
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
        generatedEvent.value = {
          title: t('weeklyEvent.topics.t1_title'),
          desc: t('weeklyEvent.topics.t1_desc'),
          imagePrompt: ''
        }
        generatedImageBlob.value = '/images/events/event1.png'
      }
    })()
  } else {
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
  <transition name="modal-fade">
    <div v-if="ui.showWeeklyEvent" class="fixed inset-0 z-[9999]">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-md" @click="skip"></div>

      <!-- Scrollable Container -->
      <div class="absolute inset-0 overflow-y-auto overflow-x-hidden">
        <div class="min-h-full flex items-center justify-center p-4 sm:p-6 pt-[max(env(safe-area-inset-top,2rem),3rem)] pb-[max(env(safe-area-inset-bottom,2rem),3rem)]">

      <!-- Main Event Card -->
      <transition name="scale-up">
        <div v-if="showModalContent" class="relative z-10 w-full max-w-3xl rounded-[2rem] bg-bg-surface/80 backdrop-blur-2xl border border-border-default shadow-[0_8px_40px_rgba(0,0,0,0.4)] overflow-visible">

        <!-- Header Badge -->
        <div class="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent to-pink-500 text-white px-6 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-2 uppercase tracking-wider text-xs sm:text-sm border border-white/15">
          <Sparkles :size="16" />
          {{ t('weeklyEvent.title') }}
          <Sparkles :size="16" />
        </div>

        <!-- Content Layout -->
        <div class="flex flex-col md:flex-row relative z-10 pt-10 sm:pt-12 pb-6 sm:pb-8 px-5 sm:px-10 gap-6 sm:gap-8 items-center">

          <!-- Image Section -->
          <div class="w-full md:w-1/2 relative group">
            <div class="absolute inset-0 bg-gradient-to-tr from-accent/20 to-pink-500/20 rounded-2xl blur-xl opacity-50 transition-opacity duration-500"></div>
            <div class="relative aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-white/10" :class="{'bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30': isGeneratingImage}">
              <img v-if="!isGeneratingImage && generatedImageBlob" :src="generatedImageBlob" class="w-full h-full object-cover" />
              <div v-if="isGeneratingImage" class="w-full h-full flex flex-col items-center justify-center text-white/50 px-4 text-center">
                <Loader2 :size="40" class="mb-3 opacity-50 animate-spin" />
                <p class="text-sm font-medium">{{ t('weeklyEvent.generatingImage') }}</p>
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>

            <!-- Static mascots (no animation to avoid jank) -->
            <div class="absolute -bottom-4 -right-4 w-20 h-20 sm:w-24 sm:h-24 z-20">
              <CatMascot type="orange" size="lg" animation="idle" />
            </div>
            <div class="absolute -top-4 -left-4 w-14 h-14 sm:w-20 sm:h-20 z-0">
              <CatMascot type="grey" size="md" animation="idle" />
            </div>
          </div>

          <!-- Text & Actions Section -->
          <div class="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left min-h-[160px]">
            <template v-if="isGeneratingText">
              <div class="w-3/4 h-8 bg-white/10 rounded-lg animate-pulse mb-4"></div>
              <div class="w-full h-4 bg-white/5 rounded animate-pulse mb-2"></div>
              <div class="w-5/6 h-4 bg-white/5 rounded animate-pulse mb-2"></div>
              <div class="w-4/6 h-4 bg-white/5 rounded animate-pulse mb-8"></div>
            </template>
            <template v-else-if="generatedEvent">
              <h2 class="text-xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-3 sm:mb-4 leading-tight">
                {{ generatedEvent.title }}
              </h2>
              <p class="text-sm sm:text-base text-white/70 mb-6 sm:mb-8 leading-relaxed">
                {{ generatedEvent.desc }}
              </p>
            </template>

            <div class="flex flex-col w-full gap-3 mt-auto">
              <button :disabled="isGeneratingText" @click="interact" class="group w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-accent to-pink-500 text-white font-bold text-base hover:shadow-lg transition-all duration-200 flex justify-center items-center gap-2 border border-white/15 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                <span>{{ t('weeklyEvent.join') }}</span>
                <ChevronRight :size="20" class="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button @click="skip" class="w-full py-3.5 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 font-medium transition-colors text-center text-sm active:scale-[0.98]">
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
/* Clean modal entrance — no heavy transforms */
.modal-fade-enter-active {
  transition: opacity 0.3s ease;
}
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Card scale-up */
.scale-up-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.scale-up-leave-active {
  transition: all 0.2s ease-in;
}
.scale-up-enter-from {
  opacity: 0;
  transform: scale(0.92) translateY(20px);
}
.scale-up-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
