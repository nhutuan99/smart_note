const fs = require('fs');
const path = require('path');
const vi = JSON.parse(fs.readFileSync('src/locales/vi.json', 'utf8'));

// Flatten the json object to get all keys
function flattenObject(ob) {
  var toReturn = {};
  for (var i in ob) {
    if (!ob.hasOwnProperty(i)) continue;
    if ((typeof ob[i]) == 'object' && ob[i] !== null) {
      var flatObject = flattenObject(ob[i]);
      for (var x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;
        toReturn[i + '.' + x] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
}

const keys = flattenObject(vi);

const vueFiles = [];
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.vue') || fullPath.endsWith('.ts')) {
      vueFiles.push(fullPath);
    }
  }
}
walk('src');

const missing = new Set();
for (const file of vueFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // match t('...') or t("...")
  const regex = /t\(['"]([\w.]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    if (!keys.hasOwnProperty(key)) {
      missing.add(key + ' (in ' + file + ')');
    }
  }
}
console.log('Missing keys:');
console.log([...missing].join('\n'));
