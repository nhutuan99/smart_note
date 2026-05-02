<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useUiStore } from '@/stores/ui'
import CatMascot from '@/components/ui/CatMascot.vue'
import { X } from 'lucide-vue-next'

const ui = useUiStore()

const currentMessage = ref<string>('')
const currentSpeaker = ref<'orange' | 'grey' | null>(null)
const stepIndex = ref(0)
let timer: ReturnType<typeof setTimeout> | null = null

watch(() => ui.showStoryModal, (show) => {
  if (show && ui.storyMessages.length > 0) {
    playStory()
  } else {
    reset()
  }
})

function playStory() {
  stepIndex.value = 0
  showNextMessage()
}

function showNextMessage() {
  if (stepIndex.value >= ui.storyMessages.length) {
    // End of story
    timer = setTimeout(() => {
      ui.showStoryModal = false
    }, 4000)
    return
  }

  const msg = ui.storyMessages[stepIndex.value]
  currentSpeaker.value = msg.character as 'orange' | 'grey'
  currentMessage.value = msg.text

  stepIndex.value++

  // Next message after 4 seconds
  timer = setTimeout(() => {
    currentMessage.value = ''
    timer = setTimeout(showNextMessage, 500)
  }, 4000)
}

function reset() {
  if (timer) clearTimeout(timer)
  currentMessage.value = ''
  currentSpeaker.value = null
  stepIndex.value = 0
}

function close() {
  ui.showStoryModal = false
}

onUnmounted(() => {
  reset()
})
</script>

<template>
  <transition name="slide-up">
    <div v-if="ui.showStoryModal" class="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 z-[9000] max-w-sm w-full pointer-events-none">
      <div class="relative bg-bg-elevated/90 backdrop-blur-md border border-border-default shadow-2xl rounded-3xl p-4 sm:p-6 pointer-events-auto">
        
        <button @click="close" class="absolute top-3 right-3 p-1.5 text-text-tertiary hover:text-text-primary bg-bg-surface rounded-full transition-colors z-10">
          <X :size="16" />
        </button>

        <div class="flex items-end justify-between mt-6 relative min-h-[120px]">
          
          <!-- Grey Cat (Left) -->
          <div class="relative flex flex-col items-center">
            <transition name="bubble">
              <div v-if="currentSpeaker === 'grey' && currentMessage" class="absolute bottom-full left-1/2 -translate-x-1/4 mb-4 bg-bg-surface border border-border-default shadow-lg rounded-2xl p-3 text-sm text-text-primary max-w-[200px] w-max z-20">
                {{ currentMessage }}
                <div class="absolute -bottom-2 left-4 w-4 h-4 bg-bg-surface border-b border-r border-border-default transform rotate-45"></div>
              </div>
            </transition>
            <div class="w-20 h-20 relative z-10">
              <CatMascot type="grey" size="md" :animation="currentSpeaker === 'grey' ? 'wave' : 'idle'" />
            </div>
          </div>

          <!-- Orange Cat (Right) -->
          <div class="relative flex flex-col items-center">
            <transition name="bubble">
              <div v-if="currentSpeaker === 'orange' && currentMessage" class="absolute bottom-full right-1/2 translate-x-1/4 mb-4 bg-accent text-white shadow-[0_4px_20px_rgba(142,125,250,0.3)] rounded-2xl p-3 text-sm max-w-[200px] w-max z-20 font-medium">
                {{ currentMessage }}
                <div class="absolute -bottom-2 right-4 w-4 h-4 bg-accent transform rotate-45"></div>
              </div>
            </transition>
            <div class="w-20 h-20 relative z-10">
              <CatMascot type="orange" size="md" :animation="currentSpeaker === 'orange' ? 'wave' : 'idle'" />
            </div>
          </div>

        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(50px) scale(0.9);
}

.bubble-enter-active,
.bubble-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.bubble-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}
.bubble-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
