const fs = require('fs');

let c = fs.readFileSync('src/App.vue', 'utf8');

// 1. Remove the empty left placeholder div
c = c.replace(
  '<div class="public-header__left"></div>\r\n          <router-link',
  '<router-link'
);
// Also try LF variant
c = c.replace(
  '<div class="public-header__left"></div>\n          <router-link',
  '<router-link'
);

// 2. Change CSS: grid → flex for header container
c = c.replace(
  'display: grid;\n  grid-template-columns: 1fr auto 1fr;\n  align-items: center;',
  'display: flex;\n  align-items: center;\n  justify-content: space-between;'
);

// 3. Remove justify-content: center from logo (was needed for grid centering)
c = c.replace(
  '  justify-content: center;\n  gap: 0.75rem;',
  '  gap: 0.75rem;'
);

// 4. Change right section from justify-content: flex-end to align-items: center
c = c.replace(
  '.public-header__right {\n  display: flex;\n  justify-content: flex-end;\n}',
  '.public-header__right {\n  display: flex;\n  align-items: center;\n}'
);

fs.writeFileSync('src/App.vue', c);
console.log('✅ App.vue header fixed: grid → flex, logo left-aligned');
