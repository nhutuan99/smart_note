<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { httpClient } from '@/shared/api/httpClient'
import { useRouter, useRoute } from 'vue-router'
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight, KeyRound, RotateCcw, CheckCircle2, ChevronLeft, ShieldCheck } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

// ── Login / Register ──────────────────────────────────────────────────────────
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
      ui.showToast('success', `${t(isLogin.value ? 'login.welcomeBack' : 'common.confirm')}, ${result.user.name}!`)
      router.push('/')
    }
  } catch (err: any) {
    error.value = err.message || 'Something went wrong'
    ui.showToast('error', error.value)
  } finally {
    loading.value = false
  }
}

// ── Forgot Password Flow (Google OAuth Verification) ──────────────────────────
// step: 'login' | 'email' | 'google-pending' | 'newpass' | 'done'
const fpStep = ref<'login' | 'email' | 'google-pending' | 'newpass' | 'done'>('login')
const fpEmail = ref('')
const fpResetToken = ref('')
const fpNewPass = ref('')
const fpConfirmPass = ref('')
const fpNewPin = ref('')
const fpConfirmPin = ref('')
const fpShowNew = ref(false)
const fpShowConfirm = ref(false)
const fpShowNewPin = ref(false)
const fpShowConfirmPin = ref(false)
const fpLoading = ref(false)
const fpError = ref('')

function goForgot() {
  fpStep.value = 'email'
  fpEmail.value = ''
  fpResetToken.value = ''
  fpNewPass.value = ''
  fpConfirmPass.value = ''
  fpError.value = ''
}

function goBack() {
  fpError.value = ''
  if (fpStep.value === 'email') fpStep.value = 'login'
  else if (fpStep.value === 'google-pending') fpStep.value = 'email'
  else if (fpStep.value === 'newpass') fpStep.value = 'email'
  else fpStep.value = 'login'
}

/** Get the redirect URI for Google OAuth (current page URL without query params) */
function getRedirectUri(): string {
  return `${window.location.origin}/login`
}

/** Step 1: Request Google OAuth URL from backend, then redirect user to Google */
async function requestGoogleOAuth() {
  if (!fpEmail.value) return
  fpLoading.value = true
  fpError.value = ''
  try {
    const res = await httpClient.post<{ url: string }>('/api/auth/google-oauth-url', {
      email: fpEmail.value,
      redirectUri: getRedirectUri()
    })
    if (res?.url) {
      // Save email to sessionStorage so we can use it after redirect back
      sessionStorage.setItem('fp_email', fpEmail.value)
      // Redirect to Google OAuth
      window.location.href = res.url
    }
  } catch (err: any) {
    fpError.value = err.message || t('forgot.googleVerifyFailed')
  } finally {
    fpLoading.value = false
  }
}

/** Step 2: Handle Google OAuth callback — exchange code for resetToken */
async function handleOAuthCallback(code: string, state: string) {
  fpStep.value = 'google-pending'
  fpLoading.value = true
  fpError.value = ''
  fpEmail.value = sessionStorage.getItem('fp_email') || ''

  try {
    const res = await httpClient.post<{ resetToken: string; email: string }>('/api/auth/google-verify', {
      code,
      state,
      redirectUri: getRedirectUri()
    })
    if (res?.resetToken) {
      fpResetToken.value = res.resetToken
      fpEmail.value = res.email
      fpStep.value = 'newpass'
      ui.showToast('success', t('forgot.googleVerified'))
    }
  } catch (err: any) {
    fpError.value = err.message || t('forgot.googleVerifyFailed')
  } finally {
    fpLoading.value = false
    sessionStorage.removeItem('fp_email')
    // Clean URL params without reload
    window.history.replaceState({}, '', '/login')
  }
}

/** Step 3: Set new password and PIN */
async function resetPassword() {
  fpError.value = ''
  if (fpNewPass.value.length < 6) {
    fpError.value = t('forgot.passMinLength')
    return
  }
  if (fpNewPass.value !== fpConfirmPass.value) {
    fpError.value = t('forgot.passMismatch')
    return
  }
  if (!fpNewPin.value || fpNewPin.value.length < 4 || fpNewPin.value.length > 6 || !/^\d+$/.test(fpNewPin.value)) {
    fpError.value = 'Mã PIN phải từ 4-6 chữ số'
    return
  }
  if (fpNewPin.value !== fpConfirmPin.value) {
    fpError.value = 'Mã PIN không khớp'
    return
  }
  
  fpLoading.value = true
  try {
    await httpClient.post('/api/auth/reset-password', {
      email: fpEmail.value,
      resetToken: fpResetToken.value,
      newPassword: fpNewPass.value,
      newPin: fpNewPin.value
    })
    fpStep.value = 'done'
    ui.showToast('success', t('forgot.resetSuccess'))
  } catch (err: any) {
    fpError.value = err.message || 'Đặt lại mật khẩu thất bại'
  } finally {
    fpLoading.value = false
  }
}

function backToLoginFromDone() {
  fpStep.value = 'login'
  isLogin.value = true
}

// ── Handle OAuth callback on page load ──
watch(
  () => route.query,
  (query) => {
    const code = query.code as string
    const state = query.state as string
    if (code && state && fpStep.value === 'login') {
      handleOAuthCallback(code, state)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="bg-bg-primary relative flex min-h-screen items-center justify-center overflow-hidden">
    <!-- Background grid -->
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
        <div class="bg-bg-elevated mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-border-default shadow-sm">
          <Sparkles :size="28" class="text-accent" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight">Smart Note</h1>
      </div>

      <!-- ══ STEP: LOGIN / REGISTER ══ -->
      <div v-if="fpStep === 'login'" class="bg-bg-surface border-border-default rounded-2xl border p-6 shadow-lg md:p-8">
        <div class="mb-6">
          <h2 class="mb-1 text-xl font-semibold">
            {{ isLogin ? t('login.welcomeBack') : t('login.createAccount') }}
          </h2>
          <p class="text-text-tertiary text-sm">
            {{ isLogin ? t('login.signInDesc') : t('login.signUpDesc') }}
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
          <!-- Name -->
          <transition name="slide">
            <div v-if="!isLogin" class="flex flex-col gap-2">
              <label for="name-input" class="text-text-secondary text-sm font-medium">{{ t('login.name') }}</label>
              <div class="relative flex items-center">
                <User :size="16" class="text-text-tertiary pointer-events-none absolute left-3" />
                <input
                  id="name-input"
                  v-model="form.name"
                  type="text"
                  :placeholder="t('login.namePlaceholder')"
                  autocomplete="name"
                  class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border py-2.5 pr-3 pl-[2.375rem] text-sm transition-all duration-150 focus:ring-2 focus:outline-none"
                />
              </div>
            </div>
          </transition>

          <!-- Email -->
          <div class="flex flex-col gap-2">
            <label for="email-input" class="text-text-secondary text-sm font-medium">{{ t('login.email') }}</label>
            <div class="relative flex items-center">
              <Mail :size="16" class="text-text-tertiary pointer-events-none absolute left-3" />
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
            <div class="flex items-center justify-between">
              <label for="password-input" class="text-text-secondary text-sm font-medium">{{ t('login.password') }}</label>
              <button
                v-if="isLogin"
                type="button"
                class="text-accent hover:text-accent-text text-xs transition-colors duration-150"
                @click="goForgot"
              >
                {{ t('login.forgotPassword') }}
              </button>
            </div>
            <div class="relative flex items-center">
              <Lock :size="16" class="text-text-tertiary pointer-events-none absolute left-3" />
              <input
                id="password-input"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="current-password"
                required
                class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border py-2.5 pr-10 pl-[2.375rem] text-sm transition-all duration-150 focus:ring-2 focus:outline-none"
              />
              <button type="button" class="text-text-tertiary hover:text-text-primary absolute right-3 transition-colors duration-150" @click="showPassword = !showPassword">
                <component :is="showPassword ? EyeOff : Eye" :size="16" />
              </button>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="bg-error/10 border-error/20 text-error rounded-lg border px-3 py-3 text-sm">
            {{ error }}
          </div>

          <!-- Submit -->
          <button
            id="submit-btn"
            type="submit"
            :disabled="!isValid || loading"
            class="btn-primary w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="loading" class="h-[1.125rem] w-[1.125rem] animate-spin rounded-full border-2 border-black/20 border-l-black"></span>
            <template v-else>
              <span>{{ isLogin ? t('login.signIn') : t('login.signUp') }}</span>
              <ArrowRight :size="16" />
            </template>
          </button>
        </form>

        <div class="border-border-default text-text-tertiary mt-6 border-t pt-4 text-center text-sm">
          <span>{{ isLogin ? t('login.noAccount') : t('login.hasAccount') }}</span>
          <button class="text-accent hover:text-accent-text ml-1 font-medium transition-colors duration-150" @click="isLogin = !isLogin; error = ''">
            {{ isLogin ? t('login.signUp') : t('login.signIn') }}
          </button>
        </div>
      </div>

      <!-- ══ STEP 1: Enter Email ══ -->
      <div v-else-if="fpStep === 'email'" class="bg-bg-surface border-border-default rounded-2xl border p-6 shadow-lg md:p-8">
        <button @click="goBack" class="text-text-tertiary hover:text-text-primary mb-4 flex items-center gap-1.5 text-sm transition-colors">
          <ChevronLeft :size="16" />
          {{ t('login.backToLogin') }}
        </button>

        <div class="mb-6 flex items-start gap-3">
          <div class="bg-accent/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <KeyRound :size="20" class="text-accent" />
          </div>
          <div>
            <h2 class="mb-0.5 text-xl font-semibold">{{ t('forgot.title') }}</h2>
            <p class="text-text-tertiary text-sm">{{ t('forgot.desc') }}</p>
          </div>
        </div>

        <form @submit.prevent="requestGoogleOAuth()" class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-text-secondary text-sm font-medium">{{ t('login.email') }}</label>
            <div class="relative flex items-center">
              <Mail :size="16" class="text-text-tertiary pointer-events-none absolute left-3" />
              <input
                v-model="fpEmail"
                type="email"
                :placeholder="t('forgot.emailPlaceholder')"
                autocomplete="email"
                required
                class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border py-2.5 pr-3 pl-[2.375rem] text-sm transition-all duration-150 focus:ring-2 focus:outline-none"
              />
            </div>
          </div>

          <!-- Google OAuth info -->
          <div class="bg-accent/5 border-accent/20 rounded-lg border px-3 py-3">
            <div class="flex items-start gap-2">
              <ShieldCheck :size="16" class="text-accent mt-0.5 shrink-0" />
              <p class="text-text-secondary text-xs leading-relaxed">
                {{ t('forgot.googleOAuthHint') }}
              </p>
            </div>
          </div>

          <div v-if="fpError" class="bg-error/10 border-error/20 text-error rounded-lg border px-3 py-3 text-sm">
            {{ fpError }}
          </div>

          <button
            type="submit"
            :disabled="fpLoading || !fpEmail"
            class="btn-primary w-full justify-center py-3 disabled:opacity-50"
          >
            <span v-if="fpLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-l-black"></span>
            <template v-else>
              <!-- Google icon -->
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>{{ t('forgot.verifyWithGoogle') }}</span>
            </template>
          </button>
        </form>
      </div>

      <!-- ══ STEP: Google Pending (loading while exchanging code) ══ -->
      <div v-else-if="fpStep === 'google-pending'" class="bg-bg-surface border-border-default rounded-2xl border p-8 shadow-lg text-center">
        <div class="mb-4 flex justify-center">
          <div class="bg-accent/10 flex h-16 w-16 items-center justify-center rounded-full">
            <ShieldCheck :size="36" class="text-accent" />
          </div>
        </div>

        <template v-if="fpLoading">
          <h2 class="mb-2 text-xl font-bold">{{ t('forgot.googleVerifying') }}</h2>
          <p class="text-text-tertiary mb-6 text-sm">{{ t('forgot.googleVerifyingDesc') }}</p>
          <div class="flex justify-center">
            <span class="h-8 w-8 animate-spin rounded-full border-3 border-accent/20 border-l-accent"></span>
          </div>
        </template>

        <template v-else-if="fpError">
          <h2 class="mb-2 text-xl font-bold text-error">{{ t('forgot.googleVerifyFailed') }}</h2>
          <p class="text-text-tertiary mb-6 text-sm">{{ fpError }}</p>
          <button @click="goForgot" class="btn-primary w-full justify-center py-3">
            <RotateCcw :size="16" />
            <span>{{ t('forgot.tryAgain') }}</span>
          </button>
        </template>
      </div>

      <!-- ══ STEP 3: New Password ══ -->
      <div v-else-if="fpStep === 'newpass'" class="bg-bg-surface border-border-default rounded-2xl border p-6 shadow-lg md:p-8">
        <div class="mb-6 flex items-start gap-3">
          <div class="bg-success/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <Lock :size="20" class="text-success" />
          </div>
          <div>
            <h2 class="mb-0.5 text-xl font-semibold">{{ t('forgot.newPassTitle') }}</h2>
            <p class="text-text-tertiary text-sm">{{ t('forgot.newPassDesc') }}</p>
          </div>
        </div>

        <!-- Verified badge -->
        <div class="bg-success/5 border-success/20 mb-4 flex items-center gap-2 rounded-lg border px-3 py-2.5">
          <CheckCircle2 :size="16" class="text-success shrink-0" />
          <span class="text-success text-xs font-medium">{{ t('forgot.emailVerified', { email: fpEmail }) }}</span>
        </div>

        <form @submit.prevent="resetPassword" class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-text-secondary text-sm font-medium">{{ t('forgot.newPassword') }}</label>
            <div class="relative">
              <Lock :size="16" class="text-text-tertiary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
              <input
                v-model="fpNewPass"
                :type="fpShowNew ? 'text' : 'password'"
                required
                :placeholder="t('forgot.newPassPlaceholder')"
                class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border py-2.5 pr-10 pl-[2.375rem] text-sm transition-all focus:ring-2 focus:outline-none"
              />
              <button type="button" @click="fpShowNew = !fpShowNew" class="text-text-tertiary hover:text-text-primary absolute top-1/2 right-3 -translate-y-1/2">
                <component :is="fpShowNew ? EyeOff : Eye" :size="16" />
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-text-secondary text-sm font-medium">{{ t('forgot.confirmPassword') }}</label>
            <div class="relative">
              <Lock :size="16" class="text-text-tertiary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
              <input
                v-model="fpConfirmPass"
                :type="fpShowConfirm ? 'text' : 'password'"
                required
                :placeholder="t('forgot.confirmPassPlaceholder')"
                class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border py-2.5 pr-10 pl-[2.375rem] text-sm transition-all focus:ring-2 focus:outline-none"
              />
              <button type="button" @click="fpShowConfirm = !fpShowConfirm" class="text-text-tertiary hover:text-text-primary absolute top-1/2 right-3 -translate-y-1/2">
                <component :is="fpShowConfirm ? EyeOff : Eye" :size="16" />
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-2 mt-2">
            <label class="text-text-secondary text-sm font-medium">Mã PIN mới (4-6 số)</label>
            <div class="relative">
              <KeyRound :size="16" class="text-text-tertiary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
              <input
                v-model="fpNewPin"
                :type="fpShowNewPin ? 'text' : 'password'"
                required
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="6"
                placeholder="Nhập mã PIN mới"
                class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border py-2.5 pr-10 pl-[2.375rem] text-sm transition-all focus:ring-2 focus:outline-none"
              />
              <button type="button" @click="fpShowNewPin = !fpShowNewPin" class="text-text-tertiary hover:text-text-primary absolute top-1/2 right-3 -translate-y-1/2">
                <component :is="fpShowNewPin ? EyeOff : Eye" :size="16" />
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-text-secondary text-sm font-medium">Xác nhận mã PIN</label>
            <div class="relative">
              <KeyRound :size="16" class="text-text-tertiary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
              <input
                v-model="fpConfirmPin"
                :type="fpShowConfirmPin ? 'text' : 'password'"
                required
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="6"
                placeholder="Nhập lại mã PIN mới"
                class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border py-2.5 pr-10 pl-[2.375rem] text-sm transition-all focus:ring-2 focus:outline-none"
              />
              <button type="button" @click="fpShowConfirmPin = !fpShowConfirmPin" class="text-text-tertiary hover:text-text-primary absolute top-1/2 right-3 -translate-y-1/2">
                <component :is="fpShowConfirmPin ? EyeOff : Eye" :size="16" />
              </button>
            </div>
          </div>

          <div v-if="fpError" class="bg-error/10 border-error/20 text-error rounded-lg border px-3 py-3 text-sm">
            {{ fpError }}
          </div>

          <button
            type="submit"
            :disabled="fpLoading || !fpNewPass || !fpConfirmPass || !fpNewPin || !fpConfirmPin"
            class="btn-primary w-full justify-center py-3 disabled:opacity-50 mt-2"
          >
            <span v-if="fpLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-l-black"></span>
            <template v-else>
              <span>{{ t('forgot.resetPassword') }}</span>
              <ArrowRight :size="16" />
            </template>
          </button>
        </form>
      </div>

      <!-- ══ DONE ══ -->
      <div v-else-if="fpStep === 'done'" class="bg-bg-surface border-border-default rounded-2xl border p-8 shadow-lg text-center">
        <div class="bg-success/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <CheckCircle2 :size="36" class="text-success" />
        </div>
        <h2 class="mb-2 text-xl font-bold">{{ t('forgot.doneTitle') }}</h2>
        <p class="text-text-tertiary mb-6 text-sm">{{ t('forgot.resetSuccess') }}</p>
        <button @click="backToLoginFromDone" class="btn-primary w-full justify-center py-3">
          <RotateCcw :size="16" />
          <span>{{ t('login.backToLogin') }}</span>
        </button>
      </div>

      <p class="text-text-disabled mt-6 text-center text-[0.6875rem]">
        {{ t('common.version') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
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
