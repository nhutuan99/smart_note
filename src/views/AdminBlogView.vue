<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBlogStore } from '@/stores/blog'
import { useUiStore } from '@/stores/ui'
import { Edit, Trash2, Plus, Sparkles, Image as ImageIcon, CheckCircle2 } from 'lucide-vue-next'
import type { Blog } from '@/types'

const blogStore = useBlogStore()
const uiStore = useUiStore()

const isModalOpen = ref(false)
const isGenerating = ref(false)
const aiTopic = ref('')
const aiImagePrompt = ref('')

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

function openModal() {
  form.value = { title: '', slug: '', excerpt: '', content: '', tags: [], imageUrl: '', published: true }
  aiTopic.value = ''
  aiImagePrompt.value = ''
  isModalOpen.value = true
}

async function handleGenerateAll() {
  if (!aiTopic.value.trim()) {
    uiStore.showToast('warning', 'Vui lòng nhập ý tưởng trước')
    return
  }
  
  isGenerating.value = true
  try {
    uiStore.showToast('info', 'Đang nhờ AI viết bài...')
    const data = await blogStore.generateContent(aiTopic.value)
    if (data) {
      form.value.title = data.title || ''
      form.value.excerpt = data.excerpt || ''
      form.value.content = data.content || ''
      form.value.tags = data.tags || []
      
      const imagePrompt = data.seoKeywords || aiTopic.value
      uiStore.showToast('info', 'Đang tạo ảnh bìa...')
      const imageUrl = await blogStore.generateImage(imagePrompt)
      if (imageUrl) {
        form.value.imageUrl = imageUrl
      }
      
      uiStore.showToast('success', 'Đã tự động tạo xong bài viết!')
    }
  } catch (err: any) {
    uiStore.showToast('error', 'Lỗi: ' + err.message)
  } finally {
    isGenerating.value = false
  }
}

async function handleSave() {
  if (!form.value.title || !form.value.content) {
    uiStore.showToast('error', 'Vui lòng nhập đủ tiêu đề và nội dung')
    return
  }
  
  try {
    isGenerating.value = true
    if (form.value.slug && blogStore.blogs.some(b => b.slug === form.value.slug)) {
      // update - although in this simple UI we just create new ones usually.
      // Assuming slug is readonly for updates in this simple version, but if it exists, maybe update?
      // Actually we didn't implement edit fully, just create. Let's do create only for now.
      await blogStore.createBlog(form.value)
    } else {
      await blogStore.createBlog(form.value)
    }
    uiStore.showToast('success', 'Đã xuất bản bài viết!')
    isModalOpen.value = false
  } catch (err: any) {
    uiStore.showToast('error', 'Lỗi khi lưu bài: ' + err.message)
  } finally {
    isGenerating.value = false
  }
}

async function handleDelete(slug: string) {
  if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return
  try {
    await blogStore.deleteBlog(slug)
    uiStore.showToast('success', 'Đã xóa bài viết')
  } catch (err: any) {
    uiStore.showToast('error', 'Lỗi khi xóa bài: ' + err.message)
  }
}
</script>

<template>
  <div class="max-w-[64rem] mx-auto pb-12">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight mb-2">Quản Lý Blog</h1>
        <p class="text-text-tertiary">Trang nội bộ dành cho Admin FinNote</p>
      </div>
      <button class="btn-primary" @click="openModal">
        <Plus :size="16" /> Bài viết mới
      </button>
    </div>

    <!-- Blog List Table -->
    <div class="card-premium overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-bg-elevated text-text-tertiary">
          <tr>
            <th class="px-6 py-4 font-medium">Tiêu đề</th>
            <th class="px-6 py-4 font-medium w-32">Trạng thái</th>
            <th class="px-6 py-4 font-medium w-40">Ngày tạo</th>
            <th class="px-6 py-4 font-medium w-24 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-subtle">
          <tr v-if="blogStore.isLoading && !blogStore.blogs.length">
            <td colspan="4" class="px-6 py-8 text-center text-text-disabled">Đang tải...</td>
          </tr>
          <tr v-else-if="!blogStore.blogs.length">
            <td colspan="4" class="px-6 py-8 text-center text-text-disabled">Chưa có bài viết nào.</td>
          </tr>
          <tr v-for="blog in blogStore.blogs" :key="blog.id" class="hover:bg-bg-hover/50 transition-colors">
            <td class="px-6 py-4 font-medium">
              <div class="line-clamp-1">{{ blog.title }}</div>
              <div class="text-[0.6875rem] text-text-disabled mt-1">/blog/{{ blog.slug }}</div>
            </td>
            <td class="px-6 py-4">
              <span v-if="blog.published" class="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-success bg-success/10 px-2 py-1 rounded-md">
                <CheckCircle2 :size="12" /> Đã đăng
              </span>
              <span v-else class="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-warning bg-warning/10 px-2 py-1 rounded-md">
                Nháp
              </span>
            </td>
            <td class="px-6 py-4 text-text-tertiary">
              {{ new Date(blog.createdAt).toLocaleDateString('vi-VN') }}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button class="text-text-tertiary hover:text-error transition-colors p-1" @click="handleDelete(blog.slug)">
                  <Trash2 :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/AI Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="card-premium w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border-border-default">
        <!-- Header -->
        <div class="flex items-center justify-between p-5 border-b border-border-subtle shrink-0">
          <h2 class="text-lg font-bold flex items-center gap-2">
            <Sparkles :size="18" class="text-accent" /> Soạn bài viết bằng AI
          </h2>
          <button class="text-text-disabled hover:text-text-primary" @click="isModalOpen = false">Đóng</button>
        </div>

        <!-- Body -->
        <div class="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          
          <!-- AI Generation Section -->
          <div class="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-xl p-6 space-y-4">
            <h3 class="text-sm font-semibold text-accent flex items-center gap-2 mb-2"><Sparkles :size="16" /> Tự động hóa bằng AI</h3>
            <div class="flex flex-col md:flex-row gap-3 items-end">
              <div class="flex-1 w-full">
                <label class="block text-[0.6875rem] text-text-secondary mb-1 uppercase font-semibold tracking-wide">Bạn muốn viết về gì?</label>
                <input v-model="aiTopic" type="text" class="input-modern w-full text-base py-3" placeholder="VD: Mẹo tiết kiệm 10 triệu/tháng với FinNote..." :disabled="isGenerating" @keyup.enter="handleGenerateAll" />
              </div>
              <button class="btn-primary py-3 px-6 h-[46px] whitespace-nowrap shadow-lg shadow-accent/20 hover:shadow-accent/40" @click="handleGenerateAll" :disabled="isGenerating || !aiTopic.trim()">
                <Sparkles v-if="!isGenerating" :size="16" />
                <span v-if="isGenerating" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                {{ isGenerating ? 'AI đang làm việc...' : 'Tự Động Viết Bài' }}
              </button>
            </div>
            <p class="text-[0.6875rem] text-text-tertiary">Chỉ cần 1 click, AI sẽ tự viết nội dung, làm chuẩn SEO và tạo luôn ảnh bìa cho bạn.</p>
          </div>

          <!-- Form Fields (Collapsible or just separated) -->
          <div class="mt-8 border-t border-border-subtle pt-6">
            <h3 class="text-sm font-semibold text-text-secondary mb-4">Chi tiết bài viết (Có thể tự sửa)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <label class="block text-sm text-text-secondary mb-1">Tiêu đề (Tạo tự động Slug)</label>
              <input v-model="form.title" type="text" class="input-modern w-full" />
            </div>
            
            <div>
              <label class="block text-sm text-text-secondary mb-1">Ảnh Cover (Base64/URL)</label>
              <div class="flex gap-4">
                <input v-model="form.imageUrl" type="text" class="input-modern w-full" />
                <div v-if="form.imageUrl" class="w-10 h-10 shrink-0 rounded overflow-hidden bg-bg-elevated border border-border-subtle">
                  <img :src="form.imageUrl" class="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm text-text-secondary mb-1">Đoạn trích (Excerpt - Tốt cho SEO)</label>
              <textarea v-model="form.excerpt" rows="2" class="input-modern w-full resize-none text-sm"></textarea>
            </div>

            <div>
              <label class="block text-[0.6875rem] font-medium text-text-secondary mb-1">Nội dung bài (Markdown)</label>
              <textarea v-model="form.content" rows="12" class="input-modern w-full font-mono text-sm leading-relaxed p-4 bg-bg-elevated/50 border-border-default hover:border-border-hover focus:border-accent transition-colors"></textarea>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-border-subtle flex items-center justify-end gap-3 shrink-0 bg-bg-surface rounded-b-xl">
          <button class="btn-secondary" @click="isModalOpen = false">Hủy</button>
          <button class="btn-primary" @click="handleSave" :disabled="isGenerating">
            <CheckCircle2 :size="16" /> Xuất Bản Blog
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
