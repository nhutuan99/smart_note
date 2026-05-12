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

  // Regex to match Loader2 tag with class="animate-spin" and another class="something"
  // It should merge them.
  const regex = /<Loader2(.*?)class="animate-spin"\s+class="(.*?)"(.*?)\/?>/g;
  if (regex.test(content)) {
    content = content.replace(regex, (match, before, otherClasses, after) => {
      return `<Loader2${before}class="animate-spin ${otherClasses}"${after}/>`;
    });
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Merged duplicate classes in ${file}`);
  }
});
