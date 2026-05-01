import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  },
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/FinanceDashboardView.vue')
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('@/views/TransactionsView.vue')
    },
    {
      path: '/transactions/add',
      name: 'add-transaction',
      component: () => import('@/views/AddTransactionView.vue')
    },
    {
      path: '/wallets',
      name: 'wallets',
      component: () => import('@/views/WalletsView.vue')
    },
    {
      path: '/recurring',
      name: 'recurring',
      component: () => import('@/views/RecurringView.vue')
    },
    {
      path: '/budget',
      name: 'budget',
      component: () => import('@/views/BudgetView.vue')
    },
    {
      path: '/savings',
      name: 'savings',
      component: () => import('@/views/SavingsView.vue')
    },
    {
      path: '/subscriptions',
      name: 'subscriptions',
      component: () => import('@/views/SubscriptionsView.vue')
    },
    {
      path: '/planning',
      name: 'planning',
      component: () => import('@/views/PlanningHubView.vue')
    },
    {
      path: '/notes',
      name: 'notes',
      component: () => import('@/views/NotesView.vue')
    },
    {
      path: '/notes/:id',
      name: 'note-detail',
      component: () => import('@/views/NoteDetailView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue')
    },
    {
      path: '/auto-sync',
      name: 'auto-sync',
      component: () => import('@/views/AutoSyncView.vue')
    },
    {
      path: '/blog',
      name: 'blog-list',
      component: () => import('@/views/BlogListView.vue'),
      meta: { isPublic: true }
    },
    {
      path: '/blog/:slug',
      name: 'blog-detail',
      component: () => import('@/views/BlogDetailView.vue'),
      meta: { isPublic: true }
    },
    {
      path: '/admin/blog',
      name: 'admin-blog',
      component: () => import('@/views/AdminBlogView.vue')
    }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  // Guest-only pages (login): redirect authenticated users to dashboard
  if (to.meta.requiresGuest && auth.isAuthenticated) {
    // Allow Google OAuth callback to hit /login even if there is a stale token
    if (to.path === '/login' && to.query.code && to.query.state) {
      return
    }
    return { path: '/', replace: true }
  }

  // Protected pages: redirect unauthenticated users to login
  // This prevents broken pages when user hits browser back after logout/401
  if (!to.meta.requiresGuest && !to.meta.isPublic && to.path !== '/login' && !auth.isAuthenticated) {
    return { path: '/login', replace: true }
  }
})

export default router
