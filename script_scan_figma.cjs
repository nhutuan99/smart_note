const token = process.env.FIGMA_TOKEN;
const fileKey = 'WGeiQC4u7Us1H4hssSLs3u';

async function run() {
  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { 'X-Figma-Token': token }
  }).then(r => r.json());
  
  const searchMap = {
    'techcombank': [],
    'tpbank': [],
    'vietcombank': [],
    'mbbank': [],
    'mb bank': [],
    'bidv': [],
    'agribank': [],
    'vietinbank': [],
    'acb': [],
    'vpbank': [],
    'hdbank': [],
    'sacombank': []
  };

  function traverse(node) {
    if (node && node.name) {
      const lower = node.name.toLowerCase();
      for (const key of Object.keys(searchMap)) {
        if (lower.includes(key)) {
          searchMap[key].push({ id: node.id, name: node.name });
        }
      }
    }
    if (node && node.children) node.children.forEach(traverse);
  }

  traverse(res.document);
  console.log(JSON.stringify(searchMap, null, 2));
}
run();
