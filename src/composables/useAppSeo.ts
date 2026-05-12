import { useSeoMeta, useHead } from '@unhead/vue'

export interface SeoOptions {
  title: string
  description: string
  url: string
  imageUrl?: string
  author?: string
  publishedAt?: string
  updatedAt?: string
  tags?: string[]
  type?: 'website' | 'article'
  keywords?: string
}

export function useAppSeo(options: SeoOptions) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : import.meta.env.VITE_FRONTEND_URL || ''
  const defaultImage = `${siteUrl}/images/og-cover.jpg`
  const defaultAuthor = 'FinNote'
  const siteName = 'FinNote'
  
  const title = `${options.title} | ${siteName}`
  const description = options.description
  const imageUrl = options.imageUrl || defaultImage
  const authorName = options.author || defaultAuthor
  const type = options.type || 'article'
  
  const keywords = [options.keywords, ...(options.tags || [])]
    .filter(Boolean)
    .join(',')

  try {
    // Standard Vue 3 way to handle SEO meta tags via @unhead/vue
    useSeoMeta({
      title,
      description,
      ogType: type,
      ogUrl: options.url,
      ogTitle: options.title, // raw title for OG
      ogDescription: description,
      ogImage: imageUrl,
      ogSiteName: siteName,
      ...(options.publishedAt ? { articlePublishedTime: options.publishedAt } : {}),
      ...(options.updatedAt ? { articleModifiedTime: options.updatedAt } : {}),
      ...(options.tags?.length ? { articleTag: options.tags } : {}),
      twitterCard: 'summary_large_image',
      twitterTitle: options.title,
      twitterDescription: description,
      twitterImage: imageUrl
    })

    useHead({
      meta: [
        { name: 'keywords', content: keywords }
      ],
      link: [
        { rel: 'canonical', href: options.url }
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': type === 'article' ? 'Article' : 'WebSite',
            headline: options.title,
            description: description,
            image: imageUrl,
            author: { '@type': 'Person', name: authorName },
            publisher: { 
              '@type': 'Organization', 
              name: siteName, 
              logo: { '@type': 'ImageObject', url: `${siteUrl}/images/logo-512.png` }
            },
            ...(options.publishedAt ? { datePublished: options.publishedAt } : {}),
            ...(options.updatedAt ? { dateModified: options.updatedAt } : {}),
            mainEntityOfPage: { '@type': 'WebPage', '@id': options.url },
            keywords: keywords
          })
        }
      ]
    })
  } catch (err) {
    // Fallback when called outside of setup() (e.g., inside onMounted)
    if (typeof document !== 'undefined') {
      document.title = title
      const metaDesc = document.querySelector('meta[name="description"]')
      if (metaDesc) metaDesc.setAttribute('content', description)
    }
  }
}

/**
 * Extracts a plain text excerpt from HTML content for SEO description
 */
export function extractExcerpt(html: string, fallback = 'FinNote'): string {
  if (!html) return fallback
  let text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > 160 ? text.substring(0, 160) + '...' : text || fallback
}

/**
 * Extracts the first image URL from HTML content for SEO og:image
 */
export function extractFirstImage(html: string, fallback?: string): string {
  const finalFallback = fallback || `${typeof window !== 'undefined' ? window.location.origin : ''}/images/og-cover.jpg`
  if (!html) return finalFallback
  // Check for <img> tags
  const imgMatch = html.match(/<img[^>]+src="([^">]+)"/i)
  if (imgMatch && imgMatch[1]) return imgMatch[1]
  // Check for markdown images ![alt](url)
  const mdMatch = html.match(/!\[[^\]]*\]\(([^)]+)\)/)
  if (mdMatch && mdMatch[1]) return mdMatch[1]
  
  return finalFallback
}
