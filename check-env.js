async function check() {
  const r1 = await fetch('https://finnote-f4n.pages.dev/');
  const html = await r1.text();
  const match = html.match(/src="(\/assets\/index-[^.]+\.js)"/);
  if (!match) {
    console.log('No index js found in HTML', html.substring(0, 500));
    return;
  }
  const jsUrl = 'https://finnote-f4n.pages.dev' + match[1];
  console.log('Fetching', jsUrl);
  const r2 = await fetch(jsUrl);
  const js = await r2.text();
  if (js.includes('https://smart-note-api.smart-note.workers.dev')) {
    console.log('API_BASE IS PRESENT IN DEPLOYED BUNDLE');
  } else {
    console.log('API_BASE IS MISSING IN DEPLOYED BUNDLE');
  }
}
check();
