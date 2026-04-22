import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
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
    }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  // Only guard: redirect authenticated users away from /login
  if (to.meta.requiresGuest && auth.isAuthenticated) {
    // Allow Google OAuth callback to hit /login even if there is a stale token
    if (to.path === '/login' && to.query.code && to.query.state) {
      return
    }
    return '/'
  }
})

export default router
