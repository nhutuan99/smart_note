<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { useI18n } from 'vue-i18n'
import { Calendar, ChevronRight, Hash } from 'lucide-vue-next'

const { t, locale } = useI18n()
const router = useRouter()
const blogStore = useBlogStore()

onMounted(() => {
  blogStore.fetchBlogs()
})

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
    <p class="text-text-tertiary text-sm mb-8">{{ t('blog.listDesc') }}</p>

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
    <div v-else-if="blogStore.blogs.length > 0" class="space-y-6">
      <div
        v-for="blog in blogStore.blogs"
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
            <span v-for="tag in blog.tags" :key="tag" class="blog-list-tag">
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
      <h3 class="text-lg font-medium mb-1">{{ t('blog.emptyPublic') }}</h3>
      <p class="text-text-tertiary text-sm">{{ t('blog.emptyPublicHint') }}</p>
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
}
</style>
