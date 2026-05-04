const symbols = ['FPT', 'VNM', 'VIC'];
const urls = [
  s => `https://finance.vietstock.vn/image/avatar/${s}.png`,
  s => `https://tcdn.tcbs.com.vn/avatar/a/${s}.png`,
  s => `https://fireant.vn/api/Data/Markets/CompanyInfo?symbol=${s}`,
  s => `https://iboard.ssi.com.vn/dchart/api/1.1/default/GetCompanyLogo?symbol=${s}`,
  s => `https://s.cafef.vn/Images/logo/${s}.png`,
  s => `https://static2.vietstock.vn/data/HOSE/2020/Avatar/${s}.png`
];

async function check() {
  for (const s of symbols) {
    for (const fn of urls) {
      const u = fn(s);
      try {
        const r = await fetch(u);
        const ct = r.headers.get('content-type');
        console.log(s, u, r.status, ct);
      } catch (e) {
        console.log(s, u, 'ERROR');
      }
    }
  }
}
check();
