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
  <transition name="fade">
    <div v-if="ui.showWeeklyEvent" class="fixed inset-0 z-[9999] flex flex-col bg-bg-surface overflow-hidden">
      <!-- Background elements -->
      <div class="absolute inset-0 bg-accent/5"></div>
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-accent rounded-full opacity-20 blur-3xl"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-accent rounded-full opacity-20 blur-3xl"></div>

      <!-- Header -->
      <div class="relative z-10 p-6 flex justify-between items-center max-w-[75rem] mx-auto w-full">
        <div class="flex items-center gap-2 text-accent font-bold">
          <Sparkles :size="20" />
          <span>{{ t('weeklyEvent.title') }}</span>
        </div>
        <button @click="skip" class="p-2 bg-bg-elevated rounded-full text-text-tertiary hover:text-text-primary transition-colors">
          <X :size="20" />
        </button>
      </div>

      <!-- Content -->
      <div class="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
        <!-- Banner Image -->
        <div class="w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl mb-8 relative border border-border-default">
          <img :src="topic.image" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6 md:p-8">
            <h2 class="text-2xl md:text-3xl font-bold text-white leading-tight">{{ topic.title }}</h2>
          </div>
        </div>

        <p class="text-lg text-text-secondary text-center mb-10 leading-relaxed">
          {{ topic.desc }}
        </p>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-4 w-full">
          <button @click="skip" class="flex-1 py-4 px-6 rounded-2xl bg-bg-elevated border border-border-default text-text-primary font-semibold hover:bg-bg-hover transition-colors text-center">
            {{ t('weeklyEvent.skip') }}
          </button>
          <button @click="interact" class="flex-1 py-4 px-6 rounded-2xl bg-accent text-white font-bold hover:bg-accent-hover transition-colors text-center shadow-lg shadow-accent/20 flex justify-center items-center gap-2 group">
            {{ t('weeklyEvent.join') }}
            <ChevronRight :size="20" class="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <!-- Mascot -->
      <div class="absolute bottom-0 right-0 md:right-20 md:-bottom-10 pointer-events-none opacity-80 md:opacity-100">
        <CatMascot type="orange" size="xl" animation="wave" />
      </div>
      <div class="absolute -bottom-10 left-0 md:left-20 pointer-events-none opacity-50 md:opacity-100 hidden sm:block">
        <CatMascot type="grey" size="lg" animation="float" />
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
