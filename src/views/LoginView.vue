<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { httpClient } from '@/shared/api/httpClient'
import { useRouter } from 'vue-router'
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-vue-next'

const auth = useAuthStore()
const ui = useUiStore()

const router = useRouter()

const isLogin = ref(true)
const loading = ref(false)
const showPassword = ref(false)
const error = ref('')
const form = ref({ email: '', password: '', name: '' })

const isValid = computed(() => {
  if (!form.value.email || !form.value.password) return false
  if (!isLogin.value && !form.value.name) return false
  return true
})

async function handleSubmit() {
  if (!isValid.value || loading.value) return
  loading.value = true
  error.value = ''
  try {
    const endpoint = isLogin.value ? '/api/auth/login' : '/api/auth/register'
    const result = await httpClient.post<{ token: string; user: any }>(endpoint, form.value)
    if (result) {
      auth.setAuth(result.token, result.user)
      ui.showToast('success', `Welcome${isLogin.value ? ' back' : ''}, ${result.user.name}!`)
      router.push('/')
    }
  } catch (err: any) {
    error.value = err.message || 'Something went wrong'
    ui.showToast('error', error.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="bg-bg-primary relative flex min-h-screen items-center justify-center overflow-hidden">
    <!-- Background effects -->
    <div class="pointer-events-none absolute inset-0">
      <div
        class="absolute inset-0"
        style="
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 3.75rem 3.75rem;
        "
      ></div>
    </div>

    <div class="relative z-10 w-full max-w-[25rem] px-6">
      <!-- Logo -->
      <div class="mb-8 text-center">
        <div
          class="bg-accent-subtle text-accent shadow-glow mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
        >
          <Sparkles :size="28" />
        </div>
        <h1 class="mb-1 text-2xl font-bold tracking-tight">SmartNote</h1>
        <p class="text-text-tertiary text-sm">Your personal knowledge hub</p>
      </div>

      <!-- Card -->
      <div class="bg-bg-surface border-border-default rounded-2xl border p-6 shadow-lg md:p-8">
        <div class="mb-6">
          <h2 class="mb-1 text-xl font-semibold">
            {{ isLogin ? 'Welcome back' : 'Create account' }}
          </h2>
          <p class="text-text-tertiary text-sm">
            {{ isLogin ? 'Sign in to continue' : 'Start organizing your thoughts' }}
          </p>
        </div>

        <form
          @submit.prevent="handleSubmit"
          class="flex flex-col gap-4"
        >
          <!-- Name -->
          <transition name="slide">
            <div
              v-if="!isLogin"
              class="flex flex-col gap-2"
            >
              <label
                for="name-input"
                class="text-text-secondary text-sm font-medium"
              >
                Name
              </label>
              <div class="relative flex items-center">
                <User
                  :size="16"
                  class="text-text-tertiary pointer-events-none absolute left-3"
                />
                <input
                  id="name-input"
                  v-model="form.name"
                  type="text"
                  placeholder="Your full name"
                  autocomplete="name"
                  class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border py-2.5 pr-3 pl-[2.375rem] text-sm transition-all duration-150 focus:ring-2 focus:outline-none"
                />
              </div>
            </div>
          </transition>

          <!-- Email -->
          <div class="flex flex-col gap-2">
            <label
              for="email-input"
              class="text-text-secondary text-sm font-medium"
            >
              Email
            </label>
            <div class="relative flex items-center">
              <Mail
                :size="16"
                class="text-text-tertiary pointer-events-none absolute left-3"
              />
              <input
                id="email-input"
                v-model="form.email"
                type="email"
                placeholder="you@example.com"
                autocomplete="email"
                required
                class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border py-2.5 pr-3 pl-[2.375rem] text-sm transition-all duration-150 focus:ring-2 focus:outline-none"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="flex flex-col gap-2">
            <label
              for="password-input"
              class="text-text-secondary text-sm font-medium"
            >
              Password
            </label>
            <div class="relative flex items-center">
              <Lock
                :size="16"
                class="text-text-tertiary pointer-events-none absolute left-3"
              />
              <input
                id="password-input"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="current-password"
                required
                class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border py-2.5 pr-10 pl-[2.375rem] text-sm transition-all duration-150 focus:ring-2 focus:outline-none"
              />
              <button
                type="button"
                class="text-text-tertiary hover:text-text-primary absolute right-3 transition-colors duration-150"
                @click="showPassword = !showPassword"
              >
                <component
                  :is="showPassword ? EyeOff : Eye"
                  :size="16"
                />
              </button>
            </div>
          </div>

          <!-- Error -->
          <div
            v-if="error"
            class="bg-error/10 border-error/20 text-error rounded-lg border px-3 py-3 text-sm"
          >
            {{ error }}
          </div>

          <!-- Submit -->
          <button
            id="submit-btn"
            type="submit"
            :disabled="!isValid || loading"
            class="btn-primary w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              v-if="loading"
              class="h-[1.125rem] w-[1.125rem] animate-spin rounded-full border-2 border-black/20 border-l-black"
            ></span>
            <template v-else>
              <span>{{ isLogin ? 'Sign in' : 'Create account' }}</span>
              <ArrowRight :size="16" />
            </template>
          </button>
        </form>

        <div
          class="border-border-default text-text-tertiary mt-6 border-t pt-4 text-center text-sm"
        >
          <span>{{ isLogin ? "Don't have an account?" : 'Already have an account?' }}</span>
          <button
            class="text-accent hover:text-accent-text ml-1 font-medium transition-colors duration-150"
            @click="isLogin = !isLogin; error = ''"
          >
            {{ isLogin ? 'Sign up' : 'Sign in' }}
          </button>
        </div>
      </div>

      <p class="text-text-disabled mt-6 text-center text-[0.6875rem]">
        SmartNote v1.0.0
      </p>
    </div>
  </div>
</template>

<style>
.slide-enter-active,
.slide-leave-active {
  transition:
    transform 300ms ease,
    opacity 300ms ease;
}
.slide-enter-from {
  opacity: 0;
  transform: translateY(0.75rem);
}
.slide-leave-to {
  opacity: 0;
  transform: translateY(-0.75rem);
}
</style>
