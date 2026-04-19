const fs = require('fs');
const https = require('https');

const urls = {
  'zalopay.png': 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-ZaloPay-Square.png',
  'visa.png': 'https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png',
  'shopeepay.png': 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-ShopeePay-V.png',
  'vnpay.png': 'https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png',
  'viettelpay.png': 'https://cdn.vietqr.io/img/VIETTELMONEY.png'
};

Object.entries(urls).forEach(([filename, url]) => {
  https.get(url, (res) => {
    // some CDNs redirect or block, we can just pipe
    const path = `public/images/wallets/${filename}`;
    const file = fs.createWriteStream(path);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Downloaded', filename);
    });
  }).on('error', (err) => {
    console.error('Error downloading', filename, err.message);
  });
});
