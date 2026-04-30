<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { useI18n } from 'vue-i18n'
import { Calendar, ChevronRight, Hash, Zap, BrainCircuit, LayoutDashboard, ArrowRight, Sparkles, X } from 'lucide-vue-next'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const blogStore = useBlogStore()
const showTooltip = ref(false)
const activeTag = ref<string | null>(null)

onMounted(() => {
  blogStore.fetchBlogs()
  // Read ?tag= from URL
  const tagParam = route.query.tag as string | undefined
  if (tagParam) activeTag.value = tagParam
})

// All unique tags from all blogs
const allTags = computed(() => {
  const tagSet = new Set<string>()
  blogStore.blogs.forEach(b => b.tags?.forEach(t => tagSet.add(t)))
  return Array.from(tagSet).sort()
})

// Filtered blogs based on active tag
const filteredBlogs = computed(() => {
  if (!activeTag.value) return blogStore.blogs
  return blogStore.blogs.filter(b => b.tags?.includes(activeTag.value!))
})

function setTag(tag: string | null) {
  activeTag.value = tag
  router.replace({ query: tag ? { tag } : {} })
}

const formatDate = (dateStr: string) => {
  const loc = locale.value === 'vi' ? 'vi-VN' : 'en-US'
  return new Date(dateStr).toLocaleDateString(loc, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="max-w-[48rem] mx-auto pb-12">
    <h1 class="mb-2 text-2xl font-bold tracking-tight md:mb-4">{{ t('blog.listTitle') }}</h1>
    <p class="text-text-tertiary text-sm mb-6">{{ t('blog.listDesc') }}</p>

    <!-- Tag Filter Bar -->
    <div v-if="allTags.length > 0" class="flex flex-wrap items-center gap-2 mb-8">
      <button
        v-for="tag in allTags"
        :key="tag"
        class="blog-filter-tag"
        :class="{ 'blog-filter-tag--active': activeTag === tag }"
        @click="setTag(activeTag === tag ? null : tag)"
      >
        <Hash :size="10" /> {{ tag }}
        <X v-if="activeTag === tag" :size="10" class="ml-0.5" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="blogStore.isLoading && !blogStore.blogs.length" class="space-y-6">
      <div v-for="i in 3" :key="i" class="card-premium p-5 flex flex-col md:flex-row gap-5 animate-pulse">
        <div class="w-full md:w-48 h-32 bg-border-default rounded-xl shrink-0"></div>
        <div class="flex-1 py-1">
          <div class="h-5 bg-border-default rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-border-default rounded w-full mb-2"></div>
          <div class="h-4 bg-border-default rounded w-5/6 mb-4"></div>
          <div class="h-3 bg-border-default rounded w-1/4"></div>
        </div>
      </div>
    </div>

    <!-- Blog List -->
    <div v-else-if="filteredBlogs.length > 0" class="space-y-6">
      <div
        v-for="blog in filteredBlogs"
        :key="blog.id"
        class="card-premium p-5 flex flex-col md:flex-row gap-6 cursor-pointer group transition-all duration-300 hover:border-accent/40"
        @click="router.push(`/blog/${blog.slug}`)"
      >
        <div v-if="blog.imageUrl" class="w-full md:w-56 h-40 shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated relative">
          <img :src="blog.imageUrl" :alt="blog.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        
        <div class="flex-1 flex flex-col justify-center">
          <div class="flex items-center gap-3 text-[0.75rem] text-text-tertiary mb-3">
            <span class="flex items-center gap-1.5"><Calendar :size="14" /> {{ formatDate(blog.createdAt) }}</span>
          </div>
          
          <h2 class="text-xl font-bold mb-2 group-hover:text-accent transition-colors line-clamp-2">
            {{ blog.title }}
          </h2>
          
          <p class="text-sm text-text-secondary line-clamp-2 mb-4 leading-relaxed">
            {{ blog.excerpt }}
          </p>
          
          <div class="flex flex-wrap items-center gap-2 mt-auto">
            <span
              v-for="tag in blog.tags" :key="tag"
              class="blog-list-tag cursor-pointer hover:text-accent hover:border-accent/40 transition-colors"
              @click.stop="setTag(tag)"
            >
              <Hash :size="10" /> {{ tag }}
            </span>
            <span class="ml-auto text-[0.75rem] font-semibold text-accent flex items-center gap-1 group-hover:gap-2 transition-all whitespace-nowrap">
              {{ t('blog.readMore') }} <ChevronRight :size="14" />
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-20 card-premium">
      <div class="text-text-disabled mb-4">
        <Calendar :size="48" class="mx-auto opacity-50" />
      </div>
      <h3 class="text-lg font-medium mb-1">{{ activeTag ? `Không có bài viết với tag "${activeTag}"` : t('blog.emptyPublic') }}</h3>
      <p class="text-text-tertiary text-sm">{{ activeTag ? '' : t('blog.emptyPublicHint') }}</p>
      <button v-if="activeTag" class="mt-4 text-accent text-sm font-medium" @click="setTag(null)">← Xem tất cả</button>
    </div>

    <!-- Floating CTA — Icon Only -->
    <div class="cta-float" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">
      <!-- Tooltip Card -->
      <Transition name="tooltip">
        <div v-if="showTooltip" class="cta-tooltip" @click.stop>
          <div class="cta-tooltip__glow"></div>
          <div class="cta-tooltip__glow2"></div>

          <div class="relative z-[1]">
            <!-- Header -->
            <div class="flex items-center gap-3 mb-3">
              <div class="cta-tooltip__logo">
                <img src="/images/logo-512.png" alt="FinNote" class="w-full h-full object-contain rounded-md" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-text-primary leading-tight">{{ t('blog.appIntroTitle') }}</h3>
                <p class="text-[0.6875rem] text-text-tertiary mt-0.5">PWA • {{ t('blog.appIntroNote') }}</p>
              </div>
            </div>

            <!-- Features -->
            <div class="space-y-2 mb-4">
              <div class="cta-tooltip__feature">
                <div class="cta-tooltip__feature-icon"><Zap :size="11" /></div>
                <span>{{ t('blog.appIntroFeature1') }}</span>
              </div>
              <div class="cta-tooltip__feature">
                <div class="cta-tooltip__feature-icon cta-tooltip__feature-icon--purple"><BrainCircuit :size="11" /></div>
                <span>{{ t('blog.appIntroFeature2') }}</span>
              </div>
              <div class="cta-tooltip__feature">
                <div class="cta-tooltip__feature-icon cta-tooltip__feature-icon--green"><LayoutDashboard :size="11" /></div>
                <span>{{ t('blog.appIntroFeature3') }}</span>
              </div>
            </div>

            <!-- CTA Link -->
            <a href="/login" class="cta-tooltip__action group">
              <span>{{ t('blog.appIntroCta') }}</span>
              <ArrowRight :size="14" class="transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </Transition>

      <!-- Button — Animated Logo -->
      <button class="cta-float__btn group" @click="router.push('/login')">
        <div class="cta-float__pulse"></div>
        <div class="cta-float__spin-border"></div>
        <div class="cta-float__inner">
          <img src="/images/logo-512.png" alt="FinNote Logo" class="w-full h-full object-cover" />
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.blog-list-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-bg-elevated);
  padding: 0.1875rem 0.5rem;
  border-radius: 0.375rem;
  white-space: nowrap;
  border: 1px solid transparent;
}

/* ── Tag Filter Bar ── */
.blog-filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-bg-elevated);
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid var(--color-border-default);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.blog-filter-tag:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.blog-filter-tag--active {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}
.blog-filter-tag--active:hover {
  opacity: 0.9;
  color: #fff;
}

/* ══════════════════════════════════════════════
   Floating CTA Button + Rich Tooltip
   ══════════════════════════════════════════════ */

.cta-float {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
@media (min-width: 768px) {
  .cta-float {
    bottom: 2rem;
    right: 2rem;
  }
}

/* ── Floating Button (Animated Logo) ── */
.cta-float__btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  border: none;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow:
    0 4px 20px rgba(124, 111, 247, 0.4),
    0 0 0 0 rgba(124, 111, 247, 0);
  cursor: pointer;
}
.cta-float__btn:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow:
    0 8px 32px rgba(124, 111, 247, 0.5),
    0 0 0 4px rgba(124, 111, 247, 0.15);
}

.cta-float__spin-border {
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #7c6ff7, #a855f7, #34d399, #7c6ff7);
  animation: ctaSpin 3s linear infinite;
  z-index: 0;
}
@keyframes ctaSpin {
  to { transform: rotate(360deg); }
}

.cta-float__inner {
  position: relative;
  z-index: 1;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-bg-surface);
  padding: 2px;
}

.cta-float__inner img {
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.cta-float__btn:hover .cta-float__inner img {
  transform: scale(1.1);
}

.cta-float__pulse {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(124,111,247,0.3) 0%, transparent 70%);
  animation: ctaPulse 2.5s ease-in-out infinite;
  z-index: -1;
}
@keyframes ctaPulse {
  0%, 100% { opacity: 0.5; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* ── Tooltip Card ── */
.cta-tooltip {
  position: absolute;
  bottom: calc(100% + 0.75rem);
  right: 0;
  width: 20rem;
  padding: 1.25rem;
  border-radius: 1rem;
  border: 1px solid rgba(124, 111, 247, 0.25);
  background: var(--color-bg-surface);
  box-shadow:
    0 20px 60px -15px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(124, 111, 247, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  overflow: hidden;
  backdrop-filter: blur(16px);
}

.cta-tooltip__glow {
  position: absolute;
  top: -3rem;
  right: -2rem;
  width: 10rem;
  height: 10rem;
  background: radial-gradient(circle, rgba(124, 111, 247, 0.15) 0%, transparent 70%);
  pointer-events: none;
}
.cta-tooltip__glow2 {
  position: absolute;
  bottom: -2rem;
  left: -3rem;
  width: 8rem;
  height: 8rem;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.cta-tooltip__logo {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 0 12px rgba(124, 111, 247, 0.2);
  border: 1px solid rgba(124, 111, 247, 0.2);
}

.cta-tooltip__feature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}
.cta-tooltip__feature-icon {
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(124, 111, 247, 0.12);
  color: var(--color-accent);
}
.cta-tooltip__feature-icon--purple {
  background: rgba(168, 85, 247, 0.12);
  color: #a855f7;
}
.cta-tooltip__feature-icon--green {
  background: rgba(52, 211, 153, 0.12);
  color: #34d399;
}

.cta-tooltip__action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--color-accent), #a855f7);
  border-radius: 0.5rem;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(124, 111, 247, 0.3);
}
.cta-tooltip__action:hover {
  box-shadow: 0 4px 16px rgba(124, 111, 247, 0.4);
  transform: translateY(-1px);
}

/* ── Tooltip Transitions ── */
.tooltip-enter-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tooltip-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tooltip-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
}
.tooltip-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}
</style>
