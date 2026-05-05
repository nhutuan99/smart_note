<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SettingsPreferences from '@/modules/settings/components/SettingsPreferences.vue'
import SettingsProfile from '@/modules/settings/components/SettingsProfile.vue'
import SettingsStorage from '@/modules/settings/components/SettingsStorage.vue'
import SettingsSecurity from '@/modules/settings/components/SettingsSecurity.vue'
import SettingsNotifications from '@/modules/settings/components/SettingsNotifications.vue'
import SettingsBugReport from '@/modules/settings/components/SettingsBugReport.vue'
import SettingsAccount from '@/modules/settings/components/SettingsAccount.vue'
import SettingsAppDownload from '@/modules/settings/components/SettingsAppDownload.vue'

const { t } = useI18n()

type TabKey = 'general' | 'profile' | 'security' | 'other'

const activeTab = ref<TabKey>('general')

const tabs = [
  { key: 'general', label: 'settings.tabs.general' },
  { key: 'profile', label: 'settings.tabs.profile' },
  { key: 'security', label: 'settings.tabs.security' },
  { key: 'other', label: 'settings.tabs.other' }
] as const
</script>

<template>
  <div class="max-w-[43.75rem] pb-8">
    <h1 class="mb-4 text-2xl font-bold tracking-tight md:mb-6">{{ t('settings.title') }}</h1>

    <!-- Tabs Navigation -->
    <div class="mb-6 flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors"
        :class="[
          activeTab === tab.key
            ? 'bg-accent text-white shadow-md'
            : 'bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary'
        ]"
      >
        {{ t(tab.label) }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="min-h-[60vh]">
      <!-- General Tab -->
      <div v-show="activeTab === 'general'" class="space-y-6">
        <SettingsPreferences />
        <SettingsAppDownload />
      </div>

      <!-- Profile Tab -->
      <div v-show="activeTab === 'profile'" class="space-y-6">
        <SettingsProfile />
        <SettingsAccount />
      </div>

      <!-- Security Tab -->
      <div v-show="activeTab === 'security'" class="space-y-6">
        <SettingsSecurity />
        <SettingsStorage />
      </div>

      <!-- Other Tab -->
      <div v-show="activeTab === 'other'" class="space-y-6">
        <SettingsNotifications />
        <SettingsBugReport />
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-12 mb-4 text-center">
      <div class="mb-2 flex items-center justify-center gap-2">
        <img
          src="/images/logo-512.png"
          alt="FinNote Logo"
          class="h-6 w-6 opacity-80"
        />
        <span class="text-text-secondary font-semibold tracking-wide">FinNote</span>
      </div>
      <p class="text-text-tertiary text-xs">
        &copy; {{ new Date().getFullYear() }} FinNote. All rights reserved.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Hide scrollbar for tabs */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
