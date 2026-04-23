<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Bug, X, Send, Loader2, ImagePlus, Trash2 } from 'lucide-vue-next'
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
const imagePreview = ref<string | null>(null)
const imageBase64 = ref<string | null>(null)
const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Reset the URL/UA each time the modal opens
watch(() => props.show, (v) => {
  if (v) {
    currentUrl.value = window.location.href
    userAgent.value = navigator.userAgent
  }
})

const userAgent = ref(navigator.userAgent)
const currentUrl = ref(window.location.href)

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) processFile(input.files[0])
}

function handleDrop(e: DragEvent) {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) processFile(file)
}

function processFile(file: File) {
  if (file.size > 2 * 1024 * 1024) {
    ui.showToast('error', 'Ảnh quá lớn. Tối đa 2 MB.')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result as string
    imagePreview.value = result
    imageBase64.value = result // data:image/...;base64,...
  }
  reader.readAsDataURL(file)
}

function removeImage() {
  imagePreview.value = null
  imageBase64.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const canSubmit = computed(() => title.value.trim() && description.value.trim() && !loading.value)

async function submitReport() {
  if (!canSubmit.value) {
    ui.showToast('error', 'Vui lòng nhập đầy đủ Tiêu đề và Mô tả lỗi')
    return
  }

  loading.value = true
  try {
    const payload: Record<string, any> = {
      title: title.value,
      description: description.value,
      url: currentUrl.value,
      userAgent: userAgent.value,
    }
    if (imageBase64.value) {
      payload.image = imageBase64.value
    }

    const res = await httpClient.post<{ message: string }>('/api/report-bug', payload)

    ui.showToast('success', res?.message || 'Đã gửi báo cáo lỗi thành công!')
    title.value = ''
    description.value = ''
    removeImage()
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
        class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-bg-primary shadow-2xl ring-1 ring-white/10 transition-all transform"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-border-default px-6 py-4 bg-bg-secondary/50 sticky top-0 z-10">
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

            <!-- Image Upload -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1.5">Ảnh đính kèm (tùy chọn)</label>
              
              <!-- Preview -->
              <div v-if="imagePreview" class="relative group rounded-xl overflow-hidden border border-border-default/50 mb-2">
                <img :src="imagePreview" alt="Preview" class="w-full max-h-48 object-contain bg-bg-tertiary/30" />
                <button 
                  @click="removeImage"
                  class="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-danger/80 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                  title="Xóa ảnh"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>

              <!-- Drop zone / Upload button -->
              <div
                v-if="!imagePreview"
                class="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition-all cursor-pointer"
                :class="isDragOver ? 'border-accent bg-accent/5' : 'border-border-default/50 hover:border-accent/50 hover:bg-bg-tertiary/30'"
                @dragover.prevent="isDragOver = true"
                @dragleave="isDragOver = false"
                @drop.prevent="handleDrop"
                @click="fileInputRef?.click()"
              >
                <ImagePlus class="h-8 w-8 text-text-tertiary mb-2" />
                <p class="text-sm text-text-secondary">Kéo thả ảnh vào đây hoặc <span class="text-accent font-medium">chọn file</span></p>
                <p class="text-xs text-text-tertiary mt-1">PNG, JPG, GIF — tối đa 2 MB</p>
                <input 
                  ref="fileInputRef"
                  type="file"
                  accept="image/*"
                  class="sr-only"
                  @change="handleFileSelect"
                />
              </div>
            </div>

            <!-- Auto Detected Info -->
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
        <div class="flex items-center justify-end gap-3 border-t border-border-default px-6 py-4 bg-bg-secondary/50 sticky bottom-0">
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
            :disabled="!canSubmit"
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
