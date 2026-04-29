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
    <article v-else-if="blogStore.currentBlog" class="blog-article bg-bg-surface border border-border-default rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
      <!-- Decorator glow -->
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <!-- Header -->
      <header class="mb-10 relative z-10">
        <div class="flex flex-wrap items-center gap-2 mb-6">
          <span v-for="tag in blogStore.currentBlog.tags" :key="tag" class="text-[0.75rem] font-bold tracking-wider uppercase text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Hash :size="12" /> {{ tag }}
          </span>
        </div>
        
        <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 leading-[1.15] text-text-primary">
          {{ blogStore.currentBlog.title }}
        </h1>
        
        <div class="flex items-center gap-4 text-[0.875rem] text-text-secondary bg-bg-elevated/50 p-4 rounded-2xl border border-border-subtle inline-flex">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <UserIcon :size="16" />
            </div>
            <div class="flex flex-col">
              <span class="font-semibold text-text-primary">{{ blogStore.currentBlog.author.name }}</span>
              <span class="text-[0.6875rem] text-text-tertiary">Biên tập viên FinNote</span>
            </div>
          </div>
          <div class="w-px h-8 bg-border-default mx-2"></div>
          <div class="flex items-center gap-2">
            <Calendar :size="16" class="text-text-tertiary" />
            <span class="font-medium">{{ formatDate(blogStore.currentBlog.createdAt) }}</span>
          </div>
        </div>
      </header>

      <!-- Cover Image -->
      <figure v-if="blogStore.currentBlog.imageUrl" class="mb-12 rounded-2xl overflow-hidden border border-border-default shadow-xl relative group">
        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <img :src="blogStore.currentBlog.imageUrl" :alt="blogStore.currentBlog.title" class="w-full h-auto object-cover max-h-[450px] transform group-hover:scale-[1.02] transition-transform duration-700" />
      </figure>

      <!-- Markdown Content -->
      <div class="prose prose-invert prose-emerald max-w-none 
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-text-primary prose-h2:border-b prose-h2:border-border-subtle prose-h2:pb-2
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                  prose-p:text-[1.0625rem] prose-p:leading-relaxed prose-p:text-text-secondary prose-p:mb-6
                  prose-a:text-accent hover:prose-a:text-accent-hover prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-2xl prose-img:border prose-img:border-border-default prose-img:shadow-lg
                  prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:bg-accent-subtle/20 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:font-medium prose-blockquote:italic prose-blockquote:text-text-primary
                  prose-ul:text-text-secondary prose-li:my-2
                  prose-strong:text-text-primary prose-strong:font-bold" 
           v-html="contentHtml"></div>
    </article>
  </div>
</template>

<style scoped>
/* Additional specific styling for the markdown body */
.blog-article :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
}
.blog-article :deep(ol) {
  list-style-type: decimal;
  padding-left: 1.5rem;
}
</style>
