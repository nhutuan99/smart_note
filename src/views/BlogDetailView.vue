<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { marked } from 'marked'
import { ArrowLeft, Calendar, Hash, User as UserIcon } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()

const contentHtml = ref('')

onMounted(async () => {
  const slug = route.params.slug as string
  if (slug) {
    const blog = await blogStore.fetchBlogBySlug(slug)
    if (blog) {
      // Configure marked for security/styling
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
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="max-w-[48rem] mx-auto pb-16">
    <!-- Back Button -->
    <button
      @click="router.push('/blog')"
      class="mb-6 flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors text-sm font-medium"
    >
      <ArrowLeft :size="16" /> Quay lại danh sách
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
      <!-- Header -->
      <header class="mb-8">
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <span v-for="tag in blogStore.currentBlog.tags" :key="tag" class="text-[0.75rem] font-medium text-accent bg-accent-subtle px-2.5 py-1 rounded-md">
            {{ tag }}
          </span>
        </div>
        
        <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
          {{ blogStore.currentBlog.title }}
        </h1>
        
        <div class="flex flex-wrap items-center gap-4 text-[0.875rem] text-text-tertiary">
          <div class="flex items-center gap-1.5">
            <UserIcon :size="16" />
            <span>{{ blogStore.currentBlog.author.name }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <Calendar :size="16" />
            <span>{{ formatDate(blogStore.currentBlog.createdAt) }}</span>
          </div>
        </div>
      </header>

      <!-- Cover Image -->
      <figure v-if="blogStore.currentBlog.imageUrl" class="mb-10 rounded-2xl overflow-hidden border border-border-default shadow-lg">
        <img :src="blogStore.currentBlog.imageUrl" :alt="blogStore.currentBlog.title" class="w-full h-auto object-cover max-h-[400px]" />
      </figure>

      <!-- Markdown Content -->
      <div class="prose prose-invert prose-emerald max-w-none prose-headings:font-bold prose-a:text-accent hover:prose-a:text-accent-hover prose-img:rounded-xl" v-html="contentHtml"></div>
    </article>
  </div>
</template>

<style scoped>
/* Additional specific styling for the markdown body if not fully covered by Tailwind Typography plugin */
.blog-article :deep(h2) {
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
}
.blog-article :deep(h3) {
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
}
.blog-article :deep(p) {
  margin-bottom: 1.25rem;
  line-height: 1.75;
  color: var(--text-secondary);
}
.blog-article :deep(ul), .blog-article :deep(ol) {
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
  color: var(--text-secondary);
}
.blog-article :deep(li) {
  margin-bottom: 0.5rem;
}
.blog-article :deep(strong) {
  color: var(--text-primary);
  font-weight: 600;
}
</style>
