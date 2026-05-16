<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Send, MessageSquare, CheckCircle2 } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()

const name = ref('')
const email = ref('')
const subject = ref('')
const message = ref('')
const showSuccess = ref(false)

watch(
  () => props.show,
  (v) => {
    if (v) {
      name.value = ''
      email.value = ''
      subject.value = ''
      message.value = ''
      showSuccess.value = false
    }
  }
)

const canSubmit = computed(
  () => name.value.trim() && email.value.trim() && subject.value.trim() && message.value.trim()
)

function submitContact() {
  if (!canSubmit.value) return

  // Compose mailto — email decoded from base64 env var at runtime
  const recipient = atob(import.meta.env.VITE_CONTACT_EMAIL_B64 || '')
  const subjectLine = `[FinNote Contact] ${subject.value}`
  const body = [
    `From: ${name.value}`,
    `Reply Email: ${email.value}`,
    '',
    message.value
  ].join('\n')

  const mailtoUrl =
    'mailto:' +
    encodeURIComponent(recipient) +
    '?subject=' +
    encodeURIComponent(subjectLine) +
    '&body=' +
    encodeURIComponent(body)

  window.open(mailtoUrl, '_blank')
  showSuccess.value = true
}

function close() {
  emit('close')
}
</script>

<template>
  <transition name="modal-fade">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="close"></div>

      <!-- Modal -->
      <div class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ring-1 ring-white/10 bg-[#0f0f18]">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02] sticky top-0 z-10 backdrop-blur-md">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-[#7c6ff7]">
              <MessageSquare class="h-5 w-5" />
            </div>
            <h3 class="text-lg font-semibold text-white">{{ t('landing.contactModal.title') }}</h3>
          </div>
          <button @click="close" class="rounded-full p-2 text-gray-400 hover:bg-white/10 transition-colors">
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Success state -->
        <div v-if="showSuccess" class="p-10 text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 :size="32" class="text-emerald-400" />
          </div>
          <h4 class="text-xl font-bold text-white mb-2">{{ t('landing.contactModal.successTitle') }}</h4>
          <p class="text-gray-400 text-sm mb-8">{{ t('landing.contactModal.successDesc') }}</p>
          <button @click="close" class="bg-white text-black font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors">
            {{ t('landing.contactModal.close') }}
          </button>
        </div>

        <!-- Form -->
        <template v-else>
          <div class="p-6 space-y-5">
            <p class="text-sm text-gray-400">
              {{ t('landing.contactModal.desc') }}
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Name -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1.5">
                  {{ t('landing.contactModal.name') }} <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="name"
                  type="text"
                  :placeholder="t('landing.contactModal.namePlaceholder')"
                  class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:bg-white/[0.08] focus:border-[#7c6ff7]/50 focus:outline-none focus:ring-1 focus:ring-[#7c6ff7]/50 transition-all"
                />
              </div>

              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1.5">
                  Email <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="email"
                  type="email"
                  :placeholder="t('landing.contactModal.emailPlaceholder')"
                  class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:bg-white/[0.08] focus:border-[#7c6ff7]/50 focus:outline-none focus:ring-1 focus:ring-[#7c6ff7]/50 transition-all"
                />
              </div>
            </div>

            <!-- Subject -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1.5">
                {{ t('landing.contactModal.subject') }} <span class="text-red-400">*</span>
              </label>
              <input
                v-model="subject"
                type="text"
                :placeholder="t('landing.contactModal.subjectPlaceholder')"
                class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:bg-white/[0.08] focus:border-[#7c6ff7]/50 focus:outline-none focus:ring-1 focus:ring-[#7c6ff7]/50 transition-all"
              />
            </div>

            <!-- Message -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1.5">
                {{ t('landing.contactModal.message') }} <span class="text-red-400">*</span>
              </label>
              <textarea
                v-model="message"
                rows="5"
                :placeholder="t('landing.contactModal.messagePlaceholder')"
                class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:bg-white/[0.08] focus:border-[#7c6ff7]/50 focus:outline-none focus:ring-1 focus:ring-[#7c6ff7]/50 transition-all resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4 bg-white/[0.02] sticky bottom-0">
            <button
              @click="close"
              class="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              {{ t('landing.contactModal.cancel') }}
            </button>
            <button
              @click="submitContact"
              :disabled="!canSubmit"
              :class="[
                'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
                canSubmit
                  ? 'bg-gradient-to-r from-[#7c6ff7] to-[#9381ff] text-white shadow-lg shadow-[#7c6ff7]/20 hover:shadow-[#7c6ff7]/40 hover:-translate-y-0.5'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              ]"
            >
              <Send :size="14" />
              {{ t('landing.contactModal.submit') }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
