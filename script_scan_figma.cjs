const token = process.env.FIGMA_TOKEN;
const fileKey = 'WGeiQC4u7Us1H4hssSLs3u';

async function run() {
  console.log('Fetching file...');
  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { 'X-Figma-Token': token }
  }).then(r => r.json());
  
  if (res.err) {
    console.error(res.err);
    return;
  }
  
  const searchMap = {
    'zalopay': [],
    'vnpay': [],
    'shopeepay': [],
    'viettelpay': [],
    'viettel money': [],
    'visa': [],
    'mastercard': [],
    'techcombank': [],
    'momo': [],
    'tpbank': [],
  };

  function traverse(node) {
    if (node.name) {
      const lower = node.name.toLowerCase();
      for (const key of Object.keys(searchMap)) {
        if (lower.includes(key)) {
          searchMap[key].push({ id: node.id, name: node.name, type: node.type });
        }
      }
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(res.document);
  console.log(JSON.stringify(searchMap, null, 2));
}
run();
