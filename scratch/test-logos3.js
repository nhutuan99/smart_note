const https = require('https');

const urls = [
  'https://tcdn.tcbs.com.vn/avatar/a/fpt.png',
  'https://s.cafef.vn/Images/logo/fpt.png',
  'https://s.cafef.vn/Images/logo/FPT.png',
  'https://finance.vietstock.vn/image/FPT.png',
  'https://file.fireant.vn/symbols/FPT.png',
  'https://static.simplize.vn/logo/fpt.png',
  'https://static.dnse.vn/logo/FPT.png',
  'https://wse.vn/img/logo/fpt.png',
  'https://static.tinnhanhchungkhoan.vn/Images/logo/FPT.png',
];

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(`${res.statusCode} - ${url}`);
  }).on('error', (e) => {
    console.error(`ERROR ${url}: ${e.message}`);
  });
});
