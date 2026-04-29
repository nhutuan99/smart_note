<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SettingsPreferences from '@/modules/settings/components/SettingsPreferences.vue'
import SettingsProfile from '@/modules/settings/components/SettingsProfile.vue'
import SettingsStorage from '@/modules/settings/components/SettingsStorage.vue'
import SettingsSecurity from '@/modules/settings/components/SettingsSecurity.vue'
import SettingsNotifications from '@/modules/settings/components/SettingsNotifications.vue'
import SettingsBugReport from '@/modules/settings/components/SettingsBugReport.vue'
import SettingsAccount from '@/modules/settings/components/SettingsAccount.vue'

const { t } = useI18n()
</script>

<template>
  <div class="max-w-[43.75rem]">
    <h1 class="mb-6 text-2xl font-bold tracking-tight md:mb-8">{{ t('settings.title') }}</h1>

    <SettingsPreferences />
    <SettingsProfile />
    <SettingsStorage />
    <SettingsSecurity />
    <SettingsNotifications />
    <SettingsBugReport />
    <SettingsAccount />

    <!-- Footer -->
    <div class="mt-12 mb-8 text-center">
      <div class="mb-2 flex items-center justify-center gap-2">
        <img
          src="/images/logo-512.png"
          alt="FinNote Logo"
          class="h-6 w-6 opacity-80"
        />
        <span class="text-text-secondary font-semibold tracking-wide">FinNote</span>
      </div>
      <p class="text-text-tertiary text-xs">
        &copy; {{ new Date().getFullYear() }} Antigravity. All rights reserved.
      </p>
    </div>
  </div>
</template>
