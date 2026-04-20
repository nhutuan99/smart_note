<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { Copy, ShieldCheck, Smartphone, CheckCircle, ArrowRight } from 'lucide-vue-next'

const auth = useAuthStore()
const ui = useUiStore()

function copyWebhookUrl() {
  const url = `https://smart-note-api.tintphcm1.workers.dev/api/webhook/sms?userId=${auth.user?.id}`
  navigator.clipboard.writeText(url).then(() => {
    ui.showToast('success', 'Đã copy đường dẫn thành công!')
  }).catch(() => {
    ui.showToast('error', 'Không thể copy, vui lòng thử lại.')
  })
}
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="mb-8">
      <h2 class="mb-2 text-2xl font-bold tracking-tight">Đồng bộ tự động (iOS)</h2>
      <p class="text-text-secondary text-sm">Ghi nhận giao dịch ngân hàng vào SmartNote hoàn toàn tự động và an toàn tuyệt đối thông qua iOS Shortcuts.</p>
    </div>

    <!-- Intro Card -->
    <div class="card-premium mb-8 overflow-hidden p-0 border-accent/20">
      <div class="bg-accent/10 px-6 py-6 sm:px-8">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div class="bg-bg-primary border-border-default flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border shadow-sm">
            <Smartphone class="text-accent h-8 w-8" />
          </div>
          <div class="flex-1">
            <h3 class="mb-2 text-lg font-bold text-text-primary">Tại sao nên dùng SMS Shortcuts?</h3>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="flex items-start gap-2">
                <ShieldCheck class="text-success h-5 w-5 shrink-0" />
                <p class="text-text-secondary text-[0.8125rem]"><strong>Bảo mật 100%:</strong> Không cần cung cấp mật khẩu đăng nhập ngân hàng.</p>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle class="text-success h-5 w-5 shrink-0" />
                <p class="text-text-secondary text-[0.8125rem]"><strong>Apple Native:</strong> Sử dụng Phím tắt (Shortcuts) mặc định của iPhone.</p>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle class="text-success h-5 w-5 shrink-0" />
                <p class="text-text-secondary text-[0.8125rem]"><strong>Miễn phí:</strong> Không cần qua trung gian bên thứ 3 nào.</p>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle class="text-success h-5 w-5 shrink-0" />
                <p class="text-text-secondary text-[0.8125rem]"><strong>Tức thì:</strong> Vừa có SMS biến động số dư là có trên SmartNote.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Config URL -->
    <div class="mb-8">
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">1. Đường dẫn Webhook của bạn</h3>
      <div class="card-premium p-6">
        <p class="mb-4 text-sm text-text-secondary">Đường dẫn này chứa mã định danh duy nhất của bạn. Tuyệt đối không chia sẻ cho người khác.</p>
        <div class="bg-bg-elevated border-border-default flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
          <code class="text-accent flex-1 break-all text-[0.8125rem] leading-relaxed">
            https://smart-note-api.tintphcm1.workers.dev/api/webhook/sms?userId={{ auth.user?.id || 'YOUR_USER_ID' }}
          </code>
          <button
            class="bg-accent text-bg-primary hover:bg-accent-hover shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            @click="copyWebhookUrl"
          >
            <Copy :size="16" />
            Copy Link
          </button>
        </div>
      </div>
    </div>

    <!-- Setup Guide -->
    <div>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">2. Hướng dẫn thiết lập trên iPhone</h3>
      <div class="card-premium divide-border-default divide-y p-0">
        
        <div class="flex items-start gap-5 px-6 py-5">
          <div class="bg-bg-elevated border-border-default flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-bold text-text-primary">1</div>
          <div class="flex-1 pt-1">
            <h4 class="mb-1 font-semibold text-text-primary">Tạo Tự động hóa mới</h4>
            <p class="text-text-secondary mb-3 text-sm">Mở ứng dụng <strong>Phím tắt (Shortcuts)</strong> có sẵn trên iPhone. Chuyển sang tab <strong>Tự động hóa</strong> ở dưới cùng và bấm dấu <strong>+</strong> ở góc trên bên phải.</p>
          </div>
        </div>

        <div class="flex items-start gap-5 px-6 py-5">
          <div class="bg-bg-elevated border-border-default flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-bold text-text-primary">2</div>
          <div class="flex-1 pt-1">
            <h4 class="mb-1 font-semibold text-text-primary">Chọn điều kiện kích hoạt</h4>
            <p class="text-text-secondary mb-3 text-sm">Cuộn xuống chọn mục <strong>Tin nhắn</strong>.</p>
            <ul class="text-text-secondary list-inside list-disc space-y-1 text-sm">
              <li>Ở phần <strong>Người gửi</strong>, nhập tên tổng đài (VD: <code>Techcombank</code>, <code>TPBank</code>).</li>
              <li>Chọn <strong class="text-text-primary">Chạy ngay lập tức (Run Immediately)</strong> để tự động chạy ngầm.</li>
            </ul>
            <p class="text-text-secondary mt-3 text-sm">Bấm <strong>Tiếp</strong> → chọn <strong>Tạo tự động hóa trống</strong>.</p>
          </div>
        </div>

        <div class="flex items-start gap-5 px-6 py-5">
          <div class="bg-bg-elevated border-border-default flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-bold text-text-primary">3</div>
          <div class="flex-1 pt-1">
            <h4 class="mb-1 font-semibold text-text-primary">Gắn đường dẫn Webhook</h4>
            <p class="text-text-secondary mb-3 text-sm">Bấm <strong>Thêm hành động</strong>, tìm <strong>"URL"</strong> và chọn <strong>Lấy nội dung URL (Get Contents of URL)</strong>. Dán đường dẫn Webhook bạn vừa copy ở Bước 1 vào ô URL.</p>
          </div>
        </div>

        <div class="flex items-start gap-5 px-6 py-5">
          <div class="bg-bg-elevated border-border-default flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-bold text-text-primary">4</div>
          <div class="flex-1 pt-1">
            <h4 class="mb-1 font-semibold text-text-primary">Cấu hình gửi dữ liệu</h4>
            <p class="text-text-secondary mb-3 text-sm">Bấm vào mũi tên nhỏ (Hiển thị thêm) ở hành động vừa thêm:</p>
            <ul class="text-text-secondary list-inside list-disc space-y-2 text-sm">
              <li>Đổi Phương thức thành <strong>POST</strong>.</li>
              <li>Kéo xuống phần <strong>Nội dung yêu cầu</strong> (Thêm trường mới dạng Văn bản).</li>
              <li>Nhập khóa (Key) là <kbd class="bg-bg-elevated border-border-default rounded border px-1.5 py-0.5 font-mono text-xs text-text-primary">text</kbd></li>
              <li>Phần giá trị (Value) chọn <strong>Đầu vào phím tắt (Shortcut Input)</strong>.</li>
            </ul>
            <div class="bg-success/10 border-success/20 mt-4 flex items-center gap-3 rounded-lg border px-4 py-3">
              <CheckCircle class="text-success h-5 w-5 shrink-0" />
              <p class="text-sm font-medium text-text-primary">Bấm <strong>Xong</strong> để lưu. Giao dịch sẽ tự động đổ về từ tin nhắn tiếp theo!</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
