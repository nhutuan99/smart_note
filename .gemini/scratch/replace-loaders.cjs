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

  // Regex to match <LogoLoader ... :size="X" ... /> where X is between 10 and 20
  // Or without size but inside a button (we'll just replace sizes < 24)
  const regex = /<LogoLoader\s+(.*?):size="([1][0-9]|20)"(.*?)\/?>/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, (match, before, size, after) => {
      if (match.includes('showGlow')) return match; // skip if it has glow
      return `<Loader2 ${before}:size="${size}" class="animate-spin"${after}/>`;
    });
    
    // Auto import Loader2 from lucide-vue-next
    if (content !== originalContent) {
      if (!content.includes('Loader2')) {
        if (content.includes('lucide-vue-next')) {
          content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-vue-next['"]/, (match, imports) => {
            if (!imports.includes('Loader2')) {
              return `import { ${imports.trim()}, Loader2 } from 'lucide-vue-next'`;
            }
            return match;
          });
        } else {
          // Add import after script setup
          content = content.replace(/<script setup lang="ts">/, `<script setup lang="ts">\nimport { Loader2 } from 'lucide-vue-next'`);
        }
      }
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
});
