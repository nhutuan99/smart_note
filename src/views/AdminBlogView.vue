<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
  Loader2
} from 'lucide-vue-next'
import type { Blog } from '@/types'

const { t } = useI18n()
const blogStore = useBlogStore()
const uiStore = useUiStore()

// ── Modal State ──
const isModalOpen = ref(false)
const isGenerating = ref(false)
const activeTab = ref<'paste' | 'ai'>('ai')

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
  form.value = { title: '', slug: '', excerpt: '', content: '', tags: [], imageUrl: '', published: true }
  inputContent.value = ''
  aiImageBase64.value = ''
  hasPreview.value = false
  previewHtml.value = ''
  activeTab.value = 'ai'
  isModalOpen.value = true
}

function switchTab(tab: 'paste' | 'ai') {
  activeTab.value = tab
  // Reset state when switching
  inputContent.value = ''
  aiImageBase64.value = ''
  hasPreview.value = false
  previewHtml.value = ''
  form.value = { title: '', slug: '', excerpt: '', content: '', tags: [], imageUrl: '', published: true }
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

  try {
    if (activeTab.value === 'paste') {
      // Mode Paste: Send markdown to AI to extract metadata
      uiStore.showToast('info', t('blog.analyzing'))
      const data = await blogStore.generateContent(
        `Phân tích bài viết markdown sau và trả về JSON. Nội dung:\n\n${inputContent.value}`,
        ''
      )
      if (data) {
        form.value.title = data.title || ''
        form.value.excerpt = data.excerpt || ''
        form.value.content = inputContent.value // Keep original markdown
        form.value.tags = data.tags || []

        // Generate cover image from topic
        uiStore.showToast('info', t('blog.generatingCover'))
        const imagePrompt = data.seoKeywords || data.title || ''
        if (imagePrompt) {
          const imageUrl = await blogStore.generateImage(imagePrompt)
          if (imageUrl) form.value.imageUrl = imageUrl
        }

        previewHtml.value = await marked(form.value.content || '', { async: true })
        hasPreview.value = true
        uiStore.showToast('success', t('blog.generateSuccess'))
      }
    } else {
      // Mode AI: Full generation from topic/image
      uiStore.showToast('info', t('blog.aiWriting'))
      const data = await blogStore.generateContent(inputContent.value, aiImageBase64.value)
      if (data) {
        form.value.title = data.title || ''
        form.value.excerpt = data.excerpt || ''
        form.value.content = data.content || ''
        form.value.tags = data.tags || []

        // Generate cover image
        const imagePrompt = data.seoKeywords || inputContent.value
        uiStore.showToast('info', t('blog.generatingCover'))
        const imageUrl = await blogStore.generateImage(imagePrompt)
        if (imageUrl) form.value.imageUrl = imageUrl

        previewHtml.value = await marked(form.value.content || '', { async: true })
        hasPreview.value = true
        uiStore.showToast('success', t('blog.generateSuccess'))
      }
    }
  } catch (err: any) {
    uiStore.showToast('error', err.message || t('blog.generateFailed'))
  } finally {
    isGenerating.value = false
  }
}

async function handleSave() {
  if (!canPublish.value) {
    uiStore.showToast('error', t('blog.missingContent'))
    return
  }

  try {
    isGenerating.value = true
    await blogStore.createBlog(form.value)
    uiStore.showToast('success', t('blog.published'))
    isModalOpen.value = false
  } catch (err: any) {
    uiStore.showToast('error', t('blog.publishFailed') + ': ' + err.message)
  } finally {
    isGenerating.value = false
  }
}

async function handleDelete(slug: string) {
  if (!confirm(t('blog.deleteConfirm'))) return
  try {
    await blogStore.deleteBlog(slug)
    uiStore.showToast('success', t('blog.deleted'))
  } catch (err: any) {
    uiStore.showToast('error', err.message)
  }
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
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight mb-1">{{ t('blog.manageTitle') }}</h1>
        <p class="text-text-tertiary text-sm">{{ t('blog.manageDesc') }}</p>
      </div>
      <button id="btn-new-blog" class="btn-primary blog-btn" @click="openModal">
        <Plus :size="16" />
        <span>{{ t('blog.newPost') }}</span>
      </button>
    </div>

    <!-- Blog List Table -->
    <div class="card-premium overflow-hidden">
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
          <tr v-for="blog in blogStore.blogs" :key="blog.id" class="hover:bg-bg-hover/50 transition-colors">
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
            <td class="px-6 py-4 text-right">
              <button class="text-text-tertiary hover:text-error transition-colors p-1.5 rounded-md hover:bg-error/10" @click="handleDelete(blog.slug)">
                <Trash2 :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
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
                {{ t('blog.modalTitle') }}
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
              <div v-if="!hasPreview" class="blog-input-area">
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
                    <Loader2 v-if="isGenerating" :size="16" class="animate-spin" />
                    <Sparkles v-else :size="16" />
                    <span>{{ isGenerating ? t('blog.generating') : t('blog.generateBtn') }}</span>
                  </button>
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
                    @click="hasPreview = false"
                  >
                    <ArrowLeft :size="14" />
                    <span>{{ t('blog.editInput') }}</span>
                  </button>
                </div>

                <!-- Cover Image -->
                <div v-if="form.imageUrl" class="blog-preview__cover">
                  <img :src="form.imageUrl" :alt="form.title" />
                </div>

                <!-- Title -->
                <h2 class="text-xl md:text-2xl font-bold tracking-tight mb-3 text-text-primary">
                  {{ form.title }}
                </h2>

                <!-- Excerpt -->
                <p v-if="form.excerpt" class="text-sm text-text-secondary leading-relaxed mb-4 italic border-l-2 border-accent/40 pl-3">
                  {{ form.excerpt }}
                </p>

                <!-- Tags -->
                <div v-if="form.tags?.length" class="flex flex-wrap gap-1.5 mb-6">
                  <span v-for="tag in form.tags" :key="tag" class="blog-tag">
                    <Hash :size="10" />
                    {{ tag }}
                  </span>
                </div>

                <!-- Rendered Markdown Content -->
                <div class="blog-preview__content prose prose-invert prose-emerald max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-text-primary prose-h2:border-b prose-h2:border-border-subtle prose-h2:pb-2
                  prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3
                  prose-p:text-sm prose-p:leading-relaxed prose-p:text-text-secondary prose-p:mb-4
                  prose-a:text-accent prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                  prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:bg-accent-subtle/20 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:italic
                  prose-ul:text-text-secondary prose-li:my-1
                  prose-strong:text-text-primary"
                  v-html="previewHtml"
                ></div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="blog-modal__footer">
              <button class="btn-secondary blog-btn" @click="isModalOpen = false">
                {{ t('common.cancel') }}
              </button>
              <button
                class="btn-primary blog-btn"
                @click="handleSave"
                :disabled="isGenerating || !canPublish"
              >
                <CheckCircle2 :size="16" />
                <span>{{ t('blog.publishBtn') }}</span>
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

/* All blog buttons: always nowrap */
.blog-btn {
  white-space: nowrap;
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

/* ── Status Badges ── */
.blog-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  white-space: nowrap;
}
.blog-badge--published {
  color: var(--color-success);
  background: rgba(52, 211, 153, 0.1);
}
.blog-badge--draft {
  color: var(--color-warning);
  background: rgba(251, 191, 36, 0.1);
}

/* ── Modal Overlay ── */
.blog-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  padding: 1rem;
}

/* ── Modal Container ── */
.blog-modal {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: 1rem;
  width: 100%;
  max-width: 52rem;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
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
  margin-bottom: 1.5rem;
}
.blog-preview__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-height: 18rem;
}

.blog-preview__content :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
}
.blog-preview__content :deep(ol) {
  list-style-type: decimal;
  padding-left: 1.5rem;
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
