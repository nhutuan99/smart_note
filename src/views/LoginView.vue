<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { httpClient } from '@/shared/api/httpClient'
import { useRouter } from 'vue-router'
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight, KeyRound, RotateCcw, CheckCircle2, ChevronLeft } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const { t } = useI18n()

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

// ── Forgot Password Flow ──────────────────────────────────────────────────────
// step: 'login' | 'email' | 'otp' | 'newpass' | 'done'
const fpStep = ref<'login' | 'email' | 'otp' | 'newpass' | 'done'>('login')
const fpEmail = ref('')
const fpOtp = ref('')
const fpResetToken = ref('')
const fpNewPass = ref('')
const fpConfirmPass = ref('')
const fpShowNew = ref(false)
const fpShowConfirm = ref(false)
const fpLoading = ref(false)
const fpError = ref('')
const resendCountdown = ref(0)
let resendTimer: ReturnType<typeof setInterval> | null = null

function startResendCountdown() {
  resendCountdown.value = 60
  resendTimer = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0 && resendTimer) {
      clearInterval(resendTimer)
      resendTimer = null
    }
  }, 1000)
}

function goForgot() {
  fpStep.value = 'email'
  fpEmail.value = ''
  fpOtp.value = ''
  fpResetToken.value = ''
  fpNewPass.value = ''
  fpConfirmPass.value = ''
  fpError.value = ''
}

function goBack() {
  if (fpStep.value === 'email') {
    fpStep.value = 'login'
  } else if (fpStep.value === 'otp') {
    fpStep.value = 'email'
  } else if (fpStep.value === 'newpass') {
    fpStep.value = 'otp'
  } else {
    fpStep.value = 'login'
  }
  fpError.value = ''
}

async function sendOtp(isResend = false) {
  if (!fpEmail.value) return
  fpLoading.value = true
  fpError.value = ''
  try {
    await httpClient.post('/api/auth/forgot-password', { email: fpEmail.value })
    fpStep.value = 'otp'
    startResendCountdown()
    if (isResend) ui.showToast('success', t('forgot.otpSent'))
  } catch (err: any) {
    fpError.value = err.message || 'Email không tồn tại trong hệ thống'
  } finally {
    fpLoading.value = false
  }
}

async function verifyOtp() {
  if (!fpOtp.value || fpOtp.value.length !== 6) {
    fpError.value = t('forgot.invalidOtp')
    return
  }
  fpLoading.value = true
  fpError.value = ''
  try {
    const res = await httpClient.post<{ resetToken: string }>('/api/auth/verify-otp', {
      email: fpEmail.value,
      otp: fpOtp.value
    })
    fpResetToken.value = res?.resetToken || ''
    fpStep.value = 'newpass'
  } catch (err: any) {
    fpError.value = err.message || t('forgot.invalidOtp')
  } finally {
    fpLoading.value = false
  }
}

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
  fpLoading.value = true
  try {
    await httpClient.post('/api/auth/reset-password', {
      email: fpEmail.value,
      resetToken: fpResetToken.value,
      newPassword: fpNewPass.value
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
        <div
          class="bg-bg-elevated mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-border-default shadow-sm"
        >
          <Sparkles :size="28" class="text-accent" />
        </div>
        <h1 class="mb-1 text-2xl font-bold tracking-tight">Smart Note</h1>
        <p class="text-text-tertiary text-sm">{{ t('login.tagline') }}</p>
      </div>

      <!-- ══════════ LOGIN / REGISTER ══════════ -->
      <Transition name="fade-slide" mode="out-in">
        <div v-if="fpStep === 'login'" key="login" class="bg-bg-surface border-border-default rounded-2xl border p-6 shadow-lg md:p-8">
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
                <label for="name-input" class="text-text-secondary text-sm font-medium">
                  {{ t('login.name') }}
                </label>
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
              <label for="email-input" class="text-text-secondary text-sm font-medium">
                {{ t('login.email') }}
              </label>
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
                <label for="password-input" class="text-text-secondary text-sm font-medium">
                  {{ t('login.password') }}
                </label>
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
                <button
                  type="button"
                  class="text-text-tertiary hover:text-text-primary absolute right-3 transition-colors duration-150"
                  @click="showPassword = !showPassword"
                >
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
            <button
              class="text-accent hover:text-accent-text ml-1 font-medium transition-colors duration-150"
              @click="isLogin = !isLogin; error = ''"
            >
              {{ isLogin ? t('login.signUp') : t('login.signIn') }}
            </button>
          </div>
        </div>

        <!-- ══════════ STEP 1: Enter Email ══════════ -->
        <div v-else-if="fpStep === 'email'" key="fp-email" class="bg-bg-surface border-border-default rounded-2xl border p-6 shadow-lg md:p-8">
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

          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-text-secondary text-sm font-medium">{{ t('login.email') }}</label>
              <div class="relative flex items-center">
                <Mail :size="16" class="text-text-tertiary pointer-events-none absolute left-3" />
                <input
                  v-model="fpEmail"
                  type="email"
                  :placeholder="t('forgot.emailPlaceholder')"
                  autocomplete="email"
                  @keyup.enter="sendOtp()"
                  class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border py-2.5 pr-3 pl-[2.375rem] text-sm transition-all duration-150 focus:ring-2 focus:outline-none"
                />
              </div>
            </div>

            <div v-if="fpError" class="bg-error/10 border-error/20 text-error rounded-lg border px-3 py-3 text-sm">
              {{ fpError }}
            </div>

            <button
              @click="sendOtp()"
              :disabled="fpLoading || !fpEmail"
              class="btn-primary w-full justify-center py-3 disabled:opacity-50"
            >
              <span v-if="fpLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-l-black"></span>
              <template v-else>
                <span>{{ t('forgot.sendOtp') }}</span>
                <ArrowRight :size="16" />
              </template>
            </button>
          </div>
        </div>

        <!-- ══════════ STEP 2: Enter OTP ══════════ -->
        <div v-else-if="fpStep === 'otp'" key="fp-otp" class="bg-bg-surface border-border-default rounded-2xl border p-6 shadow-lg md:p-8">
          <button @click="goBack" class="text-text-tertiary hover:text-text-primary mb-4 flex items-center gap-1.5 text-sm transition-colors">
            <ChevronLeft :size="16" />
            {{ t('login.backToLogin') }}
          </button>

          <div class="mb-6 flex items-start gap-3">
            <div class="bg-warning/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Mail :size="20" class="text-warning" />
            </div>
            <div>
              <h2 class="mb-0.5 text-xl font-semibold">{{ t('forgot.otpTitle') }}</h2>
              <p class="text-text-tertiary text-sm">
                {{ t('forgot.otpDesc').replace('{email}', fpEmail) }}
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-text-secondary text-sm font-medium">OTP</label>
              <input
                v-model="fpOtp"
                type="text"
                inputmode="numeric"
                maxlength="6"
                :placeholder="t('forgot.otpPlaceholder')"
                @keyup.enter="verifyOtp"
                class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border px-4 py-3 text-center text-2xl font-bold tracking-[0.5rem] transition-all duration-150 focus:ring-2 focus:outline-none"
                :class="{ 'border-error': fpError }"
              />
            </div>

            <div v-if="fpError" class="bg-error/10 border-error/20 text-error rounded-lg border px-3 py-3 text-sm">
              {{ fpError }}
            </div>

            <button
              @click="verifyOtp"
              :disabled="fpLoading || fpOtp.length !== 6"
              class="btn-primary w-full justify-center py-3 disabled:opacity-50"
            >
              <span v-if="fpLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-l-black"></span>
              <template v-else>
                <span>{{ t('forgot.verifyOtp') }}</span>
                <ArrowRight :size="16" />
              </template>
            </button>

            <!-- Resend -->
            <div class="text-center text-sm">
              <span class="text-text-tertiary">Không nhận được mã? </span>
              <button
                v-if="resendCountdown <= 0"
                @click="sendOtp(true)"
                :disabled="fpLoading"
                class="text-accent hover:text-accent-text font-medium transition-colors"
              >
                {{ t('forgot.resend') }}
              </button>
              <span v-else class="text-text-disabled">
                {{ t('forgot.resendIn').replace('{s}', String(resendCountdown)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- ══════════ STEP 3: New Password ══════════ -->
        <div v-else-if="fpStep === 'newpass'" key="fp-newpass" class="bg-bg-surface border-border-default rounded-2xl border p-6 shadow-lg md:p-8">
          <div class="mb-6 flex items-start gap-3">
            <div class="bg-success/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Lock :size="20" class="text-success" />
            </div>
            <div>
              <h2 class="mb-0.5 text-xl font-semibold">{{ t('forgot.newPassTitle') }}</h2>
              <p class="text-text-tertiary text-sm">{{ t('forgot.newPassDesc') }}</p>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <!-- New password -->
            <div class="flex flex-col gap-2">
              <label class="text-text-secondary text-sm font-medium">{{ t('forgot.newPassword') }}</label>
              <div class="relative">
                <Lock :size="16" class="text-text-tertiary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
                <input
                  v-model="fpNewPass"
                  :type="fpShowNew ? 'text' : 'password'"
                  :placeholder="t('forgot.newPassPlaceholder')"
                  class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border py-2.5 pr-10 pl-[2.375rem] text-sm transition-all focus:ring-2 focus:outline-none"
                />
                <button type="button" @click="fpShowNew = !fpShowNew" class="text-text-tertiary hover:text-text-primary absolute top-1/2 right-3 -translate-y-1/2">
                  <component :is="fpShowNew ? EyeOff : Eye" :size="16" />
                </button>
              </div>
            </div>

            <!-- Confirm password -->
            <div class="flex flex-col gap-2">
              <label class="text-text-secondary text-sm font-medium">{{ t('forgot.confirmPassword') }}</label>
              <div class="relative">
                <Lock :size="16" class="text-text-tertiary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
                <input
                  v-model="fpConfirmPass"
                  :type="fpShowConfirm ? 'text' : 'password'"
                  :placeholder="t('forgot.confirmPassPlaceholder')"
                  @keyup.enter="resetPassword"
                  class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border py-2.5 pr-10 pl-[2.375rem] text-sm transition-all focus:ring-2 focus:outline-none"
                />
                <button type="button" @click="fpShowConfirm = !fpShowConfirm" class="text-text-tertiary hover:text-text-primary absolute top-1/2 right-3 -translate-y-1/2">
                  <component :is="fpShowConfirm ? EyeOff : Eye" :size="16" />
                </button>
              </div>
            </div>

            <div v-if="fpError" class="bg-error/10 border-error/20 text-error rounded-lg border px-3 py-3 text-sm">
              {{ fpError }}
            </div>

            <button
              @click="resetPassword"
              :disabled="fpLoading || !fpNewPass || !fpConfirmPass"
              class="btn-primary w-full justify-center py-3 disabled:opacity-50"
            >
              <span v-if="fpLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-l-black"></span>
              <template v-else>
                <span>{{ t('forgot.resetPassword') }}</span>
                <ArrowRight :size="16" />
              </template>
            </button>
          </div>
        </div>

        <!-- ══════════ DONE ══════════ -->
        <div v-else-if="fpStep === 'done'" key="fp-done" class="bg-bg-surface border-border-default rounded-2xl border p-8 shadow-lg text-center">
          <div class="bg-success/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <CheckCircle2 :size="36" class="text-success" />
          </div>
          <h2 class="mb-2 text-xl font-bold">Thành công!</h2>
          <p class="text-text-tertiary mb-6 text-sm">{{ t('forgot.resetSuccess') }}</p>
          <button @click="backToLoginFromDone" class="btn-primary w-full justify-center py-3">
            <RotateCcw :size="16" />
            <span>{{ t('login.backToLogin') }}</span>
          </button>
        </div>
      </Transition>

      <p class="text-text-disabled mt-6 text-center text-[0.6875rem]">
        {{ t('common.version') }}
      </p>
    </div>
  </div>
</template>

<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(0.5rem);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 300ms ease, opacity 300ms ease;
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
