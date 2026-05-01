<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number | string | null
  placeholder?: string
  className?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const formattedValue = computed(() => {
  const num = parseInt(String(props.modelValue || '0').replace(/[^0-9]/g, ''))
  return num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : ''
})

function handleInput(e: Event) {
  const input = e.target as HTMLInputElement
  const raw = input.value.replace(/[^0-9]/g, '')
  const num = parseInt(raw || '0')
  
  if (input.value !== formattedValue.value) {
    emit('update:modelValue', num)
    input.value = num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : ''
  } else {
    emit('update:modelValue', num)
  }
}

function blockNonNumeric(e: KeyboardEvent) {
  const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
  if (allowed.includes(e.key)) return
  if (e.ctrlKey || e.metaKey) return
  if (!/^\d$/.test(e.key)) {
    e.preventDefault()
  }
}
</script>

<template>
  <input
    :value="formattedValue"
    @input="handleInput"
    @keydown="blockNonNumeric"
    type="tel"
    inputmode="numeric"
    pattern="[0-9]*"
    :placeholder="placeholder || '0'"
    :class="className"
  />
</template>
