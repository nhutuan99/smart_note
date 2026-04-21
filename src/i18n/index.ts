import { createI18n } from 'vue-i18n'
import vi from './vi'
import en from './en'

const savedLocale = localStorage.getItem('sn_locale') || 'vi'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'vi',
  messages: { vi, en }
})

export function setLocale(locale: 'vi' | 'en') {
  ;(i18n.global.locale as any).value = locale
  localStorage.setItem('sn_locale', locale)
  document.documentElement.lang = locale
}

export function currentLocale(): string {
  return (i18n.global.locale as any).value
}

export default i18n
