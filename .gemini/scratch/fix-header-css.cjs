const fs = require('fs');

let c = fs.readFileSync('src/App.vue', 'utf8');

// Fix CSS: grid → flex
c = c.replace(
  /display: grid;\s*\r?\n\s*grid-template-columns: 1fr auto 1fr;\s*\r?\n\s*align-items: center;/,
  'display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;'
);

// Remove justify-content: center from logo
c = c.replace(
  /\.public-header__logo \{\s*\r?\n\s*display: flex;\s*\r?\n\s*align-items: center;\s*\r?\n\s*justify-content: center;\s*\r?\n\s*gap/,
  '.public-header__logo {\r\n  display: flex;\r\n  align-items: center;\r\n  gap'
);

// Change right section
c = c.replace(
  /\.public-header__right \{\s*\r?\n\s*display: flex;\s*\r?\n\s*justify-content: flex-end;\s*\r?\n\}/,
  '.public-header__right {\r\n  display: flex;\r\n  align-items: center;\r\n}'
);

fs.writeFileSync('src/App.vue', c);
console.log('✅ CSS fixed: grid → flex');
