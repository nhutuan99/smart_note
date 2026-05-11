<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { httpClient } from '@/shared/api/httpClient'
import type { Note } from '@/types'
import RichEditor from '@/components/editor/RichEditor.vue'
import LogoLoader from '@/components/ui/LogoLoader.vue'
import { ArrowLeft, Lock } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const noteId = route.params.id as string
const note = ref<Note | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const data = await httpClient.get<Note>(`/api/notes/shared/${noteId}`)
    if (data) {
      note.value = data
    } else {
      error.value = 'Không tìm thấy ghi chú hoặc bạn không có quyền truy cập.'
    }
  } catch (err: any) {
    if (err.message?.includes('401')) {
      error.value = 'Bạn cần đăng nhập để xem ghi chú này.'
    } else if (err.message?.includes('403')) {
      error.value = 'Bạn không có quyền truy cập ghi chú này.'
    } else {
      error.value = 'Không tìm thấy ghi chú.'
    }
  } finally {
    loading.value = false
  }
})

function goToDashboard() {
  router.push('/')
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="mb-4 flex items-center gap-3">
      <button
        class="text-text-tertiary hover:bg-bg-hover hover:text-text-primary rounded-lg p-2 transition-colors"
        @click="goToDashboard"
      >
        <ArrowLeft :size="20" />
      </button>
      <h1 v-if="!loading && note" class="text-text-primary truncate text-xl font-bold">
        {{ note.title || 'Untitled Note' }}
      </h1>
      <span v-if="note?.isPublic" class="bg-accent-subtle text-accent rounded-md px-2 py-0.5 text-xs font-semibold">Công khai</span>
      <span v-else-if="note" class="bg-bg-elevated border-border-default text-text-secondary flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold">
        <Lock :size="12" /> Giới hạn
      </span>
    </div>

    <div v-if="loading" class="flex flex-1 items-center justify-center">
      <LogoLoader :size="40" />
    </div>

    <div v-else-if="error" class="flex flex-1 flex-col items-center justify-center text-center">
      <Lock :size="48" class="text-text-tertiary mb-4" />
      <h2 class="text-text-primary mb-2 text-xl font-bold">Không thể truy cập</h2>
      <p class="text-text-secondary mb-6 text-sm">{{ error }}</p>
      <button class="btn-primary" @click="goToDashboard">Về trang chủ</button>
    </div>

    <div v-else-if="note" class="bg-bg-surface border-border-default flex flex-1 flex-col overflow-hidden rounded-xl border">
      <div class="border-border-default flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <div class="flex flex-1 flex-wrap gap-2">
          <span
            v-for="tag in note.tags"
            :key="tag"
            class="bg-accent-subtle text-accent rounded-md px-2.5 py-1 text-xs font-medium"
          >
            {{ tag }}
          </span>
          <span v-if="note.tags.length === 0" class="text-text-tertiary text-xs italic">Không có thẻ</span>
        </div>
        <span class="text-text-tertiary text-xs">
          Cập nhật: {{ new Date(note.updatedAt).toLocaleString() }}
        </span>
      </div>

      <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div class="mx-auto max-w-4xl">
          <RichEditor v-model="note.content" :readonly="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Force readonly editor styles if needed */
:deep(.is-readonly .ProseMirror) {
  outline: none;
  min-height: auto;
}
</style>
