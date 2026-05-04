import { Env } from './types'
import { corsHeaders, errorResponse } from './utils/response'
import { verifyJWT } from './utils/jwt'

import {
  handleRegister,
  handleLogin,
  handleGoogleOAuthUrl,
  handleGoogleVerify,
  handleResetPassword,
  handleGoogleSignIn,
  handleUpdateProfile,
  handleDeleteAccount,
  handleForgotPin,
  handleResetPin,
  handleRefreshToken,
} from './controllers/auth.controller'

import {
  handleTelegramWebhook,
  handleNotificationWebhook,
} from './controllers/webhook.controller'

import {
  handleSmsWebhook,
  handleListNotifications,
  handleMarkAllNotificationsRead,
  handleClearNotifications,
  handleMarkNotificationRead,
} from './controllers/notification.controller'

import {
  handleListNotes,
  handleCreateNote,
  handleGetNote,
  handleUpdateNote,
  handleDeleteNote,
} from './controllers/note.controller'

import {
  handleListWallets,
  handleCreateWallet,
  handleUpdateWallet,
  handleDeleteWallet,
  handleListTransactions,
  handleCreateTransaction,
  handleDeleteTransaction,
  handleGetBudget,
  handleUpdateBudget,
} from './controllers/finance.controller'

import {
  handleCheckPin,
  handleSetPin,
  handleVerifyPin,
  handleListPending,
  handleResolvePending,
} from './controllers/pin.controller'

import {
  handlePushSubscribe,
  handlePushUnsubscribe,
  handlePushTest,
} from './controllers/push.controller'

import {
  handleAiStream,
  handleAi,
  handleAiImage
} from './controllers/ai.controller'

import {
  handleReportBug,
  handleGetLatestSmsLog,
  handleGetWebhookHistory,
} from './controllers/misc.controller'

import {
  handleListBlogs,
  handleGetBlog,
  handleBlogView,
  handleCreateBlog,
  handleUpdateBlog,
  handleDeleteBlog,
  handleGenerateBlogContent,
  handleRefineBlogContent,
  handleGenerateBlogImage,
  handleGetImage,
  handleUploadImage,
} from './controllers/blog.controller'

import {
  handleProxyLocation,
  handleProxyWeather,
  handleProxyExchangeRate,
  handleProxyStockPrice
} from './controllers/proxy.controller'

import {
  handleListStocks,
  handleCreateStock,
  handleUpdateStock,
  handleDeleteStock
} from './controllers/stock.controller'

import { runAutoBlog } from './services/auto-blog.service'


async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname

  try {
    // ── Public Proxy Routes ──
    if (path === '/api/proxy/location' && request.method === 'GET') {
      return handleProxyLocation(request)
    }
    if (path === '/api/proxy/weather' && request.method === 'GET') {
      return handleProxyWeather(request)
    }
    if (path === '/api/proxy/exchange-rate' && request.method === 'GET') {
      return handleProxyExchangeRate(request)
    }
    if (path === '/api/proxy/stock-price' && request.method === 'GET') {
      return handleProxyStockPrice(request, env)
    }

    // Auth routes (no token needed)
      if (path === '/api/auth/register' && request.method === 'POST') {
        return handleRegister(request, env)
      }
      if (path === '/api/auth/login' && request.method === 'POST') {
        return handleLogin(request, env)
      }
      if (path === '/api/auth/google-oauth-url' && request.method === 'POST') {
        return handleGoogleOAuthUrl(request, env)
      }
      if (path === '/api/auth/google-verify' && request.method === 'POST') {
        return handleGoogleVerify(request, env)
      }
      if (path === '/api/auth/reset-password' && request.method === 'POST') {
        return handleResetPassword(request, env)
      }
      if (path === '/api/auth/google-signin' && request.method === 'POST') {
        return handleGoogleSignIn(request, env)
      }
      if (path === '/api/auth/refresh' && request.method === 'POST') {
        return handleRefreshToken(request, env)
      }

      // Webhooks
      if (path === '/api/webhook/telegram' && request.method === 'POST') {
        return handleTelegramWebhook(request, env)
      }
      if (path === '/api/webhook/notification' && request.method === 'POST') {
        return handleNotificationWebhook(request, env)
      }
      if (path === '/api/webhook/sms' && request.method === 'POST') {
        return handleSmsWebhook(request, env)
      }

      // Public Blog Routes
      if (path === '/api/blogs' && request.method === 'GET') {
        return handleListBlogs(request, env)
      }
      const publicBlogMatch = path.match(/^\/api\/blogs\/([^\/]+)$/)
      if (publicBlogMatch && request.method === 'GET') {
        return handleGetBlog(publicBlogMatch[1], env)
      }
      // Blog view tracking (public, no auth needed)
      const blogViewMatch = path.match(/^\/api\/blogs\/([^\/]+)\/view$/)
      if (blogViewMatch && request.method === 'POST') {
        return handleBlogView(blogViewMatch[1], request, env)
      }
      const imageMatch = path.match(/^\/api\/images\/([^\/]+)$/)
      if (imageMatch && request.method === 'GET') {
        return handleGetImage(imageMatch[1], env)
      }

      // Dynamic Sitemap for SEO
      if (path === '/api/sitemap.xml' && request.method === 'GET') {
        const blogsIndex = await env.SMART_NOTE_KV.get('public/blogs/_index', 'json') as { blogs: any[] } | null
        const blogs = (blogsIndex?.blogs || []).filter((b: any) => b.published !== false)
        const siteUrl = 'https://finnote-f4n.pages.dev'

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${siteUrl}/blog</loc>
    <priority>0.9</priority>
    <changefreq>daily</changefreq>
  </url>`

        for (const blog of blogs) {
          const lastmod = blog.updatedAt || blog.createdAt || new Date().toISOString()
          xml += `
  <url>
    <loc>${siteUrl}/blog/${blog.slug}</loc>
    <lastmod>${lastmod.split('T')[0]}</lastmod>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
  </url>`
        }

        xml += '\n</urlset>'

        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600',
            ...corsHeaders(),
          },
        })
      }

      // Protected routes - verify JWT
      const authHeader = request.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401)
      }

      const token = authHeader.substring(7)
      const payload = await verifyJWT(token, env.JWT_SECRET)
      if (!payload) return errorResponse('Invalid token', 401)

      const userId = payload.userId

      // User Profile & Account
      if (path === '/api/auth/profile' && request.method === 'PUT') {
        return handleUpdateProfile(userId, request, env)
      }
      if (path === '/api/auth/delete-account' && request.method === 'POST') {
        return handleDeleteAccount(userId, request, env)
      }

      // Admin Blog Routes
      if (path === '/api/blogs' && request.method === 'POST') {
        return handleCreateBlog(userId, request, env)
      }
      if (path === '/api/blogs/generate-content' && request.method === 'POST') {
        return handleGenerateBlogContent(userId, request, env)
      }
      if (path === '/api/blogs/refine-content' && request.method === 'POST') {
        return handleRefineBlogContent(userId, request, env)
      }
      if (path === '/api/blogs/generate-image' && request.method === 'POST') {
        return handleGenerateBlogImage(userId, request, env)
      }
      if (path === '/api/images' && request.method === 'POST') {
        return handleUploadImage(userId, request, env)
      }
      const adminBlogMatch = path.match(/^\/api\/blogs\/([^\/]+)$/)
      if (adminBlogMatch && request.method === 'PUT') {
        return handleUpdateBlog(userId, adminBlogMatch[1], request, env)
      }
      if (adminBlogMatch && request.method === 'DELETE') {
        return handleDeleteBlog(userId, adminBlogMatch[1], env)
      }

      // Manual Auto-Blog Trigger (admin only)
      if (path === '/api/admin/auto-blog' && request.method === 'POST') {
        // Reuse admin check from blog controller
        const { getJSON: getJ } = await import('./services/kv.service')
        const userProfile = await getJ<{ email: string }>(env.SMART_NOTE_KV, `users/${userId}/profile`)
        if (userProfile?.email !== 'tintphcm@gmail.com') {
          return errorResponse('Forbidden', 403)
        }
        try {
          const result = await runAutoBlog(env)
          return new Response(JSON.stringify({ success: true, message: result }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders() }
          })
        } catch (err: any) {
          return errorResponse(`AutoBlog failed: ${err.message}`, 500)
        }
      }

      // Bug Report
      if (path === '/api/report-bug' && request.method === 'POST') {
        return handleReportBug(userId, request, env)
      }

      // Notes CRUD
      if (path === '/api/notes' && request.method === 'GET') {
        return handleListNotes(userId, env)
      }
      if (path === '/api/notes' && request.method === 'POST') {
        return handleCreateNote(userId, request, env)
      }
      const noteMatch = path.match(/^\/api\/notes\/(.+)$/)
      if (noteMatch) {
        const noteId = noteMatch[1]
        if (request.method === 'GET') return handleGetNote(userId, noteId, env)
        if (request.method === 'PUT') return handleUpdateNote(userId, noteId, request, env)
        if (request.method === 'DELETE') return handleDeleteNote(userId, noteId, env)
      }

      // Live Webhook Logs
      if (path === '/api/webhook/sms/latest' && request.method === 'GET') {
        return handleGetLatestSmsLog(userId, env)
      }
      if (path === '/api/webhook/sms/history' && request.method === 'GET') {
        return handleGetWebhookHistory(userId, env)
      }

      // Finance: Wallets
      if (path === '/api/wallets' && request.method === 'GET') {
        return handleListWallets(userId, env)
      }
      if (path === '/api/wallets' && request.method === 'POST') {
        return handleCreateWallet(userId, request, env)
      }
      const walletMatch = path.match(/^\/api\/wallets\/(.+)$/)
      if (walletMatch) {
        const walletId = walletMatch[1]
        if (request.method === 'PUT') return handleUpdateWallet(userId, walletId, request, env)
        if (request.method === 'DELETE') return handleDeleteWallet(userId, walletId, env)
      }

      // Finance: Transactions
      if (path === '/api/transactions' && request.method === 'GET') {
        return handleListTransactions(userId, env)
      }
      if (path === '/api/transactions' && request.method === 'POST') {
        return handleCreateTransaction(userId, request, env)
      }
      const txMatch = path.match(/^\/api\/transactions\/(.+)$/)
      if (txMatch && request.method === 'DELETE') {
        return handleDeleteTransaction(userId, txMatch[1], env)
      }

      // Finance: Budget
      if (path === '/api/finance/budget' && request.method === 'GET') {
        return handleGetBudget(userId, env)
      }
      if (path === '/api/finance/budget' && request.method === 'PUT') {
        return handleUpdateBudget(userId, request, env)
      }

      // PIN
      if (path === '/api/pin' && request.method === 'GET') {
        return handleCheckPin(userId, env)
      }
      if (path === '/api/pin' && request.method === 'POST') {
        return handleSetPin(userId, request, env)
      }
      if (path === '/api/pin/verify' && request.method === 'POST') {
        return handleVerifyPin(userId, request, env)
      }
      if (path === '/api/pin/forgot' && request.method === 'POST') {
        return handleForgotPin(userId, request, env)
      }
      if (path === '/api/pin/reset' && request.method === 'POST') {
        return handleResetPin(userId, request, env)
      }

      // Notifications
      if (path === '/api/notifications' && request.method === 'GET') {
        return handleListNotifications(userId, env)
      }
      if (path === '/api/notifications/read-all' && request.method === 'POST') {
        return handleMarkAllNotificationsRead(userId, env)
      }
      if (path === '/api/notifications' && request.method === 'DELETE') {
        return handleClearNotifications(userId, env)
      }
      const notiReadMatch = path.match(/^\/api\/notifications\/(.+)\/read$/)
      if (notiReadMatch && request.method === 'POST') {
        return handleMarkNotificationRead(userId, notiReadMatch[1], env)
      }

      // Pending notifications
      if (path === '/api/pending' && request.method === 'GET') {
        return handleListPending(userId, env)
      }
      const pendingMatch = path.match(/^\/api\/pending\/(.+)\/resolve$/)
      if (pendingMatch && request.method === 'POST') {
        return handleResolvePending(userId, pendingMatch[1], env)
      }

      // Stocks
      if (path === '/api/stocks' && request.method === 'GET') {
        return handleListStocks(userId, env)
      }
      if (path === '/api/stocks' && request.method === 'POST') {
        return handleCreateStock(userId, request, env)
      }
      const stockMatch = path.match(/^\/api\/stocks\/(.+)$/)
      if (stockMatch) {
        const stockId = stockMatch[1]
        if (request.method === 'PUT') return handleUpdateStock(userId, stockId, request, env)
        if (request.method === 'DELETE') return handleDeleteStock(userId, stockId, env)
      }

      // Push Notifications
      if (path === '/api/push/subscribe' && request.method === 'POST') {
        return handlePushSubscribe(userId, request, env)
      }
      if (path === '/api/push/unsubscribe' && request.method === 'POST') {
        return handlePushUnsubscribe(userId, request, env)
      }
      if (path === '/api/push/test' && request.method === 'POST') {
        return handlePushTest(userId, request, env)
      }

      // AI
      if (path === '/api/ai/stream' && request.method === 'POST') {
        return handleAiStream(request, env)
      }
      if (path === '/api/ai' && request.method === 'POST') {
        return handleAi(request, env)
      }
      if (path === '/api/ai/image' && request.method === 'POST') {
        return handleAiImage(request, env)
      }

      return errorResponse('Not found', 404)
    } catch (err: any) {
    console.error('[Worker Error]', err)
    return errorResponse(err.message || 'Internal server error', 500)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestOrigin = request.headers.get('Origin')

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(requestOrigin) })
    }

    const response = await handleRequest(request, env)

    // ── Global CORS Wrapper ──
    // Ensures every response from the worker gets the correct dynamic CORS header
    // rather than the default ALLOWED_ORIGINS[0] that jsonResponse provides.
    const finalHeaders = new Headers(response.headers)
    const cors = corsHeaders(requestOrigin)
    for (const [key, value] of Object.entries(cors)) {
      finalHeaders.set(key, value as string)
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: finalHeaders
    })
  },

  // ── Cloudflare Cron Trigger ──
  // Runs daily at 2:00 UTC (= 9:00 AM Vietnam time, UTC+7)
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runAutoBlog(env)
        .then(result => console.log(`[Cron] AutoBlog completed: ${result}`))
        .catch(err => console.error('[Cron] AutoBlog failed:', err))
    )
  }
}
