<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { useUiStore } from '@/stores/ui'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import {
  Trash2,
  Plus,
  Sparkles,
  CheckCircle2,
  FileText,
  Eye,
  ArrowLeft,
  X,
  Hash,
  Loader2,
  ImageUp,
  Pencil,
  ExternalLink,
  Timer,
  Brain,
  Search,
  Image as ImageIcon
} from 'lucide-vue-next'
import type { Blog } from '@/types'

const { t } = useI18n()
const router = useRouter()
const blogStore = useBlogStore()
const uiStore = useUiStore()

// ── Modal State ──
const isModalOpen = ref(false)
const isGenerating = ref(false)
const activeTab = ref<'paste' | 'ai'>('ai')
const editingSlug = ref<string | null>(null)

// ── Generation Progress ──
type GenStep = 'idle' | 'analyzing' | 'drafting' | 'refining' | 'images' | 'done'
const genStep = ref<GenStep>('idle')
const genElapsed = ref(0)
const genStepStart = ref(0)
let genTimer: ReturnType<typeof setInterval> | null = null

const GEN_STEPS_CONFIG = [
  { key: 'analyzing' as GenStep, icon: Search, label: 'Phân tích chủ đề & keyword...' },
  { key: 'drafting' as GenStep, icon: Brain, label: 'AI đang sáng tạo nội dung bài viết...' },
  { key: 'refining' as GenStep, icon: Sparkles, label: 'Review & tinh chỉnh chuẩn SEO...' },
  { key: 'images' as GenStep, icon: ImageIcon, label: 'Tạo hình ảnh minh họa...' }
]

function startGenTimer() {
  genElapsed.value = 0
  genStepStart.value = 0
  genTimer = setInterval(() => { genElapsed.value++ }, 1000)
}

function stopGenTimer() {
  if (genTimer) { clearInterval(genTimer); genTimer = null }
}

function setStep(step: GenStep) {
  genStep.value = step
  genStepStart.value = genElapsed.value
}

function stepStatus(stepKey: GenStep): 'done' | 'active' | 'pending' {
  const order: GenStep[] = ['analyzing', 'drafting', 'refining', 'images']
  const currentIdx = order.indexOf(genStep.value)
  const stepIdx = order.indexOf(stepKey)
  if (genStep.value === 'done') return 'done'
  if (stepIdx < currentIdx) return 'done'
  if (stepIdx === currentIdx) return 'active'
  return 'pending'
}

function formatTimer(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
}

onUnmounted(() => stopGenTimer())

// ── Input State ──
const inputContent = ref('')
const aiImageBase64 = ref('')

// ── Generated Preview State ──
const hasPreview = ref(false)
const previewHtml = ref('')
const form = ref<Partial<Blog>>({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  tags: [],
  imageUrl: '',
  published: true
})

onMounted(() => {
  blogStore.fetchBlogs()
})

// ── Computed ──
const canGenerate = computed(() => {
  if (activeTab.value === 'paste') return inputContent.value.trim().length > 30
  return inputContent.value.trim().length > 0 || !!aiImageBase64.value
})

const canPublish = computed(() => {
  return hasPreview.value && !!form.value.title && !!form.value.content
})

// ── Actions ──
function openModal() {
  editingSlug.value = null
  form.value = { title: '', slug: '', excerpt: '', content: '', tags: [], imageUrl: '', published: true }
  inputContent.value = ''
  aiImageBase64.value = ''
  hasPreview.value = false
  previewHtml.value = ''
  activeTab.value = 'ai'
  isModalOpen.value = true
}

async function openEditModal(blog: Blog) {
  editingSlug.value = blog.slug
  form.value = {
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    tags: [...(blog.tags || [])],
    imageUrl: blog.imageUrl || '',
    published: blog.published
  }
  inputContent.value = blog.content
  previewHtml.value = await marked(blog.content || '', { async: true })
  hasPreview.value = true
  activeTab.value = 'paste'
  isModalOpen.value = true
}

function switchTab(tab: 'paste' | 'ai') {
  activeTab.value = tab
  // Only reset state when NOT editing an existing blog
  if (!editingSlug.value) {
    inputContent.value = ''
    aiImageBase64.value = ''
    hasPreview.value = false
    previewHtml.value = ''
    form.value = { title: '', slug: '', excerpt: '', content: '', tags: [], imageUrl: '', published: true }
  }
}

// ── Edit content mode toggle ──
const isEditingContent = ref(false)
const editMarkdown = ref('')

async function toggleContentEdit() {
  if (isEditingContent.value) {
    // Save: update form.content + re-render preview
    form.value.content = editMarkdown.value
    previewHtml.value = await marked(editMarkdown.value || '', { async: true })
    isEditingContent.value = false
  } else {
    // Enter edit mode
    editMarkdown.value = form.value.content || ''
    isEditingContent.value = true
  }
}

function handlePaste(e: ClipboardEvent) {
  if (activeTab.value !== 'ai') return
  const items = e.clipboardData?.items
  if (!items) return
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const blob = items[i].getAsFile()
      if (blob) {
        const reader = new FileReader()
        reader.onload = (event) => {
          aiImageBase64.value = event.target?.result as string
        }
        reader.readAsDataURL(blob)
      }
    }
  }
}

function removeUploadedImage() {
  aiImageBase64.value = ''
}

async function handleGenerate() {
  if (!canGenerate.value) return
  isGenerating.value = true
  startGenTimer()

  try {
    if (activeTab.value === 'paste') {
      // Mode Paste: Send markdown to AI to extract metadata
      setStep('analyzing')
      const data = await blogStore.generateContent(
        `Phân tích bài viết markdown sau và trả về JSON. Nội dung:\n\n${inputContent.value}`,
        ''
      )
      if (data) {
        form.value.title = data.title || ''
        form.value.excerpt = data.excerpt || ''
        form.value.content = inputContent.value
        form.value.tags = data.tags || []

        setStep('images')
        try {
          const imagePrompt = data.seoKeywords || data.title || ''
          if (imagePrompt) {
            const imageUrl = await blogStore.generateImage(imagePrompt)
            if (imageUrl) form.value.imageUrl = imageUrl
          }
        } catch { /* cover image is optional */ }

        previewHtml.value = await marked(form.value.content || '', { async: true })
        setStep('done')
        hasPreview.value = true
      }
    } else {
      // Mode AI: Full multi-step generation
      // STEP 1: Analyze & Draft
      setStep('analyzing')
      await new Promise(r => setTimeout(r, 800)) // Brief pause for UX

      setStep('drafting')
      const draftData = await blogStore.generateContent(inputContent.value, aiImageBase64.value)

      if (draftData) {
        // STEP 2: Refine / Editor Review
        setStep('refining')
        const data = await blogStore.refineContent(draftData) || draftData

        form.value.title = data.title || ''
        form.value.excerpt = data.excerpt || ''
        form.value.content = data.content || ''
        form.value.tags = data.tags || []

        // STEP 3: Generate images
        setStep('images')
        try {
          const imagePrompt = data.seoKeywords || inputContent.value
          const imageUrl = await blogStore.generateImage(imagePrompt)
          if (imageUrl) form.value.imageUrl = imageUrl
        } catch { /* cover image is optional */ }

        previewHtml.value = await marked(form.value.content || '', { async: true })
        setStep('done')
        hasPreview.value = true
        uiStore.showToast('success', `Bài viết hoàn tất trong ${formatTimer(genElapsed.value)}!`)
      }
    }
  } catch (err: any) {
    uiStore.showToast('error', err.message || t('blog.generateFailed'))
  } finally {
    stopGenTimer()
    isGenerating.value = false
    // Keep genStep for UI display until modal closes or new gen starts
  }
}

async function handleSave() {
  if (!canPublish.value) {
    uiStore.showToast('error', t('blog.missingContent'))
    return
  }

  try {
    isGenerating.value = true
    if (editingSlug.value) {
      // Edit mode
      const updated = await blogStore.updateBlog(editingSlug.value, form.value)
      if (updated) {
        uiStore.showToast('success', 'Đã cập nhật bài viết!')
        isModalOpen.value = false
      } else {
        uiStore.showToast('error', 'Cập nhật thất bại')
      }
    } else {
      // Create mode
      const newBlog = await blogStore.createBlog(form.value)
      if (newBlog) {
        uiStore.showToast('success', t('blog.published'))
        isModalOpen.value = false
        router.push(`/blog/${newBlog.slug}`)
      } else {
        uiStore.showToast('error', t('blog.publishFailed'))
      }
    }
  } catch (err: any) {
    uiStore.showToast('error', t('blog.publishFailed') + ': ' + err.message)
  } finally {
    isGenerating.value = false
  }
}

async function handleDelete(slug: string) {
  const confirmed = await uiStore.requestConfirm({
    title: t('common.confirm'),
    message: t('blog.deleteConfirm'),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    danger: true
  })
  if (!confirmed) return
  
  try {
    await blogStore.deleteBlog(slug)
    uiStore.showToast('success', t('blog.deleted'))
  } catch (err: any) {
    uiStore.showToast('error', err.message)
  }
}

async function handleCoverUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    uiStore.showToast('error', 'Image too large (max 5MB)')
    return
  }
  const reader = new FileReader()
  reader.onload = async (ev) => {
    const base64 = ev.target?.result as string
    if (!base64) return
    try {
      uiStore.showToast('info', 'Đang tải ảnh bìa...')
      const imageUrl = await blogStore.uploadImage(base64)
      if (imageUrl) {
        form.value.imageUrl = imageUrl
        uiStore.showToast('success', 'Đã tải ảnh bìa!')
      }
    } catch (err: any) {
      uiStore.showToast('error', err.message || 'Upload failed')
    }
  }
  reader.readAsDataURL(file)
}

const formatDate = (dateStr: string) => {
  const locale = useI18n().locale.value === 'vi' ? 'vi-VN' : 'en-US'
  return new Date(dateStr).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="admin-blog max-w-[64rem] mx-auto pb-12">
    <!-- Header -->
    <div class="admin-blog__header">
      <div class="min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight mb-1">{{ t('blog.manageTitle') }}</h1>
        <p class="text-text-tertiary text-sm">{{ t('blog.manageDesc') }}</p>
      </div>
      <button id="btn-new-blog" class="btn-primary blog-btn blog-btn--new" @click="openModal">
        <Plus :size="16" />
        <span>{{ t('blog.newPost') }}</span>
      </button>
    </div>

    <!-- Blog List — Desktop Table -->
    <div class="card-premium overflow-hidden hidden md:block">
      <table class="w-full text-left text-sm">
        <thead class="bg-bg-elevated text-text-tertiary whitespace-nowrap">
          <tr>
            <th class="px-6 py-4 font-medium">{{ t('blog.tableTitle') }}</th>
            <th class="px-6 py-4 font-medium">{{ t('blog.tableStatus') }}</th>
            <th class="px-6 py-4 font-medium">{{ t('blog.tableDate') }}</th>
            <th class="px-6 py-4 font-medium text-right">{{ t('blog.tableActions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-subtle">
          <tr v-if="blogStore.isLoading && !blogStore.blogs.length">
            <td colspan="4" class="px-6 py-8 text-center text-text-disabled">{{ t('common.loading') }}</td>
          </tr>
          <tr v-else-if="!blogStore.blogs.length">
            <td colspan="4" class="px-6 py-8 text-center text-text-disabled">{{ t('blog.empty') }}</td>
          </tr>
          <tr v-for="blog in blogStore.blogs" :key="blog.id" class="hover:bg-bg-hover/50 transition-colors cursor-pointer" @click="openEditModal(blog)">
            <td class="px-6 py-4 font-medium">
              <div class="line-clamp-1">{{ blog.title }}</div>
              <div class="text-[0.6875rem] text-text-disabled mt-1">/blog/{{ blog.slug }}</div>
            </td>
            <td class="px-6 py-4">
              <span v-if="blog.published" class="blog-badge blog-badge--published">
                <CheckCircle2 :size="12" />
                <span>{{ t('blog.statusPublished') }}</span>
              </span>
              <span v-else class="blog-badge blog-badge--draft">
                {{ t('blog.statusDraft') }}
              </span>
            </td>
            <td class="px-6 py-4 text-text-tertiary text-[0.8125rem]">
              {{ formatDate(blog.createdAt) }}
            </td>
            <td class="px-6 py-4 text-right" @click.stop>
              <div class="flex items-center justify-end gap-1">
                <button class="blog-action-btn" title="Chỉnh sửa" @click="openEditModal(blog)"><Pencil :size="15" /></button>
                <a :href="`/blog/${blog.slug}`" target="_blank" class="blog-action-btn" title="Xem bài viết"><ExternalLink :size="15" /></a>
                <button class="blog-action-btn blog-action-btn--danger" @click="handleDelete(blog.slug)"><Trash2 :size="15" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Blog List — Mobile Cards -->
    <div class="md:hidden space-y-3">
      <div v-if="blogStore.isLoading && !blogStore.blogs.length" class="text-center py-8 text-text-disabled card-premium">{{ t('common.loading') }}</div>
      <div v-else-if="!blogStore.blogs.length" class="text-center py-8 text-text-disabled card-premium">{{ t('blog.empty') }}</div>
      <div v-for="blog in blogStore.blogs" :key="blog.id" class="blog-mobile-card" @click="openEditModal(blog)">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="font-medium text-sm line-clamp-2 text-text-primary mb-1">{{ blog.title }}</div>
            <div class="text-[0.6875rem] text-text-disabled">/blog/{{ blog.slug }}</div>
          </div>
          <div class="flex items-center gap-0.5" @click.stop>
            <a :href="`/blog/${blog.slug}`" target="_blank" class="blog-action-btn"><ExternalLink :size="15" /></a>
            <button class="blog-action-btn blog-action-btn--danger" @click="handleDelete(blog.slug)"><Trash2 :size="15" /></button>
          </div>
        </div>
        <div class="flex items-center gap-2 mt-3">
          <span v-if="blog.published" class="blog-badge blog-badge--published"><CheckCircle2 :size="12" /><span>{{ t('blog.statusPublished') }}</span></span>
          <span v-else class="blog-badge blog-badge--draft">{{ t('blog.statusDraft') }}</span>
          <span class="text-text-disabled text-[0.75rem] ml-auto">{{ formatDate(blog.createdAt) }}</span>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════ -->
    <!-- CREATE MODAL — Simplified 2-Mode UI   -->
    <!-- ══════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="isModalOpen" class="blog-modal-overlay" @click.self="isModalOpen = false">
          <div class="blog-modal" @click.stop>
            <!-- Modal Header -->
            <div class="blog-modal__header">
              <h2 class="text-lg font-bold flex items-center gap-2">
                <Sparkles :size="18" class="text-accent" />
                {{ editingSlug ? 'Chỉnh sửa bài viết' : t('blog.modalTitle') }}
              </h2>
              <button class="blog-modal__close" @click="isModalOpen = false">
                <X :size="18" />
              </button>
            </div>

            <!-- Tab Switcher -->
            <div class="blog-tabs">
              <button
                class="blog-tab"
                :class="{ 'blog-tab--active': activeTab === 'ai' }"
                @click="switchTab('ai')"
              >
                <Sparkles :size="14" />
                <span>{{ t('blog.tabAiGenerate') }}</span>
              </button>
              <button
                class="blog-tab"
                :class="{ 'blog-tab--active': activeTab === 'paste' }"
                @click="switchTab('paste')"
              >
                <FileText :size="14" />
                <span>{{ t('blog.tabPasteMarkdown') }}</span>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="blog-modal__body custom-scrollbar">
              <!-- Input Area (both modes share this) -->
              <div v-if="!hasPreview && !isGenerating" class="blog-input-area">
                <!-- Mode description -->
                <p class="text-[0.8125rem] text-text-tertiary mb-3">
                  {{ activeTab === 'paste' ? t('blog.pasteHint') : t('blog.aiHint') }}
                </p>

                <div class="relative">
                  <textarea
                    v-model="inputContent"
                    @paste="handlePaste"
                    :rows="activeTab === 'paste' ? 14 : 6"
                    class="blog-textarea"
                    :placeholder="activeTab === 'paste' ? t('blog.pasteMarkdownPlaceholder') : t('blog.aiTopicPlaceholder')"
                    :disabled="isGenerating"
                  ></textarea>

                  <!-- Image Preview Overlay (AI mode only) -->
                  <div v-if="aiImageBase64 && activeTab === 'ai'" class="blog-image-preview group">
                    <img :src="aiImageBase64" class="w-full h-full object-cover" />
                    <button @click="removeUploadedImage" class="blog-image-preview__remove opacity-0 group-hover:opacity-100">
                      <X :size="12" />
                    </button>
                  </div>
                </div>

                <!-- Generate Button -->
                <div class="flex justify-end mt-4">
                  <button
                    class="btn-primary blog-btn blog-btn--generate"
                    @click="handleGenerate"
                    :disabled="isGenerating || !canGenerate"
                  >
                    <Sparkles :size="16" />
                    <span>{{ t('blog.generateBtn') }}</span>
                  </button>
                </div>
              </div>

              <!-- ═══ Generation Progress Panel ═══ -->
              <div v-else-if="isGenerating" class="blog-input-area">
                <div class="flex flex-col items-center py-4 mb-6">
                  <!-- Animated brain icon -->
                  <div class="relative mb-4">
                    <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/15 text-accent">
                      <Brain :size="36" class="animate-pulse" />
                    </div>
                    <div class="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-bg-surface border-2 border-accent/30 text-accent">
                      <Timer :size="14" />
                    </div>
                  </div>
                  <h3 class="text-lg font-bold text-text-primary mb-1">AI đang sáng tạo...</h3>
                  <div class="flex items-center gap-2 text-accent font-mono text-2xl font-bold tracking-wider">
                    <Timer :size="18" />
                    {{ formatTimer(genElapsed) }}
                  </div>
                  <p class="text-[0.6875rem] text-text-disabled mt-2">Chất lượng cần thời gian — AI đang suy nghĩ thật kỹ...</p>
                </div>

                <!-- Step Checklist -->
                <div class="space-y-2">
                  <div
                    v-for="step in GEN_STEPS_CONFIG"
                    :key="step.key"
                    class="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300"
                    :class="{
                      'bg-success/10 border border-success/20': stepStatus(step.key) === 'done',
                      'bg-accent/10 border border-accent/30': stepStatus(step.key) === 'active',
                      'bg-bg-elevated border border-border-default opacity-50': stepStatus(step.key) === 'pending'
                    }"
                  >
                    <!-- Icon -->
                    <div
                      class="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors"
                      :class="{
                        'bg-success/20 text-success': stepStatus(step.key) === 'done',
                        'bg-accent/20 text-accent': stepStatus(step.key) === 'active',
                        'bg-bg-surface text-text-disabled': stepStatus(step.key) === 'pending'
                      }"
                    >
                      <CheckCircle2 v-if="stepStatus(step.key) === 'done'" :size="16" />
                      <Loader2 v-else-if="stepStatus(step.key) === 'active'" :size="16" class="animate-spin" />
                      <component :is="step.icon" v-else :size="16" />
                    </div>
                    <!-- Label -->
                    <span
                      class="text-sm flex-1 font-medium"
                      :class="{
                        'text-success': stepStatus(step.key) === 'done',
                        'text-accent': stepStatus(step.key) === 'active',
                        'text-text-disabled': stepStatus(step.key) === 'pending'
                      }"
                    >
                      {{ step.label }}
                    </span>
                    <!-- Step timer for active/done -->
                    <span
                      v-if="stepStatus(step.key) === 'active'"
                      class="text-[0.6875rem] font-mono text-accent/70"
                    >
                      {{ formatTimer(genElapsed - genStepStart) }}
                    </span>
                    <CheckCircle2 v-if="stepStatus(step.key) === 'done'" :size="12" class="text-success/50" />
                  </div>
                </div>
              </div>

              <!-- Preview Panel (after generation) -->
              <div v-else class="blog-preview">
                <div class="blog-preview__header">
                  <div class="flex items-center gap-2 text-accent">
                    <Eye :size="16" />
                    <span class="text-sm font-semibold">{{ t('blog.previewLabel') }}</span>
                  </div>
                  <button
                    class="blog-btn--back"
                    @click="hasPreview = false; isEditingContent = false"
                  >
                    <ArrowLeft :size="14" />
                    <span>{{ t('blog.editInput') }}</span>
                  </button>
                </div>

                <!-- Cover Image -->
                <div class="blog-preview__cover-wrap">
                  <div v-if="form.imageUrl" class="blog-preview__cover">
                    <img :src="form.imageUrl" :alt="form.title" />
                  </div>
                  <label class="blog-preview__upload-btn">
                    <ImageUp :size="14" />
                    <span>{{ form.imageUrl ? 'Thay ảnh bìa' : 'Tải ảnh bìa' }}</span>
                    <input type="file" accept="image/*" class="hidden" @change="handleCoverUpload" />
                  </label>
                </div>

                <!-- Editable Title -->
                <input
                  v-model="form.title"
                  type="text"
                  class="w-full text-xl md:text-2xl font-bold tracking-tight mb-3 text-text-primary bg-transparent border-b border-transparent hover:border-border-default focus:border-accent focus:outline-none transition-colors py-1"
                  placeholder="Tiêu đề bài viết..."
                />

                <!-- Editable Excerpt -->
                <textarea
                  v-model="form.excerpt"
                  rows="2"
                  class="w-full text-sm text-text-secondary leading-relaxed mb-4 italic border-l-2 border-accent/40 pl-3 bg-transparent resize-none focus:outline-none hover:bg-bg-elevated/50 focus:bg-bg-elevated/50 rounded-r-lg transition-colors py-1"
                  placeholder="Mô tả ngắn..."
                />

                <!-- Editable Tags -->
                <div class="flex flex-wrap items-center gap-1.5 mb-6">
                  <span v-for="(tag, idx) in form.tags" :key="idx" class="blog-tag group relative">
                    <Hash :size="10" />
                    {{ tag }}
                    <button
                      @click="form.tags?.splice(idx, 1)"
                      class="ml-1 text-text-disabled hover:text-error transition-colors"
                    >
                      <X :size="10" />
                    </button>
                  </span>
                  <input
                    type="text"
                    class="text-[0.6875rem] bg-transparent border-none focus:outline-none text-text-secondary w-20 placeholder:text-text-disabled"
                    placeholder="+ tag"
                    @keydown.enter.prevent="(e: KeyboardEvent) => {
                      const val = (e.target as HTMLInputElement).value.trim()
                      if (val && !form.tags?.includes(val)) {
                        form.tags?.push(val);
                        (e.target as HTMLInputElement).value = ''
                      }
                    }"
                  />
                </div>

                <!-- Content: Toggle between preview and editor -->
                <div class="mb-3 flex items-center justify-between">
                  <span class="text-[0.6875rem] font-medium text-text-tertiary">Nội dung</span>
                  <button
                    @click="toggleContentEdit"
                    class="inline-flex items-center gap-1 text-[0.6875rem] font-medium px-2 py-1 rounded-lg transition-colors"
                    :class="isEditingContent ? 'bg-accent/10 text-accent' : 'text-text-tertiary hover:bg-bg-hover hover:text-text-primary'"
                  >
                    <Pencil :size="12" />
                    {{ isEditingContent ? 'Lưu & Xem trước' : 'Sửa Markdown' }}
                  </button>
                </div>

                <!-- Markdown editor -->
                <textarea
                  v-if="isEditingContent"
                  v-model="editMarkdown"
                  rows="20"
                  class="blog-textarea font-mono text-[0.8125rem] leading-relaxed"
                  placeholder="Nội dung markdown..."
                />

                <!-- Rendered Markdown Content -->
                <div v-else class="blog-preview__content" v-html="previewHtml"></div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="blog-modal__footer pwa-modal-safe">
              <button class="btn-secondary blog-btn" @click="isModalOpen = false">
                {{ t('common.cancel') }}
              </button>
              <button
                class="btn-primary blog-btn"
                @click="handleSave"
                :disabled="isGenerating || !canPublish"
              >
                <CheckCircle2 :size="16" />
                <span>{{ editingSlug ? 'Cập nhật' : t('blog.publishBtn') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════
   Blog Admin — All button/badge styles
   ═══════════════════════════════════════════ */

/* ── Responsive Header ── */
.admin-blog__header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
@media (min-width: 640px) {
  .admin-blog__header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
  }
}

/* All blog buttons: always nowrap */
.blog-btn {
  white-space: nowrap;
}

/* New Post button — prominent on mobile */
.blog-btn--new {
  width: 100%;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  border-radius: 0.5rem;
}
@media (min-width: 640px) {
  .blog-btn--new {
    width: auto;
    padding: 0.5rem 1rem;
  }
}

.blog-btn--generate {
  padding: 0.625rem 1.5rem;
  font-size: 0.875rem;
}

.blog-btn--back {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.15s ease;
}
.blog-btn--back:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

/* ── Action Buttons (touch-friendly) ── */
.blog-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  min-width: 2.25rem;
  border-radius: 0.5rem;
  color: var(--color-text-tertiary);
  transition: all 0.15s ease;
  flex-shrink: 0;
  text-decoration: none;
}
.blog-action-btn:hover {
  color: var(--color-accent);
  background: rgba(124, 111, 247, 0.1);
}
.blog-action-btn--danger:hover {
  color: var(--color-error);
  background: rgba(251, 113, 133, 0.1);
}

/* ── Mobile Card Layout ── */
.blog-mobile-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.blog-mobile-card:active {
  border-color: var(--color-accent);
}

/* ── Status Badges ── */
.blog-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  white-space: nowrap;
}
.blog-badge--published {
  color: var(--color-success);
  background: rgba(52, 211, 153, 0.12);
}
.blog-badge--draft {
  color: var(--color-warning);
  background: rgba(251, 191, 36, 0.12);
}

/* ── Modal Overlay ── */
.blog-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  padding: 0;
  padding-top: env(safe-area-inset-top, 0px);
}
@media (min-width: 640px) {
  .blog-modal-overlay {
    align-items: center;
    padding: 1rem;
  }
}

/* ── Modal Container ── */
.blog-modal {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: 1rem 1rem 0 0;
  width: 100%;
  max-width: 52rem;
  max-height: 90vh;
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}
@media (min-width: 640px) {
  .blog-modal {
    border-radius: 1rem;
  }
}

.blog-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
}

.blog-modal__close {
  color: var(--color-text-disabled);
  padding: 0.375rem;
  border-radius: 0.375rem;
  transition: all 0.15s ease;
}
.blog-modal__close:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.blog-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.blog-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
  background: var(--color-bg-surface);
}

/* ── Tab Switcher ── */
.blog-tabs {
  display: flex;
  gap: 0;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
}

.blog-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-tertiary);
  border-bottom: 2px solid transparent;
  transition: all 0.15s ease;
  cursor: pointer;
  white-space: nowrap;
}
.blog-tab:hover {
  color: var(--color-text-secondary);
}
.blog-tab--active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

/* ── Textarea ── */
.blog-textarea {
  width: 100%;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: 0.75rem;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  line-height: 1.7;
  padding: 1rem;
  resize: none;
  transition: border-color 0.15s ease;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
.blog-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}
.blog-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.blog-textarea::placeholder {
  color: var(--color-text-disabled);
}

/* ── Image Preview ── */
.blog-image-preview {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  width: 4rem;
  height: 4rem;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 2px solid var(--color-accent);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  background: var(--color-bg-surface);
}
.blog-image-preview__remove {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background: var(--color-error);
  color: #fff;
  border-radius: 9999px;
  padding: 0.125rem;
  transition: opacity 0.15s ease;
}

/* ── Preview Panel ── */
.blog-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-subtle);
}

.blog-preview__cover {
  width: 100%;
  height: auto;
  max-height: 18rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid var(--color-border-default);
}
.blog-preview__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-height: 18rem;
}
.blog-preview__cover-wrap {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.blog-preview__upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-bg-elevated);
  border: 1px dashed var(--color-border-default);
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
  align-self: flex-start;
}
.blog-preview__upload-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

/* ── Content Body — Magazine Typography (Matches BlogDetailView) ── */
.blog-preview__content {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.8;
}
.blog-preview__content :deep(h1) {
  display: none; /* Hide markdown h1 to prevent double title with preview header */
}
.blog-preview__content :deep(h2) {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 2rem 0 0.875rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border-subtle);
  letter-spacing: -0.01em;
}
.blog-preview__content :deep(h3) {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 1.5rem 0 0.75rem;
}
.blog-preview__content :deep(p) {
  margin-bottom: 1.25rem;
  color: var(--color-text-secondary);
}
.blog-preview__content :deep(a) {
  color: var(--color-accent);
  font-weight: 500;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s ease;
}
.blog-preview__content :deep(a:hover) {
  border-bottom-color: var(--color-accent);
}
.blog-preview__content :deep(strong) {
  color: var(--color-text-primary);
  font-weight: 700;
}
.blog-preview__content :deep(ul) {
  list-style: none;
  padding-left: 0;
  margin-bottom: 1.25rem;
}
.blog-preview__content :deep(ul > li) {
  position: relative;
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}
.blog-preview__content :deep(ul > li::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0.6em;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-accent);
}
.blog-preview__content :deep(ol) {
  list-style: none;
  padding-left: 0;
  counter-reset: blog-ol;
  margin-bottom: 1.25rem;
}
.blog-preview__content :deep(ol > li) {
  position: relative;
  padding-left: 1.75rem;
  margin-bottom: 0.5rem;
  counter-increment: blog-ol;
}
.blog-preview__content :deep(ol > li::before) {
  content: counter(blog-ol);
  position: absolute;
  left: 0;
  top: 0.1em;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 50%;
  background: var(--color-accent);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.blog-preview__content :deep(blockquote) {
  margin: 1.5rem 0;
  padding: 1rem 1.25rem;
  border-left: 3px solid var(--color-accent);
  background: rgba(124, 111, 247, 0.06);
  border-radius: 0 0.5rem 0.5rem 0;
  font-style: italic;
  color: var(--color-text-primary);
}
.blog-preview__content :deep(blockquote p) {
  margin-bottom: 0;
}
.blog-preview__content :deep(code) {
  font-size: 0.85em;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  color: var(--color-accent);
}
.blog-preview__content :deep(pre) {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  margin: 1.25rem 0;
}
.blog-preview__content :deep(pre code) {
  background: transparent;
  border: none;
  padding: 0;
  color: var(--color-text-primary);
}
.blog-preview__content :deep(img) {
  border-radius: 0.5rem;
  border: 1px solid var(--color-border-default);
  margin: 1.25rem 0;
  max-width: 100%;
  height: auto;
}

/* ── Tags ── */
.blog-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  padding: 0.1875rem 0.5rem;
  border-radius: 0.375rem;
  white-space: nowrap;
}

/* ── Modal Transitions ── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .blog-modal,
.modal-leave-active .blog-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .blog-modal {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
.modal-leave-to .blog-modal {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

/* ── Input Area ── */
.blog-input-area {
  animation: fadeIn 0.15s ease;
}

/* ── Preview ── */
.blog-preview {
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
