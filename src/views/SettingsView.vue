<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useNotesStore } from '@/stores/notes'
import { useUiStore } from '@/stores/ui'
import { useRouter } from 'vue-router'
import { computed, ref, onMounted, watch } from 'vue'
import { httpClient } from '@/shared/api/httpClient'
import type { User } from '@/types'
import { User as UserIcon, Database, Download, LogOut, HardDrive, FileText, Shield, Lock, Eye, EyeOff, AlertTriangle, Trash2, Camera, Save, Link } from 'lucide-vue-next'

const auth = useAuthStore()
const notesStore = useNotesStore()
const ui = useUiStore()
const router = useRouter()

const imgError = ref(false)
watch(() => auth.user?.avatarUrl, () => {
  imgError.value = false
})

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
  ui.showToast('success', 'Notes exported successfully')
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
      ui.showToast('success', 'Profile updated successfully')
    }
  } catch (err: any) {
    ui.showToast('error', err.message || 'Failed to update profile')
  } finally {
    profileLoading.value = false
  }
}

// ── Account Deletion ──
const isDeleteModalOpen = ref(false)
const deleteLoading = ref(false)
const otpSent = ref(false)
const deleteOtpForm = ref({ otp: '' })

async function requestDeleteAccount() {
  try {
    deleteLoading.value = true
    const res = await httpClient.post<{ message: string }>('/api/auth/otp/send')
    ui.showToast('success', res.message || 'OTP sent to your email')
    otpSent.value = true
  } catch (err: any) {
    ui.showToast('error', err.message || 'Failed to request account deletion')
  } finally {
    deleteLoading.value = false
  }
}

async function confirmDeleteAccount() {
  if (!deleteOtpForm.value.otp) return ui.showToast('error', 'Vui lòng nhập OTP')
  try {
    deleteLoading.value = true
    await httpClient.post('/api/auth/account/delete', { otp: deleteOtpForm.value.otp })
    ui.showToast('success', 'Account deleted successfully')
    isDeleteModalOpen.value = false
    auth.logout()
    router.push('/login')
  } catch (err: any) {
    ui.showToast('error', err.message || 'Failed to delete account (Invalid OTP?)')
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



// ── PIN Management ──

async function savePin() {
  if (pinForm.value.newPin.length < 4 || pinForm.value.newPin.length > 6) {
    ui.showToast('error', 'PIN phải từ 4-6 chữ số')
    return
  }
  if (!/^\d+$/.test(pinForm.value.newPin)) {
    ui.showToast('error', 'PIN chỉ được chứa số')
    return
  }
  if (pinForm.value.newPin !== pinForm.value.confirmPin) {
    ui.showToast('error', 'PIN xác nhận không khớp')
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
    ui.showToast('success', 'PIN đã được thiết lập thành công!')
  } catch (err: any) {
    ui.showToast('error', err.message || 'Không thể thiết lập PIN')
  } finally {
    pinLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-[43.75rem]">
    <h1 class="mb-6 text-2xl font-bold tracking-tight md:mb-8">Settings</h1>

    <!-- Profile -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <UserIcon :size="18" />
        <h3 class="text-sm font-semibold">Profile</h3>
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
            Edit Profile
          </button>
        </div>

        <!-- Edit Profile Form -->
        <div v-else class="flex flex-col gap-4">
          <div>
            <label class="text-text-secondary mb-1 block text-[0.6875rem] font-medium">Display Name</label>
            <input
              v-model="profileForm.name"
              type="text"
              placeholder="Your name"
              class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
            />
          </div>
          <div>
            <label class="text-text-secondary mb-1 block text-[0.6875rem] font-medium">Avatar URL</label>
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
                title="Remove Avatar"
              >
                <Trash2 :size="16" />
              </button>
            </div>
            <p class="text-text-tertiary mt-1 text-[0.6875rem]">Paste a public image URL for your avatar.</p>
          </div>
          <div class="mt-2 flex items-center justify-end gap-2">
            <button
              @click="isEditingProfile = false; profileForm = { name: auth.user?.name || '', avatarUrl: auth.user?.avatarUrl || '' }"
              class="text-text-secondary hover:text-text-primary rounded-lg px-4 py-2 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              @click="saveProfile"
              :disabled="profileLoading || !profileForm.name"
              class="btn-primary"
            >
              <span v-if="profileLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-l-black"></span>
              <Save v-else :size="14" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Storage -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <Database :size="18" />
        <h3 class="text-sm font-semibold">Storage</h3>
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
              <div class="text-text-tertiary text-[0.6875rem]">Local Storage Used</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <FileText
              :size="20"
              class="text-accent"
            />
            <div>
              <div class="text-base font-semibold">{{ notesStore.totalNotes }}</div>
              <div class="text-text-tertiary text-[0.6875rem]">Total Notes</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Shield
              :size="20"
              class="text-accent"
            />
            <div>
              <div class="text-base font-semibold">10 GB</div>
              <div class="text-text-tertiary text-[0.6875rem]">R2 Free Tier Limit</div>
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
        <h3 class="text-sm font-semibold">Data Management</h3>
      </div>
      <div class="bg-bg-surface border-border-default rounded-xl border p-5">
        <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 class="mb-0.5 text-sm font-semibold">Export Notes</h4>
            <p class="text-text-tertiary text-sm">Download all your notes as a JSON file</p>
          </div>
          <button
            id="export-notes-btn"
            @click="exportNotes"
            class="border-border-default text-text-secondary hover:bg-bg-hover hover:text-text-primary flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150"
          >
            <Download :size="16" />
            Export
          </button>
        </div>
      </div>
    </div>

    <!-- PIN Security -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <Lock :size="18" />
        <h3 class="text-sm font-semibold">Bảo mật PIN</h3>
      </div>
      <div class="bg-bg-surface border-border-default rounded-xl border p-5">
        <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 class="mb-0.5 text-sm font-semibold">
              {{ hasPin ? 'Đổi mã PIN' : 'Thiết lập mã PIN' }}
            </h4>
            <p class="text-text-tertiary text-sm">
              {{ hasPin ? 'PIN đang bật. Các thao tác quan trọng sẽ yêu cầu xác nhận PIN.' : 'Bảo vệ các thao tác quan trọng bằng mã PIN.' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span
              v-if="hasPin"
              class="bg-success/10 text-success rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium"
            >
              Đã bật
            </span>
            <button
              @click="showPinForm = !showPinForm"
              class="border-border-default text-text-secondary hover:bg-bg-hover hover:text-text-primary flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150"
            >
              <Lock :size="16" />
              {{ hasPin ? 'Đổi PIN' : 'Thiết lập PIN' }}
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
                <label class="text-text-secondary mb-1 block text-[0.6875rem] font-medium">PIN hiện tại</label>
                <div class="relative">
                  <input
                    v-model="pinForm.currentPin"
                    :type="showCurrentPin ? 'text' : 'password'"
                    inputmode="numeric"
                    maxlength="6"
                    placeholder="Nhập PIN cũ"
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
                <label class="text-text-secondary mb-1 block text-[0.6875rem] font-medium">PIN mới (4-6 số)</label>
                <div class="relative">
                  <input
                    v-model="pinForm.newPin"
                    :type="showNewPin ? 'text' : 'password'"
                    inputmode="numeric"
                    maxlength="6"
                    placeholder="Nhập PIN mới"
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
                <label class="text-text-secondary mb-1 block text-[0.6875rem] font-medium">Xác nhận PIN</label>
                <input
                  v-model="pinForm.confirmPin"
                  type="password"
                  inputmode="numeric"
                  maxlength="6"
                  placeholder="Nhập lại PIN"
                  class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                />
              </div>

              <div class="flex gap-2">
                <button
                  @click="showPinForm = false; pinForm = { currentPin: '', newPin: '', confirmPin: '' }"
                  class="border-border-default text-text-secondary hover:bg-bg-hover flex-1 rounded-lg border py-2 text-sm"
                >
                  Hủy
                </button>
                <button
                  @click="savePin"
                  :disabled="pinLoading || !pinForm.newPin || !pinForm.confirmPin"
                  class="btn-primary flex-1 justify-center py-2 disabled:opacity-40"
                >
                  {{ pinLoading ? 'Đang lưu...' : 'Lưu PIN' }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Account -->
    <div class="mb-6">
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <Shield :size="18" />
        <h3 class="text-sm font-semibold">Account</h3>
      </div>
      <div class="card-premium p-5">
        <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 class="mb-0.5 text-sm font-semibold">Sign Out</h4>
            <p class="text-text-tertiary text-sm">Log out of your account</p>
          </div>
          <button
            id="logout-btn"
            @click="auth.logout(); router.push('/login')"
            class="border-border-default hover:bg-bg-hover hover:text-text-primary rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 flex items-center gap-2 text-text-secondary"
          >
            <LogOut :size="16" />
            Sign Out
          </button>
        </div>

        <div class="border-border-default mt-5 border-t pt-5">
          <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h4 class="mb-0.5 text-sm font-semibold text-error">Delete Account</h4>
              <p class="text-text-tertiary text-[0.8125rem]">Permanently delete your account and all data</p>
            </div>
            <button
              @click="isDeleteModalOpen = true"
              class="border-error text-error hover:bg-error/10 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150"
            >
              <Trash2 :size="16" />
              Delete Account
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
            
            <h3 class="mb-2 text-center text-lg font-bold text-error">Xóa tài khoản</h3>
            <p class="text-text-secondary mb-6 text-center text-sm">
              Hành động này <strong class="text-text-primary">không thể hoàn tác</strong>. Mọi dữ liệu (ví, giao dịch, ghi chú) sẽ bị xóa viễn viễn.
            </p>

            <div v-if="!otpSent" class="flex flex-col gap-3">
              <button
                @click="requestDeleteAccount"
                :disabled="deleteLoading"
                class="bg-error hover:bg-error/90 flex w-full justify-center rounded-xl py-3 font-semibold text-white transition-colors disabled:opacity-50"
              >
                <span v-if="deleteLoading" class="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-l-white"></span>
                <span v-else>Gửi OTP xác nhận</span>
              </button>
              <button
                @click="isDeleteModalOpen = false"
                class="text-text-secondary hover:text-text-primary w-full py-2 text-sm font-medium"
              >
                Hủy bỏ
              </button>
            </div>

            <div v-else class="flex flex-col gap-4">
              <div>
                <label class="text-text-secondary mb-1 block text-sm font-medium">Mã OTP (Đã gửi vào Email)</label>
                <input
                  v-model="deleteOtpForm.otp"
                  type="text"
                  placeholder="Nhập 6 số OTP"
                  maxlength="6"
                  class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-error focus:ring-error/20 w-full rounded-xl border px-4 py-3 text-center text-lg tracking-widest transition-all focus:ring-2 focus:outline-none"
                />
              </div>
              <div class="flex gap-3">
                <button
                  @click="isDeleteModalOpen = false; otpSent = false; deleteOtpForm.otp = ''"
                  class="border-border-default text-text-secondary hover:bg-bg-hover flex-1 rounded-xl border py-2.5 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  @click="confirmDeleteAccount"
                  :disabled="deleteLoading || deleteOtpForm.otp.length < 6"
                  class="bg-error hover:bg-error/90 flex-1 justify-center rounded-xl py-2.5 font-semibold text-white transition-colors disabled:opacity-50"
                >
                  <span v-if="deleteLoading" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-l-white"></span>
                  <span v-else>Xóa vĩnh viễn</span>
                </button>
              </div>
              <p class="text-text-tertiary text-center text-[0.6875rem] mt-2">
                Không nhận được? <button @click="requestDeleteAccount" class="text-accent hover:underline">Gửi lại</button>
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Footer -->
    <div class="border-border-default mt-8 border-t pt-4 text-center">
      <p class="text-text-disabled text-[0.6875rem]">
        SmartNote v1.0.0
      </p>
    </div>
  </div>
</template>
