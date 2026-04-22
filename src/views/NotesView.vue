<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotesStore } from '@/stores/notes'
import { useUiStore } from '@/stores/ui'
import { useI18n } from 'vue-i18n'
import { Search, Plus, LayoutGrid, List, Pin, Trash2, Clock, FileText } from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()
const notesStore = useNotesStore()
const ui = useUiStore()

onMounted(() => notesStore.fetchNotes())

function formatDate(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return t('time.mAgo', { n: m })
  const h = Math.floor(m / 60)
  if (h < 24) return t('time.hAgo', { n: h })
  const days = Math.floor(h / 24)
  return days < 7
    ? t('time.dAgo', { n: days })
    : new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const isCreating = ref(false)

async function createNote() {
  if (isCreating.value) return
  isCreating.value = true
  try {
    const note = await notesStore.createNote({
      title: 'Untitled Note',
      content: '',
      tags: [],
      pinned: false
    })
    if (note) router.push(`/notes/${note.id}`)
  } finally {
    isCreating.value = false
  }
}

async function handleDelete(id: string) {
  const confirmed = await ui.requestConfirm({
    title: 'Xóa ghi chú',
    message: 'Ghi chú này sẽ bị xóa khỏi hệ thống.\nHành động này không thể hoàn tác.',
    danger: true,
    confirmText: 'Chắc chắn xóa'
  })

  if (confirmed) {
    if (await notesStore.deleteNote(id)) {
      ui.showToast('success', t('notes.noteDeleted'))
    }
  }
}

async function handleTogglePin(id: string, e: Event) {
  e.preventDefault()
  e.stopPropagation()
  await notesStore.togglePin(id)
}
</script>

<template>
  <div class="max-w-[75rem]">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-baseline gap-3">
        <h1 class="text-2xl font-bold tracking-tight">{{ t('notes.title') }}</h1>
        <span class="text-text-tertiary text-sm">{{ t('notes.count', { n: notesStore.filteredNotes.length }) }}</span>
      </div>
      <button
        id="notes-new-btn"
        @click="createNote"
        class="btn-primary"
        :disabled="isCreating"
      >
        <Plus :size="16" />
        {{ t('notes.newNote') }}
      </button>
    </div>

    <!-- Toolbar -->
    <div class="mb-6 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-4">
      <div class="relative flex-1">
        <Search
          :size="16"
          class="text-text-tertiary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          id="notes-search-input"
          v-model="notesStore.searchQuery"
          type="text"
          :placeholder="t('notes.searchPlaceholder')"
          class="border-border-default bg-bg-surface text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border py-2.5 pr-3 pl-[2.375rem] text-sm transition-all duration-150 focus:ring-2 focus:outline-none"
        />
      </div>
      <div class="flex items-center gap-3">
        <!-- Filters -->
        <div class="border-border-default flex overflow-hidden rounded-lg border">
          <button
            v-for="f in [
              { key: 'all', labelKey: 'notes.filterAll' },
              { key: 'pinned', labelKey: 'notes.filterPinned', icon: Pin },
              { key: 'recent', labelKey: 'notes.filterRecent', icon: Clock }
            ]"
            :key="f.key"
            class="text-text-secondary bg-bg-surface border-border-default hover:bg-bg-hover flex items-center gap-1 border-r px-3.5 py-2 text-sm transition-all duration-150 last:border-r-0"
            :class="notesStore.filter === f.key ? 'bg-accent-subtle text-accent' : ''"
            @click="notesStore.filter = f.key as any"
          >
            <component
              v-if="f.icon"
              :is="f.icon"
              :size="12"
            />
            {{ t(f.labelKey) }}
          </button>
        </div>
        <!-- View toggle -->
        <div class="border-border-default flex overflow-hidden rounded-lg border">
          <button
            id="view-grid-btn"
            @click="notesStore.viewMode = 'grid'"
            class="bg-bg-surface border-border-default text-text-tertiary border-r p-2 transition-all duration-150"
            :class="notesStore.viewMode === 'grid' ? 'text-accent bg-accent-subtle' : ''"
          >
            <LayoutGrid :size="16" />
          </button>
          <button
            id="view-list-btn"
            @click="notesStore.viewMode = 'list'"
            class="bg-bg-surface text-text-tertiary p-2 transition-all duration-150"
            :class="notesStore.viewMode === 'list' ? 'text-accent bg-accent-subtle' : ''"
          >
            <List :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="notesStore.loading"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      :class="notesStore.viewMode === 'list' ? '!grid-cols-1' : ''"
    >
      <div
        v-for="i in 6"
        :key="i"
        class="bg-bg-surface border-border-default rounded-xl border p-5"
      >
        <div class="skeleton mb-3 h-5 w-3/5"></div>
        <div class="skeleton mb-2 h-3.5 w-full"></div>
        <div class="skeleton h-3.5 w-4/5"></div>
      </div>
    </div>

    <!-- Notes -->
    <div
      v-else-if="notesStore.filteredNotes.length"
      class="gap-4"
      :class="
        notesStore.viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'flex flex-col'
      "
    >
      <div
        v-for="note in notesStore.filteredNotes"
        :key="note.id"
        class="relative"
        :id="`note-item-${note.id}`"
      >
        <router-link
          :to="`/notes/${note.id}`"
          class="bg-bg-surface border-border-default hover:border-border-strong hover:bg-bg-elevated hover:shadow-card group flex flex-col rounded-xl border p-5 no-underline transition-all duration-150 hover:-translate-y-px"
          :class="
            notesStore.viewMode === 'list'
              ? 'md:flex-row md:items-center gap-3 md:gap-4 !py-3 md:!py-4'
              : 'min-h-[9.375rem]'
          "
        >
          <div
            class="mb-2 flex items-start justify-between gap-2"
            :class="notesStore.viewMode === 'list' ? 'mb-0 md:min-w-[12.5rem]' : ''"
          >
            <h3 class="text-text-primary text-sm font-semibold">{{ note.title }}</h3>
            <div
              class="flex gap-0.5 opacity-100 md:opacity-0 transition-opacity duration-150 md:group-hover:opacity-100"
              @click.prevent
            >
              <button
                class="text-text-tertiary hover:bg-bg-hover hover:text-text-primary rounded p-2 md:p-1 transition-all duration-150 touch-target"
                :class="note.pinned ? 'text-warning' : ''"
                @click="handleTogglePin(note.id, $event)"
              >
                <Pin :size="16" />
              </button>
              <button
                class="text-text-tertiary hover:bg-bg-hover hover:text-error rounded p-2 md:p-1 transition-all duration-150 touch-target"
                @click.prevent.stop="handleDelete(note.id)"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
          <p
            class="text-text-tertiary line-clamp-2 flex-1 text-sm leading-relaxed"
            :class="notesStore.viewMode === 'list' ? 'line-clamp-1' : ''"
          >
            {{ note.excerpt || t('notes.noContent') }}
          </p>
          <div
            class="border-border-subtle mt-3 flex items-center justify-between border-t pt-3"
            :class="
              notesStore.viewMode === 'list'
                ? 'mt-0 md:min-w-[11.25rem] justify-between md:justify-end border-t-0 pt-0'
                : ''
            "
          >
            <div class="flex gap-1">
              <span
                v-for="tag in note.tags.slice(0, 3)"
                :key="tag"
                class="bg-accent-subtle text-accent rounded-full px-2 py-0.5 text-[0.6875rem] font-medium"
              >
                {{ tag }}
              </span>
            </div>
            <span class="text-text-disabled text-[0.6875rem]">
              {{ formatDate(note.updatedAt) }}
            </span>
          </div>
        </router-link>

      </div>
    </div>

    <!-- Empty -->
    <div
      v-else
      class="flex flex-col items-center py-12 text-center"
    >
      <FileText
        :size="48"
        class="text-text-disabled mb-4"
      />
      <h3 class="mb-2 text-lg font-semibold">
        {{ notesStore.searchQuery ? t('notes.noResults') : t('notes.noNotes') }}
      </h3>
      <p class="text-text-tertiary mb-6 text-sm">
        {{
          notesStore.searchQuery
            ? t('notes.tryDifferent')
            : t('notes.createFirst')
        }}
      </p>
      <button
        v-if="!notesStore.searchQuery"
        @click="createNote"
        class="btn-secondary"
        :disabled="isCreating"
      >
        <Plus :size="16" />
        {{ t('notes.createNote') }}
      </button>
    </div>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
