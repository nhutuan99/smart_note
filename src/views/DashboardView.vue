<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotesStore } from '@/stores/notes'
import { FileText, Pin, Tag, Clock, Plus, ArrowRight, Sparkles } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()
const notesStore = useNotesStore()

onMounted(() => notesStore.fetchNotes())

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})

const stats = computed(() => [
  {
    label: 'Total Notes',
    value: notesStore.totalNotes,
    icon: FileText,
    color: 'text-info',
    bg: 'bg-info/10',
    sub: '+3 this week'
  },
  {
    label: 'Pinned',
    value: notesStore.pinnedCount,
    icon: Pin,
    color: 'text-warning',
    bg: 'bg-warning/10',
    sub: 'Important'
  },
  {
    label: 'Tags Used',
    value: notesStore.allTags.length,
    icon: Tag,
    color: 'text-success',
    bg: 'bg-success/10',
    sub: 'Categories'
  },
  {
    label: 'Last 7 Days',
    value: notesStore.notes.filter(
      (n) => new Date(n.updatedAt) >= new Date(Date.now() - 7 * 86400000)
    ).length,
    icon: Clock,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    sub: 'Recent activity'
  }
])

const recentNotes = computed(() =>
  [...notesStore.notes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)
)

function formatDate(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  return days < 7 ? `${days}d ago` : new Date(d).toLocaleDateString()
}

async function createNote() {
  const note = await notesStore.createNote({
    title: 'Untitled Note',
    content: '',
    tags: [],
    pinned: false
  })
  if (note) router.push(`/notes/${note.id}`)
}
</script>

<template>
  <div class="max-w-[75rem]">
    <!-- Hero -->
    <div
      class="bg-bg-surface border-border-default relative mb-6 flex flex-col gap-4 overflow-hidden rounded-2xl border p-5 md:mb-8 md:flex-row md:items-start md:justify-between md:p-8"
    >
      <div
        class="pointer-events-none absolute top-0 right-0 h-[18.75rem] w-[18.75rem] translate-x-[30%] -translate-y-[30%] rounded-full bg-[radial-gradient(circle,var(--color-accent-glow)_0%,transparent_70%)]"
      ></div>
      <div class="relative z-10">
        <div class="mb-2 flex items-center gap-2">
          <Sparkles
            :size="20"
            class="text-accent"
          />
          <span class="text-accent text-sm font-medium">{{ greeting }}</span>
        </div>
        <h1 class="mb-1 text-2xl font-bold tracking-tight md:text-[1.875rem]">
          {{ auth.user?.name || 'User' }}
        </h1>
        <p class="text-text-tertiary text-sm">Here's what's happening with your notes today</p>
      </div>
      <button
        id="dashboard-new-note-btn"
        @click="createNote"
        class="btn-primary relative z-10 self-start whitespace-nowrap"
      >
        <Plus :size="18" />
        New Note
      </button>
    </div>

    <!-- Stats -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mb-8 lg:grid-cols-4">
      <div
        v-for="s in stats"
        :key="s.label"
        class="bg-bg-surface border-border-default hover:border-border-strong rounded-xl border p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="mb-3 flex items-center justify-between">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg"
            :class="s.bg"
          >
            <component
              :is="s.icon"
              :size="18"
              :class="s.color"
            />
          </div>
          <span class="text-text-tertiary text-[0.6875rem]">{{ s.sub }}</span>
        </div>
        <div class="mb-1 text-[1.875rem] leading-none font-bold">{{ s.value }}</div>
        <div class="text-text-secondary text-sm">{{ s.label }}</div>
      </div>
    </div>

    <!-- Recent Notes -->
    <div class="mb-6 md:mb-8">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold">Recent Notes</h3>
        <router-link
          to="/notes"
          class="text-accent hover:text-accent-text flex items-center gap-1 text-sm transition-colors duration-150"
        >
          View all
          <ArrowRight :size="14" />
        </router-link>
      </div>

      <div
        v-if="recentNotes.length"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <router-link
          v-for="note in recentNotes"
          :key="note.id"
          :to="`/notes/${note.id}`"
          class="bg-bg-surface border-border-default hover:border-border-strong hover:bg-bg-elevated flex min-h-[10rem] flex-col rounded-xl border p-5 no-underline transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="mb-2 flex items-start justify-between gap-2">
            <h4 class="text-text-primary text-sm leading-snug font-semibold">{{ note.title }}</h4>
            <Pin
              v-if="note.pinned"
              :size="14"
              class="text-warning mt-0.5 shrink-0"
            />
          </div>
          <p class="text-text-tertiary line-clamp-3 flex-1 text-sm leading-relaxed">
            {{ note.excerpt || 'No content yet...' }}
          </p>
          <div class="border-border-subtle mt-3 flex items-center justify-between border-t pt-3">
            <div class="flex gap-1">
              <span
                v-for="tag in note.tags.slice(0, 2)"
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

      <!-- Empty -->
      <div
        v-else
        class="bg-bg-surface border-border-default flex flex-col items-center rounded-2xl border border-dashed py-12 text-center md:py-16"
      >
        <FileText
          :size="48"
          class="text-text-disabled mb-4"
        />
        <h4 class="mb-2 text-lg font-semibold">No notes yet</h4>
        <p class="text-text-tertiary mb-6 text-sm">Create your first note to get started</p>
        <button
          @click="createNote"
          class="btn-secondary"
        >
          <Plus :size="16" />
          Create Note
        </button>
      </div>
    </div>

    <!-- Tags -->
    <div
      v-if="notesStore.allTags.length"
      class="mb-8"
    >
      <h3 class="mb-4 text-lg font-semibold">Popular Tags</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in notesStore.allTags.slice(0, 12)"
          :key="tag"
          class="border-border-default bg-bg-surface text-text-secondary hover:border-accent hover:text-accent hover:bg-accent-subtle flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm transition-all duration-150"
          @click="notesStore.searchQuery = tag; router.push('/notes')"
        >
          <Tag :size="12" />
          {{ tag }}
        </button>
      </div>
    </div>
  </div>
</template>
