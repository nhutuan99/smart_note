const fs = require('fs');

// Fix SettingsSecurity.vue
let sec = fs.readFileSync('src/modules/settings/components/SettingsSecurity.vue', 'utf8');
// Replace hardcoded Vietnamese text with i18n
sec = sec.replace(
  "forgotPinLoading ? 'Đang xử lý...' : t('common.confirm')",
  "forgotPinLoading ? t('common.processing') : t('common.confirm')"
);
sec = sec.replace(
  "forgotPinLoading ? 'Đang xử lý...' : t('settings.savePin')",
  "forgotPinLoading ? t('common.processing') : t('settings.savePin')"
);
// Fix indentation (19 spaces → proper alignment)
sec = sec.replace(
  /^                   <span>{{ forgotPinLoading/gm,
  '                      <span>{{ forgotPinLoading'
);
fs.writeFileSync('src/modules/settings/components/SettingsSecurity.vue', sec);
console.log('✅ SettingsSecurity.vue fixed');

// Fix PinDialog.vue
let pin = fs.readFileSync('src/components/PinDialog.vue', 'utf8');
pin = pin.replace(
  "loading ? 'Đang xử lý...' : t('pin.confirm')",
  "loading ? t('common.processing') : t('pin.confirm')"
);
// Fix indentation
pin = pin.replace(
  /^                   <span>{{ loading/gm,
  '            <span>{{ loading'
);
fs.writeFileSync('src/components/PinDialog.vue', pin);
console.log('✅ PinDialog.vue fixed');

// Fix SettingsAccount.vue
let acc = fs.readFileSync('src/modules/settings/components/SettingsAccount.vue', 'utf8');
acc = acc.replace(
  "deleteLoading ? 'Đang xử lý...' : t('settings.deleteConfirmBtn')",
  "deleteLoading ? t('common.processing') : t('settings.deleteForever')"
);
// Fix indentation
acc = acc.replace(
  /^                   <span>{{ deleteLoading/gm,
  '                  <span>{{ deleteLoading'
);
fs.writeFileSync('src/modules/settings/components/SettingsAccount.vue', acc);
console.log('✅ SettingsAccount.vue fixed');
