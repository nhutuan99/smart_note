<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Bug, X, Send, Loader2 } from 'lucide-vue-next'
import { httpClient } from '@/shared/api/httpClient'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const ui = useUiStore()

const title = ref('')
const description = ref('')
const loading = ref(false)

const userAgent = ref('')
const currentUrl = ref('')

onMounted(() => {
  userAgent.value = navigator.userAgent
  currentUrl.value = window.location.href
})

async function submitReport() {
  if (!title.value.trim() || !description.value.trim()) {
    ui.showToast('error', 'Vui lòng nhập đầy đủ Tiêu đề và Mô tả lỗi')
    return
  }

  loading.value = true
  try {
    const res = await httpClient.post<{ message: string }>('/api/report-bug', {
      title: title.value,
      description: description.value,
      url: currentUrl.value,
      userAgent: userAgent.value
    })

    ui.showToast('success', res?.message || 'Đã gửi báo cáo lỗi thành công!')
    title.value = ''
    description.value = ''
    emit('close')
  } catch (err: any) {
    ui.showToast('error', err.message || 'Lỗi khi gửi báo cáo')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <transition name="modal">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        @click="emit('close')"
      ></div>

      <!-- Modal Content -->
      <div 
        class="relative w-full max-w-lg overflow-hidden rounded-2xl bg-bg-primary shadow-2xl ring-1 ring-white/10 transition-all transform"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-border-default px-6 py-4 bg-bg-secondary/50">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
              <Bug class="h-5 w-5" />
            </div>
            <h3 class="text-lg font-semibold text-text-primary">Báo cáo lỗi / Góp ý</h3>
          </div>
          <button 
            @click="emit('close')"
            class="rounded-full p-2 text-text-secondary hover:bg-bg-tertiary transition-colors"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-5">
          <p class="text-sm text-text-secondary">
            Cảm ơn bạn đã báo cáo! Thông tin lỗi sẽ được gửi trực tiếp đến Admin để xử lý.
          </p>

          <div class="space-y-4">
            <!-- Tiêu đề -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1.5">Tiêu đề lỗi <span class="text-danger">*</span></label>
              <input 
                v-model="title"
                type="text"
                placeholder="VD: Không đồng bộ được SMS Casso"
                class="w-full rounded-xl bg-bg-tertiary/50 border border-border-default/50 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:bg-bg-secondary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                :disabled="loading"
              />
            </div>

            <!-- Mô tả -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1.5">Mô tả chi tiết <span class="text-danger">*</span></label>
              <textarea 
                v-model="description"
                rows="4"
                placeholder="Mô tả các bước để tái hiện lỗi..."
                class="w-full rounded-xl bg-bg-tertiary/50 border border-border-default/50 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:bg-bg-secondary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all resize-none"
                :disabled="loading"
              ></textarea>
            </div>

            <!-- Auto Detected Info (Hidden/Readonly preview) -->
            <div class="rounded-lg bg-bg-secondary p-3 border border-border-default/50">
              <p class="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Thông tin tự động đính kèm</p>
              <div class="space-y-1.5 text-xs text-text-secondary font-mono truncate">
                <p><span class="text-text-tertiary">URL:</span> {{ currentUrl }}</p>
                <p class="truncate"><span class="text-text-tertiary">OS:</span> {{ userAgent }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 border-t border-border-default px-6 py-4 bg-bg-secondary/50">
          <button 
            @click="emit('close')"
            class="btn-secondary"
            :disabled="loading"
          >
            Hủy
          </button>
          <button 
            @click="submitReport"
            class="btn-primary"
            :disabled="loading"
          >
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin mr-2" />
            <Send v-else class="h-4 w-4 mr-2" />
            Gửi báo cáo
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .transform {
  transform: scale(0.95) translateY(10px);
}
.modal-leave-to .transform {
  transform: scale(0.95) translateY(10px);
}
</style>
