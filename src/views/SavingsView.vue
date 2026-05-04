<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui'
import { formatVND } from '@/constants/finance'
import type { SavingsGoal } from '@/types'
import { Plus, Trash2, Target, ArrowUpRight, ArrowDownRight, PartyPopper, X } from 'lucide-vue-next'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import CustomDatePicker from '@/components/ui/CustomDatePicker.vue'

const { t } = useI18n()
const ui = useUiStore()

const STORAGE_KEY = 'finnote_savings'
function load(): SavingsGoal[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] } }
function persist(g: SavingsGoal[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(g)) }

const goals = ref<SavingsGoal[]>(load())
const showAdd = ref(false)
const showDeposit = ref<string | null>(null)
const depositAmount = ref<number>(0)

const ICONS = ['🏖️','💻','🏠','🚗','🎓','💍','🏥','🎮','📱','✈️','🎯','💰']
const COLORS = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#ef4444','#14b8a6','#6366f1']

const form = ref({ name: '', icon: '🎯', color: '#10b981', targetAmount: 0, deadline: '' })

function addGoal() {
  const amt = form.value.targetAmount
  if (!form.value.name.trim() || amt <= 0) return
  goals.value.push({ id: crypto.randomUUID(), name: form.value.name.trim(), icon: form.value.icon, color: form.value.color, targetAmount: amt, currentAmount: 0, deadline: form.value.deadline || undefined, createdAt: new Date().toISOString() })
  persist(goals.value); showAdd.value = false
  form.value = { name: '', icon: '🎯', color: '#10b981', targetAmount: 0, deadline: '' }
}

function deposit(id: string) {
  const amt = depositAmount.value
  if (amt <= 0) return
  const g = goals.value.find(x => x.id === id)
  if (g) { g.currentAmount = Math.min(g.currentAmount + amt, g.targetAmount) }
  persist(goals.value); showDeposit.value = null; depositAmount.value = 0
}

function withdraw(id: string) {
  const amt = depositAmount.value
  if (amt <= 0) return
  const g = goals.value.find(x => x.id === id)
  if (g) { g.currentAmount = Math.max(g.currentAmount - amt, 0) }
  persist(goals.value); showDeposit.value = null; depositAmount.value = 0
}

async function deleteGoal(id: string) {
  const ok = await ui.requestConfirm({ title: t('savings.deleteTitle'), message: t('savings.deleteMessage'), danger: true, confirmText: t('common.delete') })
  if (!ok) return; goals.value = goals.value.filter(g => g.id !== id); persist(goals.value)
}

function pct(g: SavingsGoal) { return g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0 }
function daysLeft(deadline?: string) { if (!deadline) return null; return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)) }
function dailySaveNeeded(g: SavingsGoal) { const d = daysLeft(g.deadline); if (!d || d === 0) return 0; return Math.ceil((g.targetAmount - g.currentAmount) / d) }

const totalSaved = computed(() => goals.value.reduce((s, g) => s + g.currentAmount, 0))
const totalTarget = computed(() => goals.value.reduce((s, g) => s + g.targetAmount, 0))
</script>

<template>
  <div class="mx-auto max-w-[50rem]">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">{{ t('savings.title') }}</h1>
        <p class="text-text-tertiary mt-1 text-sm">{{ t('savings.count', { n: goals.length }) }}</p>
      </div>
      <button @click="showAdd = !showAdd" class="btn-primary"><Plus :size="16" /> {{ t('savings.add') }}</button>
    </div>

    <!-- Summary -->
    <div v-if="goals.length" class="card-premium mb-6 p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <div class="bg-success/10 flex h-9 w-9 items-center justify-center rounded-lg"><Target :size="18" class="text-success" /></div>
          <div>
            <div class="text-text-tertiary text-[0.6875rem] font-medium">{{ t('savings.totalSaved') }}</div>
            <div class="text-lg font-bold text-text-primary">{{ formatVND(totalSaved) }}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-text-tertiary text-[0.6875rem]">{{ t('savings.totalTarget') }}</div>
          <div class="text-sm font-semibold text-text-secondary">{{ formatVND(totalTarget) }}</div>
        </div>
      </div>
      <div class="bg-bg-elevated h-2 overflow-hidden rounded-full">
        <div class="h-full rounded-full bg-success transition-all duration-700" :style="{ width: (totalTarget > 0 ? (totalSaved/totalTarget)*100 : 0) + '%' }"></div>
      </div>
    </div>

    <!-- Add Form -->
    <transition name="slide">
      <div v-if="showAdd" class="bg-bg-surface border-border-default mb-6 rounded-xl border p-5">
        <h3 class="mb-4 text-sm font-semibold">{{ t('savings.addNew') }}</h3>
        <div class="flex flex-col gap-4">
          <input v-model="form.name" :placeholder="t('savings.namePlaceholder')" class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:outline-none" />
          <div>
            <span class="text-text-tertiary mb-2 block text-[0.6875rem]">{{ t('savings.icon') }}</span>
            <div class="flex flex-wrap gap-2">
              <button v-for="ic in ICONS" :key="ic" @click="form.icon = ic" class="h-9 w-9 rounded-lg border text-lg flex items-center justify-center transition-all" :class="form.icon === ic ? 'border-accent bg-accent-subtle scale-110' : 'border-border-default hover:border-border-strong'">{{ ic }}</button>
            </div>
          </div>
          <div>
            <span class="text-text-tertiary mb-2 block text-[0.6875rem]">{{ t('savings.color') }}</span>
            <div class="flex flex-wrap gap-2">
              <button v-for="c in COLORS" :key="c" @click="form.color = c" class="h-7 w-7 rounded-full border-2 transition-all" :class="form.color === c ? 'scale-110 border-white' : 'border-transparent'" :style="{ backgroundColor: c }"></button>
            </div>
          </div>
          <CurrencyInput v-model="form.targetAmount" :placeholder="t('savings.targetPlaceholder')" className="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:outline-none" />
          <CustomDatePicker
            v-model="form.deadline"
            :label="t('savings.deadline')"
            :placeholder="t('savings.deadline')"
          />
          <div class="flex gap-2">
            <button @click="showAdd = false" class="border-border-default text-text-secondary hover:bg-bg-hover flex-1 rounded-lg border py-2 text-sm transition-all">{{ t('common.cancel') }}</button>
            <button @click="addGoal" :disabled="!form.name.trim() || form.targetAmount <= 0" class="btn-primary flex-1 justify-center py-2 disabled:opacity-40">{{ t('common.add') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Goals Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div v-if="!goals.length" class="sm:col-span-2 bg-bg-surface border-border-default flex flex-col items-center rounded-2xl border border-dashed py-12 text-center">
        <Target :size="48" class="text-text-disabled mb-4" />
        <h4 class="mb-2 text-lg font-semibold">{{ t('savings.empty') }}</h4>
        <p class="text-text-tertiary mb-6 text-sm">{{ t('savings.emptyHint') }}</p>
        <button @click="showAdd = true" class="btn-secondary"><Plus :size="16" /> {{ t('savings.add') }}</button>
      </div>

      <div v-for="g in goals" :key="g.id" class="bg-bg-surface border-border-default hover:border-border-strong rounded-xl border p-5 transition-all duration-150 relative overflow-hidden">
        <!-- Completed celebration -->
        <div v-if="pct(g) >= 100" class="absolute top-2 right-2"><PartyPopper :size="20" class="text-warning animate-bounce" /></div>

        <div class="flex items-center gap-3 mb-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl text-xl" :style="{ backgroundColor: g.color + '20' }">{{ g.icon }}</div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold truncate">{{ g.name }}</div>
            <div class="text-text-disabled text-[0.6875rem]" v-if="daysLeft(g.deadline) !== null">{{ t('savings.daysLeft', { n: daysLeft(g.deadline) }) }}</div>
          </div>
          <button @click="deleteGoal(g.id)" class="text-text-tertiary hover:text-error p-1 rounded hover:bg-bg-hover transition-all"><Trash2 :size="14" /></button>
        </div>

        <!-- Progress -->
        <div class="mb-2">
          <div class="flex items-end justify-between mb-1">
            <span class="text-sm font-bold" :style="{ color: g.color }">{{ formatVND(g.currentAmount) }}</span>
            <span class="text-text-tertiary text-[0.6875rem]">{{ formatVND(g.targetAmount) }}</span>
          </div>
          <div class="bg-bg-elevated h-2.5 overflow-hidden rounded-full">
            <div class="h-full rounded-full transition-all duration-700" :style="{ width: pct(g) + '%', backgroundColor: g.color }"></div>
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-text-disabled text-[0.625rem]">{{ pct(g).toFixed(0) }}%</span>
            <span v-if="dailySaveNeeded(g) > 0" class="text-text-disabled text-[0.625rem]">~{{ formatVND(dailySaveNeeded(g)) }}/{{ t('savings.perDay') }}</span>
          </div>
        </div>

        <!-- Deposit/Withdraw -->
        <div v-if="showDeposit === g.id" class="flex gap-2 mt-3">
          <CurrencyInput v-model="depositAmount" placeholder="0" className="border-border-default bg-bg-elevated text-text-primary focus:border-accent w-full rounded-lg border px-3 py-1.5 text-sm focus:ring-1 focus:ring-accent-subtle focus:outline-none flex-1" />
          <button @click="deposit(g.id)" class="bg-success/15 text-success hover:bg-success/25 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"><ArrowUpRight :size="14" /></button>
          <button @click="withdraw(g.id)" class="bg-error/15 text-error hover:bg-error/25 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"><ArrowDownRight :size="14" /></button>
          <button @click="showDeposit = null; depositAmount = 0" class="text-text-tertiary hover:text-text-primary p-1"><X :size="14" /></button>
        </div>
        <button v-else @click="showDeposit = g.id" class="mt-3 w-full border-border-default text-text-secondary hover:bg-bg-hover hover:text-text-primary rounded-lg border py-2 text-xs font-medium transition-all">{{ t('savings.addMoney') }}</button>
      </div>
    </div>
  </div>
</template>

<style>
.slide-enter-active,.slide-leave-active{transition:max-height 200ms ease,opacity 200ms ease;overflow:hidden}
.slide-enter-from,.slide-leave-to{max-height:0;opacity:0}
.slide-enter-to,.slide-leave-from{max-height:62.5rem;opacity:1}
</style>
