<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { ArrowLeft, Calendar, Hash, User as UserIcon, Clock, BookOpen, ArrowRight, Zap, BrainCircuit, LayoutDashboard } from 'lucide-vue-next'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()
const authStore = useAuthStore()

const contentHtml = ref('')
const showTooltip = ref(false)

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
      contentHtml.value = DOMPurify.sanitize(await marked(blog.content, { async: true }))
      
      const seoTitle = blog.seoMeta?.title || blog.title
      const seoDesc = blog.seoMeta?.description || blog.excerpt
      const blogUrl = `https://finnote-f4n.pages.dev/blog/${blog.slug}`
      
      // Update document title for SEO
      document.title = `${seoTitle} | FinNote Blog`
      
      // Helper to set meta tag
      const setMeta = (attr: string, key: string, content: string) => {
        let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement
        if (!el) {
          el = document.createElement('meta')
          el.setAttribute(attr, key)
          document.head.appendChild(el)
        }
        el.setAttribute('content', content)
      }
      
      // Description
      setMeta('name', 'description', seoDesc)
      setMeta('name', 'keywords', (blog.seoMeta?.keywords || '') + ',' + (blog.tags || []).join(','))
      
      // Open Graph
      setMeta('property', 'og:type', 'article')
      setMeta('property', 'og:url', blogUrl)
      setMeta('property', 'og:title', seoTitle)
      setMeta('property', 'og:description', seoDesc)
      if (blog.imageUrl) setMeta('property', 'og:image', blog.imageUrl)
      setMeta('property', 'og:site_name', 'FinNote Blog')
      
      // Article tags
      setMeta('property', 'article:published_time', blog.createdAt)
      setMeta('property', 'article:author', blog.author?.name || 'FinNote')
      blog.tags?.forEach(tag => {
        const el = document.createElement('meta')
        el.setAttribute('property', 'article:tag')
        el.setAttribute('content', tag)
        document.head.appendChild(el)
      })
      
      // Twitter Card
      setMeta('name', 'twitter:card', 'summary_large_image')
      setMeta('name', 'twitter:title', seoTitle)
      setMeta('name', 'twitter:description', seoDesc)
      if (blog.imageUrl) setMeta('name', 'twitter:image', blog.imageUrl)
      
      // Canonical
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', blogUrl)
      
      // JSON-LD Article
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: seoTitle,
        description: seoDesc,
        image: blog.imageUrl || '',
        author: { '@type': 'Person', name: blog.author?.name || 'FinNote' },
        publisher: { '@type': 'Organization', name: 'FinNote', logo: { '@type': 'ImageObject', url: 'https://finnote-f4n.pages.dev/images/logo-512.png' } },
        datePublished: blog.createdAt,
        dateModified: blog.updatedAt || blog.createdAt,
        mainEntityOfPage: { '@type': 'WebPage', '@id': blogUrl },
        keywords: (blog.tags || []).join(', ')
      }
      const ldScript = document.createElement('script')
      ldScript.type = 'application/ld+json'
      ldScript.textContent = JSON.stringify(jsonLd)
      ldScript.id = 'blog-jsonld'
      // Remove old one if exists
      document.getElementById('blog-jsonld')?.remove()
      document.head.appendChild(ldScript)
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
    
    <!-- Language Switcher (Fixed top-right like LoginView) -->
    <div 
      class="fixed right-4 z-50 flex items-center gap-1" 
      :style="{ top: authStore.isAuthenticated ? 'max(env(safe-area-inset-top, 0px), 1rem)' : 'calc(max(env(safe-area-inset-top, 0px), 1rem) + 4rem)' }"
    >
      <button 
        @click="locale = 'vi'"
        :class="['text-sm font-semibold transition-colors rounded-lg px-3 py-2', locale === 'vi' ? 'text-accent bg-accent-subtle' : 'text-text-tertiary hover:text-text-primary hover:bg-bg-hover']"
      >
        VI
      </button>
      <span class="text-border-strong text-xs select-none">|</span>
      <button 
        @click="locale = 'en'"
        :class="['text-sm font-semibold transition-colors rounded-lg px-3 py-2', locale === 'en' ? 'text-accent bg-accent-subtle' : 'text-text-tertiary hover:text-text-primary hover:bg-bg-hover']"
      >
        EN
      </button>
    </div>

    <!-- Back Button -->
    <div class="mb-6">
      <button
        @click="router.push('/blog')"
        class="flex items-center gap-2 text-text-tertiary hover:text-accent transition-colors text-sm font-medium whitespace-nowrap group w-fit"
      >
        <ArrowLeft :size="16" class="transition-transform group-hover:-translate-x-1" />
        {{ t('blog.backToList') }}
      </button>
    </div>

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
        
        <!-- Tags (clickable) -->
        <div class="flex flex-wrap items-center gap-2 mb-5">
          <router-link
            v-for="tag in blogStore.currentBlog.tags" :key="tag"
            :to="{ path: '/blog', query: { tag } }"
            class="blog-detail-tag cursor-pointer hover:border-accent/40 hover:text-accent transition-colors"
          >
            <Hash :size="10" /> {{ tag }}
          </router-link>
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
              <img src="/images/logo-512.png" alt="FinNote Admin" class="w-full h-full object-cover" />
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

    <!-- Floating CTA (Desktop Tooltip + Mobile Anim) -->
    <div class="cta-float" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">
      <Transition name="tooltip">
        <div v-if="showTooltip" class="cta-tooltip" @click.stop>
          <div class="cta-tooltip__glow"></div>
          <div class="cta-tooltip__glow2"></div>
          <div class="relative z-[1]">
            <div class="flex items-center gap-3 mb-3">
              <div class="cta-tooltip__logo">
                <img src="/images/logo-512.png" alt="FinNote" class="w-full h-full object-contain rounded-md" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-text-primary leading-tight">{{ t('blog.appIntroTitle') }}</h3>
                <p class="text-[0.6875rem] text-text-tertiary mt-0.5">PWA • {{ t('blog.appIntroNote') }}</p>
              </div>
            </div>
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
            <a href="/login" class="cta-tooltip__action group">
              <span>{{ t('blog.appIntroCta') }}</span>
              <ArrowRight :size="14" class="transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </Transition>

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
/* ═══════════════════════════════════════════
   Blog Detail — Premium Magazine Style
   ═══════════════════════════════════════════ */

.blog-article {
  background: var(--color-bg-surface);
  border: none;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
  margin-left: -1rem;
  margin-right: -1rem;
}
@media (min-width: 768px) {
  .blog-article {
    margin-left: 0;
    margin-right: 0;
    border: 1px solid var(--color-border-default);
    border-radius: 1.25rem;
    box-shadow:
      0 0 0 1px rgba(124, 111, 247, 0.04),
      0 8px 40px -12px rgba(0, 0, 0, 0.4);
  }
}

/* ── Hero Section ── */
.blog-hero {
  position: relative;
  padding: 1.5rem 1.25rem 1.5rem;
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
  font-size: 1.625rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}
@media (min-width: 768px) {
  .blog-hero__title { 
    font-size: 2.25rem;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
}

.blog-hero__excerpt {
  position: relative;
  z-index: 1;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
  opacity: 0.9;
}
@media (min-width: 768px) {
  .blog-hero__excerpt {
    padding-left: 1rem;
    border-left: 3px solid var(--color-accent);
  }
}

/* ── Meta Bar ── */
.blog-meta {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem 0;
  background: transparent;
  border-top: 1px solid var(--color-border-subtle);
  border-bottom: 1px solid var(--color-border-subtle);
  border-radius: 0;
  font-size: 0.8125rem;
  margin-top: 1.5rem;
}
@media (min-width: 768px) {
  .blog-meta {
    padding: 0.875rem 1rem;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-subtle);
    border-radius: 0.75rem;
    margin-top: 0;
  }
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
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
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
  padding: 1.5rem 1.25rem 2rem;
  color: var(--color-text-secondary);
  font-size: 1.0625rem;
  line-height: 1.75;
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

/* ── Call To Action — Floating ── */
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
  inset: -1.5px;
  border-radius: 50%;
  padding: 1.5px;
  background: conic-gradient(from 0deg, rgba(124,111,247,0.1), #7c6ff7, rgba(52,211,153,0.1), #7c6ff7);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  animation: ctaSpin 3s linear infinite;
  z-index: 2;
  pointer-events: none;
}
@keyframes ctaSpin {
  to { transform: rotate(360deg); }
}

.cta-float__inner {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-bg-surface);
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

/* Tooltip Card */
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
