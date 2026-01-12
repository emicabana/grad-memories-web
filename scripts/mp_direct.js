const https = require('https');
const token = process.env.MP_ACCESS_TOKEN || 'TEST-1544836007225622-121317-32debfa8783e5eeb16e59312dbdc67b8-468078336';
const preference = { items: [{ title: 'test', quantity:1, currency_id:'ARS', unit_price:250.00 }], notification_url: 'https://example.com/webhook' };
const postData = JSON.stringify(preference);
const options = { hostname: 'api.mercadopago.com', path:'/checkout/preferences', method:'POST', headers: { 'Content-Type':'application/json', 'Content-Length': Buffer.byteLength(postData), Authorization: 'Bearer '+token } };
const req = https.request(options, res=>{ let data=''; res.on('data', c=>data+=c); res.on('end', ()=>{ console.log('status', res.statusCode); try{ console.log(JSON.parse(data)); }catch(e){ console.log('raw', data); } }); });
req.on('error', console.error);
req.write(postData); req.end();
