<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useNotesStore } from '@/stores/notes'
import { useUiStore } from '@/stores/ui'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { User, Database, Download, LogOut, HardDrive, FileText, Shield } from 'lucide-vue-next'

const auth = useAuthStore()
const notesStore = useNotesStore()
const ui = useUiStore()
const router = useRouter()

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
  a.download = `smart-note-export-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  ui.showToast('success', 'Notes exported successfully')
}
</script>

<template>
  <div class="max-w-[43.75rem]">
    <h1 class="mb-6 text-2xl font-bold tracking-tight md:mb-8">Settings</h1>

    <!-- Profile -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <User :size="18" />
        <h3 class="text-sm font-semibold">Profile</h3>
      </div>
      <div class="bg-bg-surface border-border-default rounded-xl border p-5">
        <div class="flex items-center gap-4">
          <div
            class="bg-accent-subtle text-accent flex h-12 w-12 items-center justify-center rounded-full text-xl font-semibold"
          >
            {{ auth.user?.name?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
          <div>
            <h4 class="mb-0.5 text-base font-semibold">{{ auth.user?.name || 'User' }}</h4>
            <p class="text-text-tertiary text-sm">{{ auth.user?.email || 'No email' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Storage -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <Database :size="18" />
        <h3 class="text-sm font-semibold">Storage</h3>
      </div>
      <div class="bg-bg-surface border-border-default rounded-xl border p-5">
        <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="flex items-center gap-3">
            <HardDrive
              :size="20"
              class="text-accent"
            />
            <div>
              <div class="text-base font-semibold">{{ storageUsed }} KB</div>
              <div class="text-text-tertiary text-[0.6875rem]">Local Storage Used</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <FileText
              :size="20"
              class="text-accent"
            />
            <div>
              <div class="text-base font-semibold">{{ notesStore.totalNotes }}</div>
              <div class="text-text-tertiary text-[0.6875rem]">Total Notes</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Shield
              :size="20"
              class="text-accent"
            />
            <div>
              <div class="text-base font-semibold">10 GB</div>
              <div class="text-text-tertiary text-[0.6875rem]">R2 Free Tier Limit</div>
            </div>
          </div>
        </div>
        <div class="border-border-default border-t pt-4">
          <div class="bg-bg-elevated mb-2 h-1.5 overflow-hidden rounded-full">
            <div
              class="bg-accent h-full min-w-[0.125rem] rounded-full transition-all duration-300"
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
        <h3 class="text-sm font-semibold">Data Management</h3>
      </div>
      <div class="bg-bg-surface border-border-default rounded-xl border p-5">
        <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 class="mb-0.5 text-sm font-semibold">Export Notes</h4>
            <p class="text-text-tertiary text-sm">Download all your notes as a JSON file</p>
          </div>
          <button
            id="export-notes-btn"
            @click="exportNotes"
            class="border-border-default text-text-secondary hover:bg-bg-hover hover:text-text-primary flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150"
          >
            <Download :size="16" />
            Export
          </button>
        </div>
      </div>
    </div>

    <!-- Account -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <Shield :size="18" />
        <h3 class="text-sm font-semibold">Account</h3>
      </div>
      <div class="bg-bg-surface border-border-default rounded-xl border p-5">
        <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 class="mb-0.5 text-sm font-semibold">Sign Out</h4>
            <p class="text-text-tertiary text-sm">Log out of your account</p>
          </div>
          <button
            id="logout-btn"
            @click="auth.logout(); router.push('/login')"
            class="border-error/30 text-error hover:bg-error/10 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150"
          >
            <LogOut :size="16" />
            Sign Out
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="border-border-default mt-8 border-t pt-4 text-center">
      <p class="text-text-disabled mb-1 text-[0.6875rem]">
        SmartNote v1.0.0 · Built with Vue 3 + Cloudflare R2
      </p>
      <p class="text-text-disabled text-[0.6875rem]">
        Data stored locally. Deploy Worker for cloud sync.
      </p>
    </div>
  </div>
</template>
