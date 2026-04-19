const fs = require('fs');

const token = process.env.FIGMA_TOKEN;
const fileKey = 'WGeiQC4u7Us1H4hssSLs3u';

const targetNodes = {
  'zalopay': '5:6928',
  'vnpay': '5:6952',
  'shopeepay': '12:1136',
  'viettelpay': '13:1559',
  'momo': '5:3651',
  'visa': '21:10137'
};

async function run() {
  const ids = Object.values(targetNodes).join(',');
  
  // Get image URLs
  console.log('Requesting image exports from Figma...');
  const imgRes = await fetch(`https://api.figma.com/v1/images/${fileKey}?ids=${ids}&format=png&scale=2`, {
    headers: { 'X-Figma-Token': token }
  }).then(r => r.json());

  if (imgRes.err) {
    console.error('API Error:', imgRes.err);
    return;
  }
  
  const reverseMap = Object.entries(targetNodes).reduce((acc, [name, id]) => {
    acc[id] = name;
    return acc;
  }, {});

  if (imgRes.images) {
    for (const [id, url] of Object.entries(imgRes.images)) {
      if (!url) {
        console.error(`Warning: Figma returned empty URL for node ${id}`);
        continue;
      }
      const safeName = reverseMap[id];
      console.log(`Downloading ${safeName} from ${url}`);
      
      const res = await fetch(url);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(`public/images/wallets/${safeName}.png`, buffer);
      console.log(`Saved ${safeName}.png`);
    }
  }
}

run().catch(console.error);
