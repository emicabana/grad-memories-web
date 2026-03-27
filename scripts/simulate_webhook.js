const http = require('http');
const [,, prefId, paymentId, status] = process.argv;
if(!prefId){
  console.error('Usage: node scripts/simulate_webhook.js <preference_id> [payment_id] [status]');
  process.exit(1);
}
const payload = { __simulate: true, preference_id: prefId, id: paymentId || ('SIM-'+Date.now()), status: status || 'approved' };
const options = {
  hostname: 'localhost', port: 3000, path: '/api/payments/webhook/mercadopago', method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};
const req = http.request(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('status', res.statusCode);
    try{ console.log(JSON.parse(data)); }catch(e){ console.log(data); }
  });
});
req.on('error', console.error);
req.write(JSON.stringify(payload));
req.end();
