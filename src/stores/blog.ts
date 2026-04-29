import { defineStore } from 'pinia'
import { ref } from 'vue'
import { httpClient } from '@/shared/api/httpClient'
import type { Blog } from '@/types'

export const useBlogStore = defineStore('blog', () => {
  const blogs = ref<Blog[]>([])
  const currentBlog = ref<Blog | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchBlogs() {
    isLoading.value = true
    error.value = null
    try {
      const response = await httpClient.get<{ data: Blog[] }>('/api/blogs')
      if (response && response.data) {
        blogs.value = response.data
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch blogs'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchBlogBySlug(slug: string) {
    isLoading.value = true
    error.value = null
    try {
      const response = await httpClient.get<{ data: Blog }>(`/api/blogs/${slug}`)
      if (response && response.data) {
        currentBlog.value = response.data
        return response.data
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch blog'
    } finally {
      isLoading.value = false
    }
    return null
  }

  // Admin Methods
  async function createBlog(data: Partial<Blog>) {
    const response = await httpClient.post<{ data: Blog }>('/api/blogs', data)
    if (response && response.data) {
      blogs.value.unshift(response.data)
      return response.data
    }
    return null
  }

  async function updateBlog(slug: string, data: Partial<Blog>) {
    const response = await httpClient.put<{ data: Blog }>(`/api/blogs/${slug}`, data)
    if (response && response.data) {
      const index = blogs.value.findIndex((b) => b.slug === slug)
      if (index !== -1) {
        blogs.value[index] = response.data
      }
      if (currentBlog.value?.slug === slug) {
        currentBlog.value = response.data
      }
      return response.data
    }
    return null
  }

  async function deleteBlog(slug: string) {
    await httpClient.del(`/api/blogs/${slug}`)
    blogs.value = blogs.value.filter((b) => b.slug !== slug)
    if (currentBlog.value?.slug === slug) {
      currentBlog.value = null
    }
  }

  async function generateContent(topic: string, imageBase64?: string) {
    const response = await httpClient.post<any>('/api/blogs/generate-content', { topic, imageBase64 })
    return response
  }

  async function generateImage(prompt: string) {
    const response = await httpClient.post<{ imageUrl: string }>('/api/blogs/generate-image', { prompt })
    return response?.imageUrl
  }

  return {
    blogs,
    currentBlog,
    isLoading,
    error,
    fetchBlogs,
    fetchBlogBySlug,
    createBlog,
    updateBlog,
    deleteBlog,
    generateContent,
    generateImage
  }
})
