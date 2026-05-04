const symbols = ['FPT', 'VNM', 'VIC'];
const urls = [
  s => `https://tcdn.tcbs.com.vn/avatar/${s}_mac.png`,
  s => `https://finance.vietstock.vn/image/${s}.png`,
  s => `https://api.simplize.vn/api/company/fiin/profile/${s}`,
  s => `https://static.dnse.com.vn/logo/${s}.png`,
  s => `https://static.entrade.com.vn/logo/${s}.png`,
  s => `https://image.vietstock.vn/corp/${s}.png`,
  s => `https://finfo-api.vndirect.com.vn/v4/company_logo/${s}`,
  s => `https://vndirect.com.vn/logo/${s}.png`
];

async function check() {
  for (const s of symbols) {
    for (const fn of urls) {
      const u = fn(s);
      try {
        const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const ct = r.headers.get('content-type');
        console.log(s, u, r.status, ct);
      } catch (e) {
        console.log(s, u, 'ERROR');
      }
    }
  }
}
check();
