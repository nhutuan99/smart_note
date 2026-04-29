<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import { ArrowLeft, Calendar, Hash, User as UserIcon, Clock, BookOpen } from 'lucide-vue-next'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()

const contentHtml = ref('')

// Estimate reading time
const readingTime = computed(() => {
  if (!blogStore.currentBlog?.content) return 0
  const words = blogStore.currentBlog.content.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
})

onMounted(async () => {
  const slug = route.params.slug as string
  if (slug) {
    const blog = await blogStore.fetchBlogBySlug(slug)
    if (blog) {
      contentHtml.value = await marked(blog.content, { async: true })
      
      // Update document title for SEO
      document.title = `${blog.seoMeta?.title || blog.title} | FinNote`
      
      // Update meta tags for SEO
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.setAttribute('name', 'description')
        document.head.appendChild(metaDesc)
      }
      metaDesc.setAttribute('content', blog.seoMeta?.description || blog.excerpt)
    } else {
      router.replace('/blog')
    }
  }
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
  <div class="max-w-[52rem] mx-auto pb-16">
    <!-- Back Button -->
    <button
      @click="router.push('/blog')"
      class="mb-6 flex items-center gap-2 text-text-tertiary hover:text-accent transition-colors text-sm font-medium whitespace-nowrap group"
    >
      <ArrowLeft :size="16" class="transition-transform group-hover:-translate-x-1" />
      {{ t('blog.backToList') }}
    </button>

    <!-- Loading State -->
    <div v-if="blogStore.isLoading" class="animate-pulse">
      <div class="h-10 bg-border-default rounded w-3/4 mb-4"></div>
      <div class="flex items-center gap-4 mb-8">
        <div class="h-4 bg-border-default rounded w-24"></div>
        <div class="h-4 bg-border-default rounded w-24"></div>
      </div>
      <div class="w-full h-64 bg-border-default rounded-2xl mb-8"></div>
      <div class="space-y-3">
        <div class="h-4 bg-border-default rounded w-full"></div>
        <div class="h-4 bg-border-default rounded w-full"></div>
        <div class="h-4 bg-border-default rounded w-5/6"></div>
      </div>
    </div>

    <!-- Blog Content -->
    <article v-else-if="blogStore.currentBlog" class="blog-article">
      <!-- Hero Section -->
      <div class="blog-hero">
        <div class="blog-hero__glow"></div>
        <div class="blog-hero__glow2"></div>
        
        <!-- Tags -->
        <div class="flex flex-wrap items-center gap-2 mb-5">
          <span v-for="tag in blogStore.currentBlog.tags" :key="tag" class="blog-detail-tag">
            <Hash :size="10" /> {{ tag }}
          </span>
        </div>
        
        <!-- Title -->
        <h1 class="blog-hero__title">
          {{ blogStore.currentBlog.title }}
        </h1>

        <!-- Excerpt -->
        <p v-if="blogStore.currentBlog.excerpt" class="blog-hero__excerpt">
          {{ blogStore.currentBlog.excerpt }}
        </p>
        
        <!-- Meta Bar -->
        <div class="blog-meta">
          <div class="blog-meta__author">
            <div class="blog-meta__avatar">
              <UserIcon :size="14" />
            </div>
            <div>
              <span class="blog-meta__name">{{ blogStore.currentBlog.author.name }}</span>
              <span class="blog-meta__role">{{ t('blog.editor') }}</span>
            </div>
          </div>
          <div class="blog-meta__divider"></div>
          <div class="blog-meta__item">
            <Calendar :size="14" />
            <span>{{ formatDate(blogStore.currentBlog.createdAt) }}</span>
          </div>
          <div class="blog-meta__divider"></div>
          <div class="blog-meta__item">
            <Clock :size="14" />
            <span>{{ readingTime }} {{ t('blog.minRead') }}</span>
          </div>
        </div>
      </div>

      <!-- Cover Image -->
      <figure v-if="blogStore.currentBlog.imageUrl" class="blog-cover group">
        <div class="blog-cover__overlay"></div>
        <img :src="blogStore.currentBlog.imageUrl" :alt="blogStore.currentBlog.title" class="blog-cover__img" />
      </figure>

      <!-- Markdown Content -->
      <div class="blog-content" v-html="contentHtml"></div>

      <!-- Footer -->
      <footer class="blog-footer">
        <div class="blog-footer__tags">
          <BookOpen :size="16" class="text-accent" />
          <span v-for="tag in blogStore.currentBlog.tags" :key="tag" class="blog-detail-tag blog-detail-tag--sm">
            <Hash :size="9" /> {{ tag }}
          </span>
        </div>
        <button
          @click="router.push('/blog')"
          class="blog-footer__back"
        >
          <ArrowLeft :size="14" />
          {{ t('blog.backToList') }}
        </button>
      </footer>
    </article>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════
   Blog Detail — Premium Magazine Style
   ═══════════════════════════════════════════ */

.blog-article {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(124, 111, 247, 0.04),
    0 8px 40px -12px rgba(0, 0, 0, 0.4);
}

/* ── Hero Section ── */
.blog-hero {
  position: relative;
  padding: 2.5rem 2rem 2rem;
  overflow: hidden;
}
@media (min-width: 768px) {
  .blog-hero { padding: 3rem 3rem 2.5rem; }
}

.blog-hero__glow {
  position: absolute;
  top: -6rem;
  right: -4rem;
  width: 20rem;
  height: 20rem;
  background: radial-gradient(circle, rgba(124, 111, 247, 0.15) 0%, transparent 70%);
  pointer-events: none;
}
.blog-hero__glow2 {
  position: absolute;
  bottom: -4rem;
  left: -6rem;
  width: 16rem;
  height: 16rem;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.blog-hero__title {
  position: relative;
  z-index: 1;
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}
@media (min-width: 768px) {
  .blog-hero__title { font-size: 2.25rem; }
}

.blog-hero__excerpt {
  position: relative;
  z-index: 1;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
  padding-left: 1rem;
  border-left: 3px solid var(--color-accent);
  opacity: 0.85;
}

/* ── Meta Bar ── */
.blog-meta {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 0.75rem;
  font-size: 0.8125rem;
}

.blog-meta__author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.blog-meta__avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent), rgba(124, 111, 247, 0.5));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.blog-meta__name {
  display: block;
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.8125rem;
  line-height: 1.2;
}
.blog-meta__role {
  display: block;
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
}

.blog-meta__divider {
  width: 1px;
  height: 1.5rem;
  background: var(--color-border-default);
}

.blog-meta__item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

/* ── Cover Image ── */
.blog-cover {
  margin: 0;
  position: relative;
  overflow: hidden;
  max-height: 28rem;
  border-top: 1px solid var(--color-border-subtle);
  border-bottom: 1px solid var(--color-border-subtle);
}
.blog-cover__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.15), transparent 40%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}
.blog-cover:hover .blog-cover__overlay { opacity: 1; }
.blog-cover__img {
  width: 100%;
  height: auto;
  object-fit: cover;
  max-height: 28rem;
  transition: transform 0.7s ease;
}
.blog-cover:hover .blog-cover__img {
  transform: scale(1.02);
}

/* ── Content Body — Magazine Typography ── */
.blog-content {
  padding: 2.5rem 2rem 2rem;
  color: var(--color-text-secondary);
  font-size: 1rem;
  line-height: 1.85;
}
@media (min-width: 768px) {
  .blog-content { padding: 3rem 3rem 2.5rem; }
}

/* Headings */
.blog-content :deep(h1) {
  display: none; /* Hide markdown h1 to prevent double title with Hero section */
}
.blog-content :deep(h2) {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 2.5rem 0 1rem;
  padding-bottom: 0.625rem;
  border-bottom: 1px solid var(--color-border-subtle);
  letter-spacing: -0.01em;
}
.blog-content :deep(h3) {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 2rem 0 0.75rem;
}

/* Paragraphs */
.blog-content :deep(p) {
  margin-bottom: 1.5rem;
  color: var(--color-text-secondary);
}

/* Links */
.blog-content :deep(a) {
  color: var(--color-accent);
  font-weight: 500;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s ease;
}
.blog-content :deep(a:hover) {
  border-bottom-color: var(--color-accent);
}

/* Bold */
.blog-content :deep(strong) {
  color: var(--color-text-primary);
  font-weight: 700;
}

/* Lists */
.blog-content :deep(ul) {
  list-style: none;
  padding-left: 0;
  margin-bottom: 1.5rem;
}
.blog-content :deep(ul > li) {
  position: relative;
  padding-left: 1.5rem;
  margin-bottom: 0.625rem;
}
.blog-content :deep(ul > li::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0.65em;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
}
.blog-content :deep(ol) {
  list-style: none;
  padding-left: 0;
  counter-reset: blog-ol;
  margin-bottom: 1.5rem;
}
.blog-content :deep(ol > li) {
  position: relative;
  padding-left: 2rem;
  margin-bottom: 0.625rem;
  counter-increment: blog-ol;
}
.blog-content :deep(ol > li::before) {
  content: counter(blog-ol);
  position: absolute;
  left: 0;
  top: 0.1em;
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 50%;
  background: var(--color-accent);
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Blockquote */
.blog-content :deep(blockquote) {
  margin: 2rem 0;
  padding: 1.25rem 1.5rem;
  border-left: 4px solid var(--color-accent);
  background: rgba(124, 111, 247, 0.06);
  border-radius: 0 0.75rem 0.75rem 0;
  font-style: italic;
  color: var(--color-text-primary);
}
.blog-content :deep(blockquote p) {
  margin-bottom: 0;
}

/* Code */
.blog-content :deep(code) {
  font-size: 0.875em;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  color: var(--color-accent);
}
.blog-content :deep(pre) {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: 0.75rem;
  padding: 1.25rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}
.blog-content :deep(pre code) {
  background: transparent;
  border: none;
  padding: 0;
  color: var(--color-text-primary);
}

/* Images inside content */
.blog-content :deep(img) {
  border-radius: 0.75rem;
  border: 1px solid var(--color-border-default);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  margin: 1.5rem 0;
}

/* Horizontal Rule */
.blog-content :deep(hr) {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border-default), transparent);
  margin: 2.5rem 0;
}

/* ── Footer ── */
.blog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
}
@media (min-width: 768px) {
  .blog-footer { padding: 1.5rem 3rem; }
}
.blog-footer__tags {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.blog-footer__back {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.15s ease;
}
.blog-footer__back:hover {
  color: var(--color-accent);
  background: rgba(124, 111, 247, 0.08);
}

/* ── Tags ── */
.blog-detail-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-accent);
  background: rgba(124, 111, 247, 0.1);
  border: 1px solid rgba(124, 111, 247, 0.2);
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  white-space: nowrap;
}
.blog-detail-tag--sm {
  font-size: 0.625rem;
  padding: 0.1875rem 0.5rem;
}
</style>
