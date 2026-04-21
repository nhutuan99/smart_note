<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useNotesStore } from '@/stores/notes'
import { useUiStore } from '@/stores/ui'
import { useFinanceStore } from '@/stores/finance'
import { useRouter } from 'vue-router'
import { computed, ref, onMounted, watch } from 'vue'
import { httpClient } from '@/shared/api/httpClient'
import { useI18n } from 'vue-i18n'
import { setLocale, currentLocale } from '@/i18n'
import type { User } from '@/types'
import { User as UserIcon, Database, Download, LogOut, HardDrive, FileText, Shield, Lock, Eye, EyeOff, AlertTriangle, Trash2, Camera, Save, Link, Globe, KeyRound, MailCheck, ShieldOff } from 'lucide-vue-next'

const { t } = useI18n()
const auth = useAuthStore()
const notesStore = useNotesStore()
const ui = useUiStore()
const finance = useFinanceStore()
const router = useRouter()

const imgError = ref(false)
watch(() => auth.user?.avatarUrl, () => {
  imgError.value = false
})

// ── Language ──
const selectedLocale = ref(currentLocale())

function changeLocale(locale: 'vi' | 'en') {
  selectedLocale.value = locale
  setLocale(locale)
}

const storageUsed = computed(() => {
  let t = 0
  for (const k in localStorage) {
    if (k.startsWith('sn_')) t += localStorage.getItem(k)?.length || 0
  }
  return (t / 1024).toFixed(1)
})

function exportNotes() {
  const blob = new Blob(
    [
      JSON.stringify(
        { exportDate: new Date().toISOString(), user: auth.user, notes: notesStore.notes },
        null,
        2
      )
    ],
    { type: 'application/json' }
  )
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `smart-note-export-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  ui.showToast('success', t('settings.exportSuccess'))
}

// ── Profile Management ──
const isEditingProfile = ref(false)
const profileForm = ref({ name: auth.user?.name || '', avatarUrl: auth.user?.avatarUrl || '' })
const profileLoading = ref(false)

async function saveProfile() {
  profileLoading.value = true
  try {
    const data = await httpClient.put<{ data: User }>('/api/auth/profile', profileForm.value)
    if (data && data.data) {
      auth.updateUser(data.data)
      isEditingProfile.value = false
      ui.showToast('success', t('settings.profileUpdated'))
    }
  } catch (err: any) {
    ui.showToast('error', err.message || t('settings.profileFailed'))
  } finally {
    profileLoading.value = false
  }
}

// ── Account Deletion ──
const isDeleteModalOpen = ref(false)
const deleteLoading = ref(false)
const deletePasswordForm = ref({ password: '' })
const showDeletePassword = ref(false)

async function confirmDeleteAccount() {
  if (!deletePasswordForm.value.password) return ui.showToast('error', t('settings.passwordRequired'))
  try {
    deleteLoading.value = true
    await httpClient.post('/api/auth/delete-account', { password: deletePasswordForm.value.password })
    ui.showToast('success', t('settings.accountDeleted'))
    isDeleteModalOpen.value = false
    finance.reset()
    auth.logout()
    router.push('/login')
  } catch (err: any) {
    ui.showToast('error', err.message || t('settings.wrongPassword'))
  } finally {
    deleteLoading.value = false
  }
}

// ── PIN Management ──

const hasPin = ref(false)
const showPinForm = ref(false)
const pinForm = ref({ currentPin: '', newPin: '', confirmPin: '' })
const pinLoading = ref(false)
const showCurrentPin = ref(false)
const showNewPin = ref(false)

onMounted(async () => {
  try {
    const data = await httpClient.get<{ hasPin: boolean }>('/api/pin')
    hasPin.value = data?.hasPin || false
  } catch { /* ignore */ }
})

async function savePin() {
  if (pinForm.value.newPin.length < 4 || pinForm.value.newPin.length > 6) {
    ui.showToast('error', t('settings.pinLengthError'))
    return
  }
  if (!/^\d+$/.test(pinForm.value.newPin)) {
    ui.showToast('error', t('settings.pinDigitsOnly'))
    return
  }
  if (pinForm.value.newPin !== pinForm.value.confirmPin) {
    ui.showToast('error', t('settings.pinMismatch'))
    return
  }

  pinLoading.value = true
  try {
    await httpClient.post('/api/pin', {
      pin: pinForm.value.newPin,
      currentPin: pinForm.value.currentPin || undefined
    })
    hasPin.value = true
    showPinForm.value = false
    pinForm.value = { currentPin: '', newPin: '', confirmPin: '' }
    ui.showToast('success', t('settings.pinSuccess'))
  } catch (err: any) {
    ui.showToast('error', err.message || t('settings.pinFailed'))
  } finally {
    pinLoading.value = false
  }
}

// ── Forgot PIN (OTP-based reset) ──
// step: null | 'sent' | 'newpin'
const forgotPinStep = ref<null | 'sent' | 'newpin'>(null)
const forgotPinOtp = ref('')
const forgotPinResetToken = ref('')
const forgotPinNew = ref('')
const forgotPinConfirm = ref('')
const forgotPinLoading = ref(false)
const forgotPinError = ref('')
const forgotPinResend = ref(0)
let forgotPinTimer: ReturnType<typeof setInterval> | null = null

function startForgotPinCountdown() {
  forgotPinResend.value = 60
  forgotPinTimer = setInterval(() => {
    forgotPinResend.value--
    if (forgotPinResend.value <= 0 && forgotPinTimer) {
      clearInterval(forgotPinTimer)
      forgotPinTimer = null
    }
  }, 1000)
}

async function sendForgotPinOtp(isResend = false) {
  forgotPinLoading.value = true
  forgotPinError.value = ''
  try {
    await httpClient.post('/api/pin/forgot', {})
    forgotPinStep.value = 'sent'
    startForgotPinCountdown()
    if (isResend) ui.showToast('success', t('forgot.otpSent'))
  } catch (err: any) {
    forgotPinError.value = err.message || 'Gửi OTP thất bại'
  } finally {
    forgotPinLoading.value = false
  }
}

async function verifyForgotPinOtp() {
  if (!forgotPinOtp.value || forgotPinOtp.value.length !== 6) {
    forgotPinError.value = t('forgot.invalidOtp')
    return
  }
  forgotPinLoading.value = true
  forgotPinError.value = ''
  try {
    const res = await httpClient.post<{ resetToken: string }>('/api/pin/verify-otp', {
      otp: forgotPinOtp.value
    })
    forgotPinResetToken.value = res?.resetToken || ''
    forgotPinStep.value = 'newpin'
  } catch (err: any) {
    forgotPinError.value = err.message || t('forgot.invalidOtp')
  } finally {
    forgotPinLoading.value = false
  }
}

async function resetPinWithOtp() {
  if (forgotPinNew.value.length < 4 || forgotPinNew.value.length > 6) {
    forgotPinError.value = t('settings.pinLengthError')
    return
  }
  if (!/^\d+$/.test(forgotPinNew.value)) {
    forgotPinError.value = t('settings.pinDigitsOnly')
    return
  }
  if (forgotPinNew.value !== forgotPinConfirm.value) {
    forgotPinError.value = t('settings.pinMismatch')
    return
  }
  forgotPinLoading.value = true
  forgotPinError.value = ''
  try {
    await httpClient.post('/api/pin/reset', {
      resetToken: forgotPinResetToken.value,
      newPin: forgotPinNew.value
    })
    hasPin.value = true
    forgotPinStep.value = null
    forgotPinOtp.value = ''
    forgotPinNew.value = ''
    forgotPinConfirm.value = ''
    forgotPinResetToken.value = ''
    ui.showToast('success', t('forgot.pinResetSuccess'))
  } catch (err: any) {
    forgotPinError.value = err.message || 'Đặt lại PIN thất bại'
  } finally {
    forgotPinLoading.value = false
  }
}

function cancelForgotPin() {
  forgotPinStep.value = null
  forgotPinOtp.value = ''
  forgotPinNew.value = ''
  forgotPinConfirm.value = ''
  forgotPinError.value = ''
  forgotPinResetToken.value = ''
  if (forgotPinTimer) { clearInterval(forgotPinTimer); forgotPinTimer = null }
}
</script>

<template>
  <div class="max-w-[43.75rem]">
    <h1 class="mb-6 text-2xl font-bold tracking-tight md:mb-8">{{ t('settings.title') }}</h1>

    <!-- Language -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <Globe :size="18" />
        <h3 class="text-sm font-semibold">{{ t('settings.language') }}</h3>
      </div>
      <div class="bg-bg-surface border-border-default rounded-xl border p-5">
        <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 class="mb-0.5 text-sm font-semibold">{{ t('settings.language') }}</h4>
            <p class="text-text-tertiary text-sm">{{ t('settings.languageDesc') }}</p>
          </div>
          <div class="border-border-default flex overflow-hidden rounded-lg border">
            <button
              class="px-4 py-2 text-sm font-medium transition-all duration-150"
              :class="selectedLocale === 'vi' ? 'bg-accent-subtle text-accent' : 'bg-bg-surface text-text-secondary hover:bg-bg-hover'"
              @click="changeLocale('vi')"
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              class="border-border-default border-l px-4 py-2 text-sm font-medium transition-all duration-150"
              :class="selectedLocale === 'en' ? 'bg-accent-subtle text-accent' : 'bg-bg-surface text-text-secondary hover:bg-bg-hover'"
              @click="changeLocale('en')"
            >
              🇺🇸 English
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <UserIcon :size="18" />
        <h3 class="text-sm font-semibold">{{ t('settings.profile') }}</h3>
      </div>
      <div class="card-premium p-5">
        <div v-if="!isEditingProfile" class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div class="flex items-center gap-4">
            <div
              v-if="!auth.user?.avatarUrl || imgError"
              class="bg-accent-subtle text-accent flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full text-xl font-semibold"
            >
              {{ auth.user?.name?.charAt(0)?.toUpperCase() || 'U' }}
            </div>
            <img 
              v-else 
              v-show="!imgError"
              :src="auth.user?.avatarUrl" 
              alt="Avatar" 
              class="h-[3.25rem] w-[3.25rem] rounded-full object-cover shadow-sm"
              referrerpolicy="no-referrer"
              @error="imgError = true"
            />
            <div>
              <h4 class="mb-0.5 text-base font-semibold">{{ auth.user?.name || 'User' }}</h4>
              <p class="text-text-tertiary text-sm">{{ auth.user?.email || 'No email' }}</p>
            </div>
          </div>
          <button
            @click="isEditingProfile = true"
            class="btn-secondary whitespace-nowrap"
          >
            {{ t('settings.editProfile') }}
          </button>
        </div>

        <!-- Edit Profile Form -->
        <div v-else class="flex flex-col gap-4">
          <div>
            <label class="text-text-secondary mb-1 block text-[0.6875rem] font-medium">{{ t('settings.displayName') }}</label>
            <input
              v-model="profileForm.name"
              type="text"
              :placeholder="t('login.namePlaceholder')"
              class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
            />
          </div>
          <div>
            <label class="text-text-secondary mb-1 block text-[0.6875rem] font-medium">{{ t('settings.avatarUrl') }}</label>
            <div class="flex items-center gap-2">
              <Camera :size="16" class="text-text-tertiary" />
              <input
                v-model.trim="profileForm.avatarUrl"
                type="url"
                placeholder="https://example.com/avatar.png"
                class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle flex-1 rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
              />
              <button
                v-if="profileForm.avatarUrl"
                @click="profileForm.avatarUrl = ''"
                class="text-text-tertiary hover:text-error rounded-lg p-2 transition-colors"
                :title="t('settings.removeAvatar')"
              >
                <Trash2 :size="16" />
              </button>
            </div>
            <p class="text-text-tertiary mt-1 text-[0.6875rem]">{{ t('settings.avatarHint') }}</p>
          </div>
          <div class="mt-2 flex items-center justify-end gap-2">
            <button
              @click="isEditingProfile = false; profileForm = { name: auth.user?.name || '', avatarUrl: auth.user?.avatarUrl || '' }"
              class="text-text-secondary hover:text-text-primary rounded-lg px-4 py-2 text-sm transition-colors"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              @click="saveProfile"
              :disabled="profileLoading || !profileForm.name"
              class="btn-primary"
            >
              <span v-if="profileLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-l-black"></span>
              <Save v-else :size="14" />
              <span>{{ t('settings.saveChanges') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Storage -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <Database :size="18" />
        <h3 class="text-sm font-semibold">{{ t('settings.storage') }}</h3>
      </div>
      <div class="card-premium p-5">
        <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="flex items-center gap-3">
            <HardDrive
              :size="20"
              class="text-accent"
            />
            <div>
              <div class="text-base font-semibold">{{ storageUsed }} KB</div>
              <div class="text-text-tertiary text-[0.6875rem]">{{ t('settings.localStorageUsed') }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <FileText
              :size="20"
              class="text-accent"
            />
            <div>
              <div class="text-base font-semibold">{{ notesStore.totalNotes }}</div>
              <div class="text-text-tertiary text-[0.6875rem]">{{ t('settings.totalNotes') }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Shield
              :size="20"
              class="text-accent"
            />
            <div>
              <div class="text-base font-semibold">10 GB</div>
              <div class="text-text-tertiary text-[0.6875rem]">{{ t('settings.r2Limit') }}</div>
            </div>
          </div>
        </div>
        <div class="border-border-default border-t pt-4">
          <div class="bg-bg-elevated mb-2 h-1.5 overflow-hidden rounded-full">
            <div
              class="bg-accent h-full min-w-[0.125rem] rounded-full transition-all duration-300"
              :style="{ width: Math.min((parseFloat(storageUsed) / 10240) * 100, 100) + '%' }"
            ></div>
          </div>
          <span class="text-text-tertiary text-[0.6875rem]">{{ storageUsed }} KB / 10 GB</span>
        </div>
      </div>
    </div>

    <!-- Export -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <Download :size="18" />
        <h3 class="text-sm font-semibold">{{ t('settings.dataManagement') }}</h3>
      </div>
      <div class="bg-bg-surface border-border-default rounded-xl border p-5">
        <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 class="mb-0.5 text-sm font-semibold">{{ t('settings.exportNotes') }}</h4>
            <p class="text-text-tertiary text-sm">{{ t('settings.exportDesc') }}</p>
          </div>
          <button
            id="export-notes-btn"
            @click="exportNotes"
            class="border-border-default text-text-secondary hover:bg-bg-hover hover:text-text-primary flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150"
          >
            <Download :size="16" />
            {{ t('common.export') }}
          </button>
        </div>
      </div>
    </div>

    <!-- PIN Security -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <Lock :size="18" />
        <h3 class="text-sm font-semibold">{{ t('settings.pinSecurity') }}</h3>
      </div>
      <div class="bg-bg-surface border-border-default rounded-xl border p-5">
        <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 class="mb-0.5 text-sm font-semibold">
              {{ hasPin ? t('settings.changePin') : t('settings.setupPin') }}
            </h4>
            <p class="text-text-tertiary text-sm">
              {{ hasPin ? t('settings.pinEnabled') : t('settings.pinDisabled') }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span
              v-if="hasPin"
              class="bg-success/10 text-success rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium"
            >
              {{ t('settings.pinActive') }}
            </span>
            <button
              @click="showPinForm = !showPinForm"
              class="border-border-default text-text-secondary hover:bg-bg-hover hover:text-text-primary flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150"
            >
              <Lock :size="16" />
              {{ hasPin ? t('settings.changePin') : t('settings.setupPin') }}
            </button>
          </div>
        </div>

        <!-- PIN Form -->
        <transition name="slide">
          <div
            v-if="showPinForm"
            class="border-border-default mt-4 border-t pt-4"
          >
            <div class="flex max-w-[20rem] flex-col gap-3">
              <!-- Current PIN (only if has existing PIN) -->
              <div v-if="hasPin">
                <label class="text-text-secondary mb-1 block text-[0.6875rem] font-medium">{{ t('settings.currentPin') }}</label>
                <div class="relative">
                  <input
                    v-model="pinForm.currentPin"
                    :type="showCurrentPin ? 'text' : 'password'"
                    inputmode="numeric"
                    maxlength="6"
                    :placeholder="t('settings.currentPinPlaceholder')"
                    class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                  />
                  <button
                    type="button"
                    class="text-text-tertiary hover:text-text-primary absolute top-1/2 right-3 -translate-y-1/2"
                    @click="showCurrentPin = !showCurrentPin"
                  >
                    <component :is="showCurrentPin ? EyeOff : Eye" :size="14" />
                  </button>
                </div>
              </div>

              <!-- New PIN -->
              <div>
                <label class="text-text-secondary mb-1 block text-[0.6875rem] font-medium">{{ t('settings.newPin') }}</label>
                <div class="relative">
                  <input
                    v-model="pinForm.newPin"
                    :type="showNewPin ? 'text' : 'password'"
                    inputmode="numeric"
                    maxlength="6"
                    :placeholder="t('settings.newPinPlaceholder')"
                    class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                  />
                  <button
                    type="button"
                    class="text-text-tertiary hover:text-text-primary absolute top-1/2 right-3 -translate-y-1/2"
                    @click="showNewPin = !showNewPin"
                  >
                    <component :is="showNewPin ? EyeOff : Eye" :size="14" />
                  </button>
                </div>
              </div>

              <!-- Confirm PIN -->
              <div>
                <label class="text-text-secondary mb-1 block text-[0.6875rem] font-medium">{{ t('settings.confirmPin') }}</label>
                <input
                  v-model="pinForm.confirmPin"
                  type="password"
                  inputmode="numeric"
                  maxlength="6"
                  :placeholder="t('settings.confirmPinPlaceholder')"
                  class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                />
              </div>

              <div class="flex gap-2">
                <button
                  @click="showPinForm = false; pinForm = { currentPin: '', newPin: '', confirmPin: '' }"
                  class="border-border-default text-text-secondary hover:bg-bg-hover flex-1 rounded-lg border py-2 text-sm"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  @click="savePin"
                  :disabled="pinLoading || !pinForm.newPin || !pinForm.confirmPin"
                  class="btn-primary flex-1 justify-center py-2 disabled:opacity-40"
                >
                  {{ pinLoading ? t('settings.savingPin') : t('settings.savePin') }}
                </button>
              </div>

              <!-- Forgot PIN link (only when editing existing PIN) -->
              <div v-if="hasPin" class="text-center">
                <button
                  @click="showPinForm = false; sendForgotPinOtp()"
                  class="text-text-tertiary hover:text-accent text-xs transition-colors"
                >
                  {{ t('settings.forgotPin') }}
                </button>
              </div>
            </div>
          </div>
        </transition>

        <!-- ── Forgot PIN OTP Modal ── -->
        <Teleport to="body">
          <Transition name="fade">
            <div v-if="forgotPinStep !== null" class="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="cancelForgotPin"></div>
              <div class="bg-bg-surface border-border-default relative w-full max-w-[22rem] rounded-2xl border p-6 shadow-xl">

                <!-- Step: sent – verify OTP -->
                <template v-if="forgotPinStep === 'sent'">
                  <div class="mb-5 flex items-center gap-3">
                    <div class="bg-warning/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      <MailCheck :size="20" class="text-warning" />
                    </div>
                    <div>
                      <h3 class="font-semibold">{{ t('forgot.pinTitle') }}</h3>
                      <p class="text-text-tertiary text-xs">{{ t('forgot.pinDesc') }}</p>
                    </div>
                  </div>

                  <div class="flex flex-col gap-3">
                    <input
                      v-model="forgotPinOtp"
                      type="text"
                      inputmode="numeric"
                      maxlength="6"
                      placeholder="000000"
                      class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-xl border px-4 py-3 text-center text-2xl font-bold tracking-[0.5rem] transition-all focus:ring-2 focus:outline-none"
                      :class="{ 'border-error': forgotPinError }"
                    />

                    <p v-if="forgotPinError" class="text-error text-center text-sm">{{ forgotPinError }}</p>

                    <button
                      @click="verifyForgotPinOtp"
                      :disabled="forgotPinLoading || forgotPinOtp.length !== 6"
                      class="btn-primary w-full justify-center py-2.5 disabled:opacity-50"
                    >
                      <span v-if="forgotPinLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-l-black"></span>
                      <span v-else>{{ t('forgot.verifyOtp') }}</span>
                    </button>

                    <div class="flex items-center justify-between">
                      <button @click="cancelForgotPin" class="text-text-tertiary hover:text-text-primary text-sm transition-colors">{{ t('common.cancel') }}</button>
                      <button
                        v-if="forgotPinResend <= 0"
                        @click="sendForgotPinOtp(true)"
                        :disabled="forgotPinLoading"
                        class="text-accent text-sm"
                      >{{ t('forgot.resend') }}</button>
                      <span v-else class="text-text-disabled text-sm">{{ t('forgot.resendIn').replace('{s}', String(forgotPinResend)) }}</span>
                    </div>
                  </div>
                </template>

                <!-- Step: newpin – set new PIN -->
                <template v-else-if="forgotPinStep === 'newpin'">
                  <div class="mb-5 flex items-center gap-3">
                    <div class="bg-accent/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      <KeyRound :size="20" class="text-accent" />
                    </div>
                    <div>
                      <h3 class="font-semibold">{{ t('forgot.pinNewTitle') }}</h3>
                      <p class="text-text-tertiary text-xs">{{ t('forgot.pinNewDesc') }}</p>
                    </div>
                  </div>

                  <div class="flex flex-col gap-3">
                    <div>
                      <label class="text-text-secondary mb-1 block text-xs font-medium">{{ t('settings.newPin') }}</label>
                      <input
                        v-model="forgotPinNew"
                        type="password"
                        inputmode="numeric"
                        maxlength="6"
                        :placeholder="t('settings.newPinPlaceholder')"
                        class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="text-text-secondary mb-1 block text-xs font-medium">{{ t('settings.confirmPin') }}</label>
                      <input
                        v-model="forgotPinConfirm"
                        type="password"
                        inputmode="numeric"
                        maxlength="6"
                        :placeholder="t('settings.confirmPinPlaceholder')"
                        class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                      />
                    </div>

                    <p v-if="forgotPinError" class="text-error text-center text-sm">{{ forgotPinError }}</p>

                    <div class="flex gap-2">
                      <button @click="cancelForgotPin" class="border-border-default text-text-secondary hover:bg-bg-hover flex-1 rounded-lg border py-2 text-sm">{{ t('common.cancel') }}</button>
                      <button
                        @click="resetPinWithOtp"
                        :disabled="forgotPinLoading || !forgotPinNew || !forgotPinConfirm"
                        class="btn-primary flex-1 justify-center py-2 disabled:opacity-50"
                      >
                        <span v-if="forgotPinLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-l-black"></span>
                        <span v-else>{{ t('settings.savePin') }}</span>
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </Transition>
        </Teleport>
      </div>
    </div>

    <!-- Account -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <Shield :size="18" />
        <h3 class="text-sm font-semibold">{{ t('settings.account') }}</h3>
      </div>
      <div class="card-premium p-5">
        <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 class="mb-0.5 text-sm font-semibold">{{ t('settings.signOut') }}</h4>
            <p class="text-text-tertiary text-sm">{{ t('settings.signOutDesc') }}</p>
          </div>
          <button
            id="logout-btn"
            @click="finance.reset(); auth.logout(); router.push('/login')"
            class="border-border-default hover:bg-bg-hover hover:text-text-primary rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 flex items-center gap-2 text-text-secondary"
          >
            <LogOut :size="16" />
            {{ t('settings.signOut') }}
          </button>
        </div>

        <div class="border-border-default mt-5 border-t pt-5">
          <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h4 class="mb-0.5 text-sm font-semibold text-error">{{ t('settings.deleteAccount') }}</h4>
              <p class="text-text-tertiary text-[0.8125rem]">{{ t('settings.deleteAccountDesc') }}</p>
            </div>
            <button
              @click="isDeleteModalOpen = true"
              class="border-error text-error hover:bg-error/10 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150"
            >
              <Trash2 :size="16" />
              {{ t('settings.deleteAccount') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isDeleteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="isDeleteModalOpen = false"></div>
          
          <div class="bg-bg-surface border-border-default relative w-full max-w-[24rem] rounded-2xl border p-6 shadow-xl">
            <div class="mb-4 flex justify-center">
              <div class="bg-error/10 flex h-14 w-14 items-center justify-center rounded-full">
                <AlertTriangle :size="28" class="text-error" />
              </div>
            </div>
            
            <h3 class="mb-2 text-center text-lg font-bold text-error">{{ t('settings.deleteAccountTitle') }}</h3>
            <p class="text-text-secondary mb-6 text-center text-sm" v-html="t('settings.deleteAccountWarning')"></p>

            <div class="flex flex-col gap-4">
              <div>
                <label class="text-text-secondary mb-1 block text-sm font-medium">{{ t('settings.confirmPassword') }}</label>
                <div class="relative">
                  <Lock :size="18" class="text-text-tertiary absolute top-1/2 left-3 -translate-y-1/2" />
                  <input
                    v-model="deletePasswordForm.password"
                    :type="showDeletePassword ? 'text' : 'password'"
                    :placeholder="t('settings.passwordPlaceholder')"
                    class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-error focus:ring-error/20 w-full rounded-xl border py-3 pr-10 pl-10 text-sm transition-all focus:ring-2 focus:outline-none"
                    @keyup.enter="confirmDeleteAccount"
                  />
                  <button
                    @click="showDeletePassword = !showDeletePassword"
                    class="text-text-tertiary hover:text-text-primary absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  >
                    <Eye v-if="!showDeletePassword" :size="18" />
                    <EyeOff v-else :size="18" />
                  </button>
                </div>
              </div>
              <div class="flex gap-3">
                <button
                  @click="isDeleteModalOpen = false; deletePasswordForm.password = ''"
                  class="border-border-default text-text-secondary hover:bg-bg-hover flex-1 rounded-xl border py-2.5 font-medium transition-colors"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  @click="confirmDeleteAccount"
                  :disabled="deleteLoading || !deletePasswordForm.password"
                  class="bg-error hover:bg-error/90 flex-1 justify-center flex items-center rounded-xl py-2.5 font-semibold text-white transition-colors disabled:opacity-50"
                >
                  <span v-if="deleteLoading" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-l-white"></span>
                  <span v-else>{{ t('settings.deleteForever') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Footer -->
    <div class="border-border-default mt-8 border-t pt-4 text-center">
      <p class="text-text-disabled text-[0.6875rem]">
        {{ t('common.version') }}
      </p>
    </div>
  </div>
</template>
