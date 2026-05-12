const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.vue')) {
        results.push(file);
      }
    }
  });
  return results;
}

const vueFiles = walk(path.join(__dirname, '../../src'));

vueFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Pattern 1: Loader2 followed by <template v-else> containing <span> and <icon>
  // <Loader2 v-if="loading" :size="18" class="animate-spin" />
  // <template v-else>
  //   <span>{{ text }}</span>
  //   <ArrowRight :size="16" />
  // </template>
  const regexTemplate = /<Loader2\s+v-if="([^"]+)"\s+:size="([^"]+)"\s+class="animate-spin(.*?)?"\s*\/>\s*<template\s+v-else>\s*(<svg[\s\S]*?<\/svg>|<[A-Z][A-Za-z0-9]+\s+[^>]*\/>)?\s*(<span[^>]*>.*?<\/span>)\s*(<svg[\s\S]*?<\/svg>|<[A-Z][A-Za-z0-9]+\s+[^>]*\/>)?\s*<\/template>/g;

  content = content.replace(regexTemplate, (match, condition, size, spinClass, icon1, span, icon2) => {
    let result = `<Loader2 v-if="${condition}" :size="${size}" class="animate-spin${spinClass || ''}" />\n`;
    if (icon1) {
      // Add v-if="!condition" to the icon
      if (icon1.startsWith('<svg')) {
        icon1 = icon1.replace('<svg', `<svg v-if="!${condition}"`);
      } else {
        icon1 = icon1.replace('<', `<`);
        // we can just wrap icon1 in a template if it doesn't easily accept v-if, but vue components accept v-if
        icon1 = icon1.replace(/\s*\/>/, ` v-if="!${condition}" />`);
      }
      result += `            ${icon1}\n`;
    }
    result += `            ${span}\n`;
    if (icon2) {
      if (icon2.startsWith('<svg')) {
        icon2 = icon2.replace('<svg', `<svg v-if="!${condition}"`);
      } else {
        icon2 = icon2.replace(/\s*\/>/, ` v-if="!${condition}" />`);
      }
      result += `            ${icon2}`;
    }
    return result;
  });

  // Pattern 2: Loader2 followed by <span v-else>
  // <Loader2 v-if="loading" :size="20" class="animate-spin mr-1" />
  // <span v-else>{{ text }}</span>
  const regexSpan = /<Loader2\s+v-if="([^"]+)"\s+:size="([^"]+)"\s+class="animate-spin(.*?)"\s*\/>\s*<span\s+v-else([^>]*)>(.*?)<\/span>/g;
  content = content.replace(regexSpan, (match, condition, size, extraClass, spanAttrs, spanContent) => {
    // We remove v-else and keep the text always visible
    return `<Loader2 v-if="${condition}" :size="${size}" class="animate-spin mr-2" />\n                  <span${spanAttrs}>{{ ${condition} ? 'Đang xử lý...' : ${spanContent.trim().replace(/^\{\{\s*(.*?)\s*\}\}$/, '$1')} }}</span>`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed button UI in ${file}`);
  }
});
