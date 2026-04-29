<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotesStore } from '@/stores/notes'
import { useI18n } from 'vue-i18n'
import { Database, HardDrive, FileText, Shield, Download } from 'lucide-vue-next'

const { t } = useI18n()
const auth = useAuthStore()
const notesStore = useNotesStore()

const storageUsed = computed(() => {
  let t = 0
  for (const k in localStorage) {
    if (k.startsWith('sn_')) t += localStorage.getItem(k)?.length || 0
  }
  return (t / 1024).toFixed(1)
})

function exportNotes() {
  const blob = new Blob(
    [
      JSON.stringify(
        { exportDate: new Date().toISOString(), user: auth.user, notes: notesStore.notes },
        null,
        2
      )
    ],
    { type: 'application/json' }
  )
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `finnote_export_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>

<template>
  <div>
    <!-- Storage -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <Database :size="18" />
        <h3 class="text-sm font-semibold">{{ t('settings.storage') }}</h3>
      </div>
      <div class="card-premium p-5">
        <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="flex items-center gap-3">
            <HardDrive :size="20" class="text-accent" />
            <div>
              <div class="text-base font-semibold">{{ storageUsed }} KB</div>
              <div class="text-text-tertiary text-[0.6875rem]">
                {{ t('settings.localStorageUsed') }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <FileText :size="20" class="text-accent" />
            <div>
              <div class="text-base font-semibold">{{ notesStore.totalNotes }}</div>
              <div class="text-text-tertiary text-[0.6875rem]">{{ t('settings.totalNotes') }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Shield :size="20" class="text-accent" />
            <div>
              <div class="text-base font-semibold">10 GB</div>
              <div class="text-text-tertiary text-[0.6875rem]">{{ t('settings.r2Limit') }}</div>
            </div>
          </div>
        </div>
        <div class="border-border-default border-t pt-4">
          <div class="bg-bg-elevated mb-2 h-1.5 overflow-hidden rounded-full">
            <div
              class="bg-accent h-full min-w-0.5 rounded-full transition-all duration-300"
              :style="{ width: Math.min((parseFloat(storageUsed) / 10240) * 100, 100) + '%' }"
            ></div>
          </div>
          <span class="text-text-tertiary text-[0.6875rem]">{{ storageUsed }} KB / 10 GB</span>
        </div>
      </div>
    </div>

    <!-- Export -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <Download :size="18" />
        <h3 class="text-sm font-semibold">{{ t('settings.dataManagement') }}</h3>
      </div>
      <div class="card-premium p-5">
        <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 class="mb-0.5 text-sm font-semibold">{{ t('settings.exportNotes') }}</h4>
            <p class="text-text-tertiary text-sm">{{ t('settings.exportDesc') }}</p>
          </div>
          <button
            id="export-notes-btn"
            @click="exportNotes"
            class="btn-secondary shrink-0"
          >
            <Download :size="16" />
            {{ t('settings.exportData') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
