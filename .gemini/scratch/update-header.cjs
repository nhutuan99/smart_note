const fs = require('fs');

// 1. Update App.vue
let appVue = fs.readFileSync('src/App.vue', 'utf8');

// Add setLocale import
if (!appVue.includes('setLocale')) {
  appVue = appVue.replace(/import \{ useI18n \} from 'vue-i18n'/, "import { useI18n } from 'vue-i18n'\nimport { setLocale } from '@/i18n'");
}

// Add locale extraction
if (!appVue.includes('const { t, locale } = useI18n()')) {
  appVue = appVue.replace(/const \{ t \} = useI18n\(\)/, 'const { t, locale } = useI18n()');
}

// Update public-header__right
const rightHtml = `<div class="public-header__right">
            <router-link to="/login" class="public-header__btn">
              {{ t('common.login') }}
            </router-link>
          </div>`;

const newRightHtml = `<div class="public-header__right flex items-center gap-2 sm:gap-4">
            <div class="flex items-center gap-1">
              <button 
                @click="setLocale('vi')"
                :class="['text-[0.8125rem] font-semibold transition-colors rounded-lg px-2 py-1.5', locale === 'vi' ? 'text-accent bg-accent-subtle' : 'text-text-tertiary hover:text-text-primary hover:bg-bg-hover']"
              >
                VI
              </button>
              <span class="text-border-strong text-xs select-none">|</span>
              <button 
                @click="setLocale('en')"
                :class="['text-[0.8125rem] font-semibold transition-colors rounded-lg px-2 py-1.5', locale === 'en' ? 'text-accent bg-accent-subtle' : 'text-text-tertiary hover:text-text-primary hover:bg-bg-hover']"
              >
                EN
              </button>
            </div>
            <router-link to="/login" class="public-header__btn shrink-0">
              {{ t('common.login') }}
            </router-link>
          </div>`;

if (appVue.includes(rightHtml)) {
  appVue = appVue.replace(rightHtml, newRightHtml);
}

// Update max-width in CSS
appVue = appVue.replace(/max-width: 52rem;/, 'max-width: 72rem;\n  padding: 1rem 1.5rem;\n');

// Wait, the original css was:
// .public-header__container {
//   max-width: 52rem;
//   margin: 0 auto;
//   padding: 1rem 1.5rem;

appVue = appVue.replace(/max-width: 52rem;[\s\S]*?padding: 1rem 1\.5rem;/, 'max-width: 72rem;\n  margin: 0 auto;\n  padding: 1rem 1rem;\n  @media (min-width: 640px) {\n    padding: 1rem 2rem;\n  }');

fs.writeFileSync('src/App.vue', appVue);
console.log('App.vue updated');

// 2. Remove from BlogDetailView.vue
let blogDetail = fs.readFileSync('src/views/BlogDetailView.vue', 'utf8');
const detailRegex = /<!-- Language Switcher \([\s\S]*?<\/button>\s*<\/div>/;
if (detailRegex.test(blogDetail)) {
  blogDetail = blogDetail.replace(detailRegex, '');
  fs.writeFileSync('src/views/BlogDetailView.vue', blogDetail);
  console.log('BlogDetailView.vue updated');
}

// 3. Remove from BlogListView.vue
let blogList = fs.readFileSync('src/views/BlogListView.vue', 'utf8');
if (detailRegex.test(blogList)) {
  blogList = blogList.replace(detailRegex, '');
  fs.writeFileSync('src/views/BlogListView.vue', blogList);
  console.log('BlogListView.vue updated');
}
