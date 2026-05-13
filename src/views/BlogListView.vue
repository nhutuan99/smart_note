<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { useEventListener } from '@/composables/useEventListener'
import { Calendar, ChevronRight, ChevronLeft, Hash, Eye } from 'lucide-vue-next'
import AppIntroCta from '@/components/ui/AppIntroCta.vue'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const blogStore = useBlogStore()
const authStore = useAuthStore()
const showTooltip = ref(false)
const activeTags = ref<string[]>([])
const tagScrollContainer = ref<HTMLElement | null>(null)

const canScrollLeft = ref(false)
const canScrollRight = ref(true)

function checkScroll() {
  if (tagScrollContainer.value) {
    const { scrollLeft, scrollWidth, clientWidth } = tagScrollContainer.value
    canScrollLeft.value = scrollLeft > 0
    canScrollRight.value = Math.ceil(scrollLeft + clientWidth) < scrollWidth
  }
}

function handleWheelScroll(e: WheelEvent) {
  if (tagScrollContainer.value) {
    if (e.deltaY !== 0) {
      e.preventDefault()
      tagScrollContainer.value.scrollLeft += e.deltaY * 1.5
    }
  }
}

function scrollLeftBtn() {
  if (tagScrollContainer.value) {
    tagScrollContainer.value.scrollBy({ left: -200, behavior: 'smooth' })
  }
}

function scrollRightBtn() {
  if (tagScrollContainer.value) {
    tagScrollContainer.value.scrollBy({ left: 200, behavior: 'smooth' })
  }
}

onMounted(() => {
  blogStore.fetchBlogs()
  // Read ?tags= from URL
  const tagsParam = route.query.tags as string | undefined
  if (tagsParam) {
    activeTags.value = tagsParam.split(',').filter(Boolean)
  }
  
  // Initial scroll check
  setTimeout(checkScroll, 100)
})

useEventListener(window, 'resize', checkScroll)

// All unique tags from all blogs
const allTags = computed(() => {
  const tagSet = new Set<string>()
  blogStore.blogs.forEach(b => b.tags?.forEach(t => tagSet.add(t)))
  return Array.from(tagSet).sort()
})

// Filtered blogs based on active tags (must contain ALL selected tags)
const filteredBlogs = computed(() => {
  if (activeTags.value.length === 0) return blogStore.blogs
  return blogStore.blogs.filter(b => {
    if (!b.tags) return false
    return activeTags.value.every(tag => b.tags!.includes(tag))
  })
})

function toggleTag(tag: string) {
  const idx = activeTags.value.indexOf(tag)
  if (idx > -1) {
    activeTags.value.splice(idx, 1)
  } else {
    activeTags.value.push(tag)
  }
  
  // Update URL
  const query = activeTags.value.length > 0 ? { tags: activeTags.value.join(',') } : {}
  router.replace({ query })
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
  <div class="max-w-[48rem] mx-auto pb-12 relative">
    
    

    <div class="mb-2 md:mb-4">
      <h1 class="text-2xl font-bold tracking-tight">{{ t('blog.listTitle') }}</h1>
    </div>
    <p class="text-text-tertiary text-sm mb-6">{{ t('blog.listDesc') }}</p>

    <!-- Tag Filter Bar (Modern 2026 Horizontal Scroll UI) -->
    <div v-if="allTags.length > 0" class="mb-8 relative group">
      <!-- Gradient Fade Edge Indicator (Right) -->
      <div v-show="canScrollRight" class="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0b0c10] to-transparent pointer-events-none z-10 transition-opacity duration-300" />
      <!-- Gradient Fade Edge Indicator (Left) -->
      <div v-show="canScrollLeft" class="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0b0c10] to-transparent pointer-events-none z-10 transition-opacity duration-300" />
      
      <!-- Scroll Buttons -->
      <button 
        v-show="canScrollLeft"
        @click="scrollLeftBtn"
        class="absolute left-0 md:left-2 top-0 bottom-[8px] my-auto z-20 w-8 h-8 rounded-full bg-bg-surface border border-border-default flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent/40 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
      >
        <ChevronLeft :size="16" />
      </button>

      <button 
        v-show="canScrollRight"
        @click="scrollRightBtn"
        class="absolute right-0 md:right-2 top-0 bottom-[8px] my-auto z-20 w-8 h-8 rounded-full bg-bg-surface border border-border-default flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent/40 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
      >
        <ChevronRight :size="16" />
      </button>

      <div 
        ref="tagScrollContainer"
        class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 relative z-0 scroll-smooth"
        @wheel="handleWheelScroll"
        @scroll="checkScroll"
      >
        <button
          class="blog-filter-tag shrink-0"
          :class="{ 'blog-filter-tag--active': activeTags.length === 0 }"
          @click="activeTags = []; router.replace({ query: {} })"
        >
          Tất cả
        </button>
        <button
          v-for="tag in allTags"
          :key="tag"
          class="blog-filter-tag shrink-0"
          :class="{ 'blog-filter-tag--active': activeTags.includes(tag) }"
          @click="toggleTag(tag)"
        >
          <span class="text-[0.625rem] opacity-60 mr-0.5">#</span>{{ tag }}
        </button>
      </div>
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
            <span v-if="blog.viewCount" class="flex items-center gap-1"><Eye :size="13" /> {{ blog.viewCount }}</span>
          </div>
          
          <h2 class="text-lg md:text-xl font-bold mb-2 group-hover:text-accent transition-colors line-clamp-2">
            {{ blog.title }}
          </h2>
          
          <p class="text-sm text-text-secondary line-clamp-2 mb-4 leading-relaxed">
            {{ blog.excerpt }}
          </p>
          
          <div class="blog-list__footer">
            <div class="flex flex-wrap items-center gap-1.5">
              <span
                v-for="tag in blog.tags" :key="tag"
                class="blog-list-tag cursor-pointer hover:text-accent hover:border-accent/40 transition-colors"
                @click.stop="!activeTags.includes(tag) && toggleTag(tag)"
              >
                <span class="text-[0.625rem] opacity-60">#</span> {{ tag }}
              </span>
            </div>
            <span class="blog-list__read-more">
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
      <h3 class="text-lg font-medium mb-1">{{ activeTags.length > 0 ? `Không có bài viết phù hợp với các tag đã chọn` : t('blog.emptyPublic') }}</h3>
      <p class="text-text-tertiary text-sm">{{ activeTags.length > 0 ? '' : t('blog.emptyPublicHint') }}</p>
      <button v-if="activeTags.length > 0" class="mt-4 text-accent text-sm font-medium" @click="activeTags = []; router.replace({ query: {} })">← Xem tất cả</button>
    </div>

    <AppIntroCta />
  </div>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.no-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

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

/* ── Blog List Footer (tags + read more) ── */
.blog-list__footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: auto;
}
@media (min-width: 640px) {
  .blog-list__footer {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

/* Read More link — prominent, always visible */
.blog-list__read-more {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-accent);
  white-space: nowrap;
  padding: 0.375rem 0.75rem;
  background: rgba(124, 111, 247, 0.08);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}
.blog-list__read-more:hover,
.blog-list__read-more:active,
.group:hover .blog-list__read-more,
.group:active .blog-list__read-more {
  background: rgba(124, 111, 247, 0.15);
  gap: 0.5rem;
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
.blog-filter-tag:hover,
.blog-filter-tag:active {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.blog-filter-tag--active {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}
.blog-filter-tag--active:hover,
.blog-filter-tag--active:active {
  opacity: 0.9;
  color: #fff;
}


</style>
