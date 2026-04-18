---
name: vue-expert
description: "Coding rules & architecture standards for Smart Note — Vue 3 enterprise application. ALL generated code MUST comply with these rules. Based on Feature-Sliced Design, SOLID principles, and enterprise security patterns."
---

# Smart Note — Vue 3 Enterprise Coding Standards

> Tài liệu quy tắc kiến trúc cấp doanh nghiệp cho dự án Smart Note.
> Mọi code sinh ra phải tuân thủ 100% các quy tắc dưới đây.

---

## Tech Stack (Không được thay đổi)

| Layer | Technology | Version |
|---|---|---|
| Framework | Vue 3 (`<script setup lang="ts">`) | 3.5+ |
| Build | Vite | 6+ |
| Language | TypeScript (`strict: true`) | 5.7+ |
| State | Pinia (Composition API only) | 2.3+ |
| Router | Vue Router 4 (lazy-loaded routes) | 4.5+ |
| Styling | Tailwind CSS v4 (utility-first) | 4.2+ |
| Icons | `lucide-vue-next` | — |
| Formatting | Prettier (`.prettierrc`) | 3.8+ |
| Linting | ESLint + `vue3-recommended` + `eslint-config-prettier` | — |
| Pre-commit | Husky + lint-staged | — |

---

## 1. Kiến Trúc Thư Mục — Feature-Sliced Design (FSD)

> **Nguyên tắc cốt lõi:** Nhóm mã theo lĩnh vực nghiệp vụ, không theo loại kỹ thuật.
> Phụ thuộc đơn hướng: lớp trên chỉ import từ lớp dưới. [cite: 23, 28]

### 1.1. Phân Tầng (Layers) — Luồng phụ thuộc một chiều

```
App → Pages → Widgets → Features → Entities → Shared
 ↓       ↓        ↓         ↓          ↓         ↓
(cao)                                          (thấp)
```

**Quy tắc bất di bất dịch:** Module ở lớp cao KHÔNG ĐƯỢC import từ lớp ngang hàng hoặc cao hơn. [cite: 28, 30]

| Layer | Trách nhiệm | Ví dụ trong Smart Note |
|---|---|---|
| **App** | Khởi tạo, global config, router setup | `main.ts`, `App.vue`, `router/index.ts` |
| **Pages** | Route-level views, lắp ráp widgets/features | `views/DashboardView.vue` |
| **Widgets** | Khối UI phức tạp tái sử dụng nhiều trang | `AppHeader`, `AppSidebar`, `AppLayout` |
| **Features** | Logic nghiệp vụ cụ thể có giá trị | `auth/`, `notes/`, `finance/` |
| **Entities** | Đối tượng nghiệp vụ + Pinia store + API | `User`, `Transaction`, `Wallet` |
| **Shared** | UI kit, utils, composables, HTTP client | `useEventListener`, `generateId`, `ErrorBoundary` |

### 1.2. Cấu trúc thư mục hiện tại (giai đoạn chuyển tiếp)

```
src/
├── app/                    ← main.ts, App.vue, global styles
├── pages/                  ← Route views (rename từ views/)
├── components/
│   ├── layout/             ← AppLayout, AppHeader, AppSidebar (→ widgets)
│   └── ui/                 ← ErrorBoundary, ToastContainer, base components
├── features/
│   ├── auth/               ← Auth store, login logic
│   │   ├── model/          ← useAuthStore (Pinia)
│   │   ├── ui/             ← LoginForm components
│   │   └── index.ts        ← Public API ⚠️ BẮT BUỘC
│   ├── notes/              ← Notes store, composables
│   │   ├── model/
│   │   ├── api/
│   │   ├── ui/
│   │   └── index.ts
│   └── finance/            ← Wallets + Transactions
│       ├── model/
│       ├── api/
│       ├── ui/
│       └── index.ts
├── shared/
│   ├── api/                ← HTTP client, repositories
│   ├── composables/        ← useEventListener, generic hooks
│   ├── utils/              ← generateId, storage helpers
│   ├── types/              ← TypeScript interfaces
│   └── ui/                 ← Base UI components
├── router/
└── constants/
```

### 1.3. Public API Enforcer — Quy tắc không thương lượng

Mỗi feature folder **BẮT BUỘC** có `index.ts`. Lớp cao hơn chỉ import từ `index.ts`. [cite: 56, 57]

```typescript
// ✅ CORRECT — import từ public API
import { useAuthStore, LoginForm } from '@/features/auth'

// ❌ WRONG — import trực tiếp file nội bộ
import { useAuthStore } from '@/features/auth/model/authStore'
```

---

## 2. Nguyên Lý SOLID Trong Vue 3

### 2.1. Single Responsibility Principle (SRP) [cite: 58, 61]

**Quy tắc:** Một `.vue` file chỉ xử lý template binding + event handling.
Logic nghiệp vụ, API calls, computed phức tạp → trích xuất thành **composables**.

```typescript
// ✅ CORRECT: View dùng composable
// pages/TransactionsView.vue
const { transactions, deleteTransaction, filters } = useTransactionList()

// ❌ WRONG: View chứa raw API calls + filtering + formatting
```

**Ngưỡng cảnh báo:** `<script setup>` vượt quá **80 dòng** → phải extract composable.

### 2.2. Open/Closed Principle (OCP) [cite: 64]

Dùng `<slot>` và `<component :is>` để mở rộng, không sửa mã gốc component.

```vue
<!-- ✅ BaseCard mở rộng qua slots -->
<BaseCard>
  <template #header>Custom Header</template>
  <template #default>Content</template>
</BaseCard>

<!-- ❌ WRONG: Thêm v-if vào BaseCard cho mỗi variant mới -->
```

### 2.3. Liskov Substitution Principle (LSP) [cite: 66, 67]

Wrapper components phải truyền qua **tất cả** native attrs:

```vue
<!-- ✅ BaseButton giữ nguyên hành vi button gốc -->
<template>
  <button v-bind="$attrs" class="btn-base"><slot /></button>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })
</script>
```

### 2.4. Interface Segregation Principle (ISP) [cite: 69]

Tách composables nhỏ, chuyên biệt. Component chỉ consume đúng thứ nó cần.

```typescript
// ❌ God composable
export function useFinance() { /* wallets + transactions + stats + filters */ }

// ✅ Split theo concern
export function useWallets() { ... }
export function useTransactions() { ... }
export function useFinanceStats() { ... }
```

### 2.5. Dependency Inversion Principle (DIP) + Repository Pattern [cite: 72, 74]

Module cấp cao không phụ thuộc cấp thấp. Cả hai phụ thuộc abstraction.

```typescript
// shared/api/httpClient.ts — Base abstraction
export function createHttpClient(baseUrl: string) { ... }

// features/notes/api/noteRepository.ts — Domain-specific
export const noteRepository = {
  getAll: () => httpClient.get<Note[]>('/api/notes'),
  getById: (id: string) => httpClient.get<Note>(`/api/notes/${id}`),
  create: (data: Partial<Note>) => httpClient.post<Note>('/api/notes', data),
}

// ✅ Component inject/import repository, không gọi fetch trực tiếp
// ❌ NEVER: fetch('/api/notes') trong component
```

---

## 3. Component Rules

### 3.1. Luôn dùng `<script setup lang="ts">`

```vue
<!-- ✅ CORRECT -->
<script setup lang="ts">
import { ref, computed } from 'vue'
</script>

<!-- ❌ NEVER Options API -->
<script>
export default { data() { ... } }
</script>
```

### 3.2. Props & Emits — Luôn có TypeScript types

```typescript
// ✅ CORRECT
const props = defineProps<{
  title: string
  count?: number
}>()

const emit = defineEmits<{
  update: [value: string]
  delete: []
}>()

// ❌ WRONG: untyped
const props = defineProps(['title', 'count'])
```

### 3.3. Naming conventions

| Loại | Convention | Ví dụ |
|---|---|---|
| Component files | PascalCase | `ErrorBoundary.vue`, `WalletCard.vue` |
| Component in template | PascalCase | `<ErrorBoundary>` (không `<error-boundary>`) |
| Composables | camelCase + `use` prefix | `useEventListener.ts` |
| Stores | camelCase + `use` + `Store` suffix | `useAuthStore` |
| Types/Interfaces | PascalCase | `Transaction`, `ApiResponse<T>` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_WALLETS`, `TOKEN_KEY` |

---

## 4. Reactivity & Render Optimization [cite: 75, 80-86]

### 4.1. `ref()` > `reactive()`

```typescript
// ✅ ref — clear .value, safe destructuring
const count = ref(0)
const user = ref<User | null>(null)

// ❌ reactive — loses reactivity on destructure
const state = reactive({ count: 0 })
```

### 4.2. `shallowRef` cho data sets lớn

Khi toàn bộ array/object được thay thế (không mutate từng item):

```typescript
// ✅ API data thay thế toàn bộ
const transactions = shallowRef<Transaction[]>([])
transactions.value = [...newData] // Triggers reactivity
```

### 4.3. Template render optimization

```vue
<!-- ✅ Static content — never re-renders -->
<h2 v-once>Dashboard</h2>
<span v-once class="label">MENU</span>

<!-- ✅ Memoize expensive v-for items -->
<div v-for="tx in transactions" :key="tx.id" v-memo="[tx.id, tx.amount, tx.type]">
  ...
</div>
```

### 4.4. `computed` > manual caching

```typescript
// ✅ CORRECT
const fullName = computed(() => `${first.value} ${last.value}`)

// ❌ WRONG: manual caching with watch
let cached = ''
watch([first, last], () => { cached = `...` })
```

### 4.5. Cleanup side effects — BẮT BUỘC

```typescript
// ✅ CORRECT — auto cleanup via composable
useEventListener(document, 'keydown', handleKeydown)

// ❌ WRONG — manual, error-prone, risk memory leak
onMounted(() => document.addEventListener('keydown', fn))
onUnmounted(() => document.removeEventListener('keydown', fn))
```

---

## 5. Error Handling — Khả năng khôi phục [cite: 91, 93]

### 5.1. Global error handler (main.ts) — BẮT BUỘC

```typescript
app.config.errorHandler = (err, instance, info) => {
  console.error('[Global Error]', err, info)
  // Future: Sentry.captureException(err)
}
```

### 5.2. ErrorBoundary component

Bọc widgets/features phức tạp bằng `<ErrorBoundary>` dùng `onErrorCaptured`:
- Catch lỗi descendant → hiển thị fallback UI
- Return `false` để chặn lan truyền
- App còn lại (nav, sidebar) vẫn hoạt động

### 5.3. Async operations — luôn try/catch

```typescript
// ✅ CORRECT
async function fetchNotes() {
  loading.value = true
  try {
    notes.value = await noteRepo.getAll()
  } catch (err) {
    console.error('[Notes] Fetch failed:', err)
    ui.showToast('error', 'Failed to load notes')
  } finally {
    loading.value = false
  }
}

// ❌ NEVER swallow errors
try { ... } catch {} // Silent failure = debugging nightmare
```

---

## 6. Pinia Store Rules

### 6.1. Composition API only

```typescript
// ✅ CORRECT
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => !!token.value)
  return { token, isAuthenticated }
})

// ❌ WRONG: Options API
export const useAuthStore = defineStore('auth', { state: () => ({}) })
```

### 6.2. Một domain duy nhất mỗi store

```
stores/auth.ts         → Auth only
stores/wallets.ts      → Wallet CRUD + balance
stores/transactions.ts → Transaction CRUD + filters
stores/ui.ts           → UI state (sidebar, toasts)
```

❌ KHÔNG tạo monolith store trộn nhiều domain.

### 6.3. Không gọi `useStore()` ngoài Vue context

```typescript
// ❌ WRONG: module top level (Pinia chưa install)
const auth = useAuthStore()

// ✅ CORRECT: trong setup() hoặc composable
function useMyFeature() {
  const auth = useAuthStore()
}
```

---

## 7. Security — Rào chắn bảo mật [cite: 133, 135, 138, 140]

### 7.1. XSS Prevention

```vue
<!-- ❌ XSS vulnerability — NGHIÊM CẤM -->
<div v-html="userInput"></div>

<!-- ✅ Vue auto-escapes -->
<div>{{ userInput }}</div>

<!-- ✅ Nếu BẮT BUỘC dùng v-html → sanitize trước -->
<div v-html="DOMPurify.sanitize(content)"></div>
```

### 7.2. Không bao giờ nhúng secrets vào frontend

```typescript
// ❌ NEVER — ai cũng đọc được qua DevTools
const API_KEY = 'sk-abc123...'
const R2_SECRET = '...'

// ✅ Secrets chỉ nằm trên backend (Cloudflare Worker)
// Frontend chỉ nhận presigned URLs hoặc session tokens
```

### 7.3. Auth token storage

```typescript
// Hiện tại (mock): localStorage chấp nhận tạm
// ⚠️ PRODUCTION: JWT PHẢI ở HttpOnly + Secure + SameSite cookies
// Frontend KHÔNG BAO GIỜ đọc/ghi JWT trực tiếp
```

### 7.4. CSRF Protection (khi có real backend)

```typescript
// HttpClient interceptor tự động đính kèm CSRF token
// vào header X-CSRF-Token cho mọi POST/PUT/DELETE request
```

### 7.5. Content Security Policy (CSP)

Khi deploy production: dùng `vite-plugin-csp-guard` để auto-generate SHA-256 hashes
cho inline scripts/styles vào CSP header. [cite: 135]

---

## 8. Cloud Storage Pattern — Presigned URLs [cite: 99, 102]

### 8.1. Upload flow (khi tích hợp R2)

```
Frontend                    Backend                    Cloudflare R2
   │                           │                           │
   ├─── POST /api/upload ─────►│                           │
   │    {fileName, type, size} │                           │
   │                           ├── AWS Sig v4 signing ──►  │
   │                           │   (Secret key stays here) │
   │◄── presignedUrl ──────────┤                           │
   │                           │                           │
   ├─── PUT presignedUrl ──────┼───────────────────────────►
   │    (binary data direct)   │                           │
   │◄── 200 OK ───────────────┼───────────────────────────┤
```

### 8.2. Large files — Multipart upload composable

```typescript
// useS3Upload composable phải:
// 1. AbortController cho cleanup khi component unmount
// 2. File.slice() chia chunks 5-10MB
// 3. Promise.all() upload song song
// 4. Exponential backoff retry cho chunk lỗi
// 5. ref() tracking progress cho UI thanh tiến trình
```

---

## 9. Testing Strategy [cite: 120, 121, 127]

### 9.1. Unit tests (Vitest) — kề cận source

```
features/auth/
├── model/
│   ├── authStore.ts
│   └── authStore.spec.ts    ← Ngay cạnh source
├── ui/
│   ├── LoginForm.vue
│   └── LoginForm.spec.ts
└── index.ts
```

### 9.2. Coverage threshold: > 85%

### 9.3. E2E (Playwright) — Mock Auth, chặn HTTP

```typescript
// Playwright tests trỏ vào Mock Auth + HTTP interceptors
// KHÔNG gọi real API trong E2E
```

---

## 10. TypeScript Strictness

### 10.1. Không dùng `any` — dùng `unknown` + type narrowing

```typescript
// ❌ WRONG
function parse(data: any) { return data.name }

// ✅ CORRECT
function parse(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'name' in data) {
    return (data as { name: string }).name
  }
  throw new Error('Invalid data')
}
```

### 10.2. Interfaces cho tất cả data models

Mọi API response, store state, component props phải có TypeScript interface trong `types/`.

### 10.3. Strict null checks

```typescript
// ✅ Luôn handle null/undefined
const name = user.value?.name ?? 'Unknown'
```

---

## 11. Import Order Convention

```typescript
// 1. Vue core
import { ref, computed, onMounted } from 'vue'

// 2. Vue ecosystem (router, pinia)
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 3. Project composables
import { useEventListener } from '@/composables/useEventListener'

// 4. Types (always `import type`)
import type { Transaction, Wallet } from '@/types'

// 5. Constants / utils
import { formatVND, getCategoryConfig } from '@/constants/finance'

// 6. Components & icons (last)
import { Plus, Trash2 } from 'lucide-vue-next'
```

---

## 12. Performance Checklist — Trước khi ship feature mới

- [ ] Route là lazy-loaded (`() => import(...)`)
- [ ] Large lists dùng `v-memo` hoặc virtual scrolling
- [ ] Static labels dùng `v-once`
- [ ] API data arrays dùng `shallowRef` khi phù hợp
- [ ] Không có watcher thừa (ưu tiên `computed`)
- [ ] Event listeners dùng `useEventListener` composable (auto-cleanup)
- [ ] Images optimized / lazy loaded
- [ ] Component `<script setup>` ≤ 80 dòng
- [ ] Không duplicate utils (shared/utils/ là single source)
- [ ] Error states được handle (try/catch + user feedback)

---

## References

Kiến trúc dựa trên tài liệu gốc có trích dẫn [cite: 1-165] bao gồm:
- Feature-Sliced Design documentation [cite: 171-177]
- SOLID Principles in Vue 3 [cite: 179-180]
- Vue Render Optimization [cite: 194-196]
- Vue provide/inject patterns [cite: 190-193]
- Security (OWASP, CSP, JWT best practices) [cite: 133-142]