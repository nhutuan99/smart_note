<script setup lang="ts">
import { computed, ref, nextTick, onMounted } from 'vue'
import { useFinancePolling } from '@/composables/useFinancePolling'
import { formatMoneyShort } from '@/composables/useCurrency'
import { useI18n } from 'vue-i18n'
import { Bot, X, Zap } from 'lucide-vue-next'
import { useAi } from '@/composables/useGemini'
import CatMascot from '@/components/ui/CatMascot.vue'

const { t } = useI18n()
const finance = useFinancePolling()

const isOpen = ref(false)
const isDismissed = ref(false)

const catType = ref<'orange' | 'grey'>('orange')
const catName = computed(() => catType.value === 'orange' ? 'Múp' : 'Mít')

onMounted(() => {
  catType.value = Math.random() > 0.5 ? 'orange' : 'grey'
})

const daysLeftInMonth = computed(() => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return lastDay - now.getDate()
})

function buildFinanceContext() {
  const now = new Date()
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()
  const daysLeft = daysLeftInMonth.value
  const daysElapsed = dayOfMonth - 1
  const avgDailyExpense = daysElapsed > 0 ? Math.round(finance.monthExpense / daysElapsed) : 0
  const projectedMonthExpense = avgDailyExpense * totalDays

  const walletLines = finance.wallets
    .map(w => `  • ${w.name}: ${formatMoneyShort(w.balance)}`)
    .join('\n')

  const categoryLines = finance.expenseByCategoryThisMonth
    .map(c => `  • ${t(`categories.${c.category}`)}: ${formatMoneyShort(c.total)} (${c.percentage.toFixed(0)}%)`)
    .join('\n')

  const netFlow = finance.monthIncome - finance.monthExpense

  return `Bạn là ${catName.value}, trợ lý tài chính cá nhân thông minh hình chú mèo, đang tư vấn cho người dùng với dữ liệu sau:

📊 TÀI CHÍNH THÁNG ${now.getMonth()+1}/${now.getFullYear()}
Hôm nay ngày ${dayOfMonth}/${totalDays} | Còn ${daysLeft} ngày trong tháng

🏦 SỐ DƯ CÁC TÀI KHOẢN (số dư hiện tại):
${walletLines || '  Chưa có tài khoản'}
→ Tổng: ${formatMoneyShort(finance.totalBalance)}

📅 THU CHI THÁNG ${now.getMonth()+1}:
  ↑ Thu vào: ${formatMoneyShort(finance.monthIncome)}
  ↓ Chi ra: ${formatMoneyShort(finance.monthExpense)}
  = Dòng tiền ròng: ${netFlow >= 0 ? '+' : ''}${formatMoneyShort(netFlow)}
  Ø Chi bình quân/ngày: ${formatMoneyShort(avgDailyExpense)}/ngày (dự kiến cả tháng: ${formatMoneyShort(projectedMonthExpense)})

🏷️ DANH MỤC ĐÃ CHI THÁNG NÀY:
${categoryLines || '  Chưa có giao dịch'}`
}

const { streamText: aiInsightText, loading: isAiLoading, askFinance } = useAi()
const aiQuestion = ref('')
const lastQuestion = ref('')
const chatContainer = ref<HTMLElement | null>(null)

async function askAiAdvisor() {
  const q = aiQuestion.value.trim()
  if (!q || isAiLoading.value) return
  lastQuestion.value = q
  aiQuestion.value = ''
  
  // Scroll to bottom
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })

  const context = buildFinanceContext()

  const fullPrompt = `${context}

---
CÂU HỎI CỦA NGƯỜI DÙNG: ${q}

Hãy trả lời dựa trên dữ liệu tài chính ở trên. Ngắn gọn, thực tế, dùng emoji và Markdown.`

  await askFinance(fullPrompt)
  
  // Scroll to bottom again after response starts
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

function renderAiMarkdown(text: string): string {
  let html = text
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  html = html.replace(/\u2705\s*(.+)/g, '<span class="ai-badge ai-badge-ok">✅ $1</span>')
  html = html.replace(/\u26a0\ufe0f\s*(.+)/g, '<span class="ai-badge ai-badge-warn">⚠️ $1</span>')
  html = html.replace(/\u274c\s*(.+)/g, '<span class="ai-badge ai-badge-err">❌ $1</span>')
  html = html.replace(/^\*\*(.+?)\*\*\s*$/gm, '<div class="ai-section-title">$1</div>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="ai-bold">$1</strong>')
  html = html.replace(/(\d+[,.]?\d*\s*(?:tr|triệu|k|đồng|d|đ)\b)/gi, '<span class="ai-amount">$1</span>')
  html = html.replace(/^[\-\*•]\s+(.+)/gm, '<div class="ai-bullet"><span class="ai-bullet-dot">‣</span><span>$1</span></div>')
  html = html.replace(/^(\d+)\.\ (.+)/gm, '<div class="ai-numbered"><span class="ai-num">$1</span><span>$2</span></div>')
  html = html.replace(/^([\u{1F300}-\u{1FFFF}\u2600-\u27FF]\ufe0f?\s+.+)/gmu, '<div class="ai-info-line">$1</div>')
  html = html.replace(/\n\n+/g, '<div class="ai-spacer"></div>')
  html = html.replace(/\n/g, '<br>')
  return html
}
</script>

<template>
  <div v-if="!isDismissed" class="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[100] flex flex-col items-end pointer-events-none">
    
    <!-- AI Response Popover -->
    <transition name="popover">
      <div v-if="isOpen" class="absolute bottom-0 right-0 w-[calc(100vw-2rem)] sm:w-[400px] bg-bg-surface/95 backdrop-blur-xl border border-border-default shadow-[0_10px_40px_rgba(0,0,0,0.3)] rounded-3xl overflow-hidden pointer-events-auto flex flex-col transform origin-bottom-right transition-all">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-accent/20 to-pink-500/10 px-5 py-4 flex items-center justify-between border-b border-border-subtle relative overflow-hidden">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-accent/20 rounded-full blur-xl pointer-events-none"></div>
          <div class="flex items-center gap-3 relative z-10">
            <div class="w-12 h-12 rounded-full bg-bg-surface border-2 border-accent/30 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
               <CatMascot :type="catType" size="sm" :animation="isAiLoading ? 'think' : 'idle'" />
            </div>
            <div>
              <h3 class="text-[0.9375rem] font-bold text-text-primary flex items-center gap-1.5">{{ t('dashboard.aiAdvisorTitle') }} <div class="w-2 h-2 bg-success rounded-full animate-pulse shadow-[0_0_8px_var(--success)]"></div></h3>
              <p class="text-xs text-text-tertiary">{{ t('dashboard.aiReadyToHelp') }}</p>
            </div>
          </div>
          <button @click="isOpen = false" class="text-text-tertiary hover:text-text-primary p-2 hover:bg-bg-hover rounded-full transition-colors relative z-10">
            <X :size="20" />
          </button>
        </div>

        <!-- Body / Chat Area -->
        <div ref="chatContainer" class="p-5 h-[50vh] min-h-[300px] overflow-y-auto no-scrollbar flex flex-col gap-5 bg-gradient-to-b from-transparent to-bg-elevated/30">
          
          <!-- Initial Greet -->
          <div class="flex gap-3">
             <div class="bg-bg-elevated border border-border-subtle rounded-2xl rounded-tl-sm p-3.5 text-[0.875rem] text-text-secondary leading-relaxed shadow-sm">
               {{ t('dashboard.aiGreeting', { name: catName }) }}
             </div>
          </div>

          <!-- User question -->
          <div v-if="lastQuestion" class="flex gap-3 self-end flex-row-reverse max-w-[85%]">
             <div class="bg-gradient-to-r from-accent to-pink-500 text-white rounded-2xl rounded-tr-sm p-3.5 text-[0.875rem] leading-relaxed shadow-[0_4px_15px_rgba(142,125,250,0.3)]">
               {{ lastQuestion }}
             </div>
          </div>

          <!-- Loading -->
          <div v-if="isAiLoading" class="flex gap-3 w-max">
             <div class="bg-bg-elevated border border-border-subtle rounded-2xl rounded-tl-sm p-4 flex gap-1.5 items-center shadow-sm">
               <div class="w-2 h-2 rounded-full bg-accent animate-bounce"></div>
               <div class="w-2 h-2 rounded-full bg-accent animate-bounce" style="animation-delay: 0.15s"></div>
               <div class="w-2 h-2 rounded-full bg-accent animate-bounce" style="animation-delay: 0.3s"></div>
             </div>
          </div>

          <!-- Response -->
          <div v-if="aiInsightText" class="flex gap-3 max-w-[95%]">
             <div class="bg-info/10 border border-info/20 rounded-2xl rounded-tl-sm p-4 text-[0.875rem] text-text-secondary ai-rich-response shadow-sm" v-html="renderAiMarkdown(aiInsightText)">
             </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="p-4 border-t border-border-subtle bg-bg-surface/90 backdrop-blur-md">
          <div class="relative flex items-center bg-bg-elevated border border-border-strong rounded-full focus-within:border-accent/60 focus-within:shadow-[0_0_15px_rgba(142,125,250,0.15)] transition-all">
            <input
              v-model="aiQuestion"
              type="text"
              :placeholder="t('dashboard.aiExamplePlaceholder')"
              class="flex-1 bg-transparent pl-5 pr-2 py-3.5 text-[0.875rem] text-text-primary outline-none placeholder:text-text-disabled"
              @keyup.enter="askAiAdvisor"
              :disabled="isAiLoading"
            />
            <button
              class="mr-1.5 p-2.5 rounded-full text-white transition-all duration-300 flex items-center justify-center shrink-0 disabled:opacity-50 disabled:scale-90"
              :class="aiQuestion.trim() && !isAiLoading ? 'bg-gradient-to-r from-accent to-pink-500 shadow-md scale-100' : 'bg-bg-surface text-text-disabled scale-95 border border-border-subtle'"
              :disabled="!aiQuestion.trim() || isAiLoading"
              @click="askAiAdvisor"
            >
              <Zap :size="16" />
            </button>
          </div>
        </div>

      </div>
    </transition>

    <!-- Floating Mascot Button -->
    <div class="relative pointer-events-auto" :class="isOpen ? 'scale-0 opacity-0 pointer-events-none translate-y-10' : 'scale-100 opacity-100 transition-all duration-500'">
      <button 
        @click="isOpen = !isOpen"
        class="relative flex items-center justify-center filter outline-none z-50 will-change-transform hover:scale-110 drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:drop-shadow-[0_15px_30px_rgba(142,125,250,0.4)] transition-all duration-300"
        style="transform: translateZ(0);"
      >
        <CatMascot :type="catType" size="md" :animation="isOpen ? (isAiLoading ? 'think' : 'idle') : 'wave'" />
        
        <!-- Chat Bubble Tooltip -->
        <transition name="fade">
          <div v-if="!isOpen" class="absolute top-2 right-[100%] mr-2 w-max bg-bg-surface/95 backdrop-blur-md border border-border-default shadow-[0_4px_20px_rgba(0,0,0,0.2)] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm font-medium text-text-primary flex items-center gap-2 pointer-events-none origin-right hover:scale-105 transition-transform animate-float">
            <span>{{ t('dashboard.aiTooltip', { name: catName }) }}</span>
            <!-- Triangle pointer -->
            <div class="absolute top-2 -right-[6px] w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-border-default"></div>
            <div class="absolute top-[9px] -right-[5px] w-0 h-0 border-y-[5px] border-y-transparent border-l-[5px] border-l-bg-surface/95"></div>
          </div>
        </transition>
      </button>

      <!-- Mini Close Button -->
      <button 
        @click.stop="isDismissed = true" 
        class="absolute -top-1 -right-1 z-[60] bg-bg-surface text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-full p-1 border border-border-default shadow-md transition-all opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
        style="opacity: 1;"
      >
        <X :size="12" />
      </button>
    </div>
  </div>
</template>

<style>
.popover-enter-active,
.popover-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: scale(0.85) translateY(30px);
}

.ai-rich-response {
  line-height: 1.7;
}
.ai-rich-response strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
}
</style>
