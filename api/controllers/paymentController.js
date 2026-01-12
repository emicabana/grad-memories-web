const mercadopago = require('mercadopago');
const https = require('https');
const Order = require('../models/Order');
const Asset = require('../models/Asset');

// Set access token via environment variable
process.env.MERCADOPAGO_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

async function createPreference(req, res){
  try{
    const fs = require('fs');
    fs.appendFileSync('logs/mp_debug.log', `createPreference start ${new Date().toISOString()}\n`);
    const { assetId } = req.body;
    fs.appendFileSync('logs/mp_debug.log', `assetId: ${assetId}\n`);
    if(!assetId) return res.status(400).json({ error: 'No asset id' });
    const asset = await Asset.findById(assetId);
    fs.appendFileSync('logs/mp_debug.log', `asset: ${asset?asset._id:'null'}\n`);
    if(!asset) return res.status(404).json({ error: 'Asset not found' });
    if(asset.soldTo) return res.status(400).json({ error: 'Already sold' });

    const order = new Order({ buyerId: req.user._id, assetId: asset._id, amountCents: asset.priceCents, status: 'pending' });
    await order.save();

    const preference = {
    items: [ { title: asset.filename, quantity: 1, currency_id: 'ARS', unit_price: (asset.priceCents || 0) / 100 } ],
    external_reference: order._id.toString(),
    back_urls: {
      success: `${process.env.SERVER_URL || 'http://localhost:3000'}/checkout/success`,
      failure: `${process.env.SERVER_URL || 'http://localhost:3000'}/checkout/failure`,
      pending: `${process.env.SERVER_URL || 'http://localhost:3000'}/checkout/pending`
    },
    // The webhook route is registered under /api/payments in `api/routes/payments.js`
    notification_url: `${process.env.SERVER_URL || 'http://localhost:3000'}/api/payments/webhook/mercadopago`
  };

  try{
    let mpPref;
    // Create preference via direct HTTPS call to Mercado Pago
    const mpToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN || '';
    if(!mpToken) throw new Error('MP_ACCESS_TOKEN not configured');
    const postData = JSON.stringify(preference);
    const options = {
      hostname: 'api.mercadopago.com',
      path: '/checkout/preferences',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${mpToken}`
      }
    };

    fs.appendFileSync('logs/mp_debug.log', `about to call MP API\n`);
    mpPref = await new Promise((resolve, reject)=>{
      const req = https.request(options, (res)=>{
        let data='';
        res.on('data', (chunk)=> data += chunk);
        res.on('end', ()=>{
          try{ const parsed = JSON.parse(data); resolve(parsed); }catch(err){ reject(err); }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    fs.appendFileSync('logs/mp_debug.log', `mpPref received ${mpPref && mpPref.id}\n`);

    order.mpPreferenceId = mpPref.id || mpPref.preference_id || null;
    await order.save();
    return res.json({ ok: true, init_point: mpPref.init_point || mpPref.sandbox_init_point, preference: mpPref });
  }catch(e){
    console.error('createPreference error', e && (e.stack || e));
    res.status(500).json({ error: 'MP error', details: e && (e.message || String(e)), stack: e && (e.stack || null) });
  }

}catch(err){
    console.error('createPreference outer error', err && (err.stack || err));
    res.status(500).json({ error: 'Server error', details: err && (err.message || String(err)), stack: err && (err.stack || null) });
  }

}

async function webhook(req, res){
  // Mercado Pago will POST notifications; validate by fetching payment/merchant_order
  const topic = req.query.topic || req.query.type;
  const id = req.query.id || (req.body && req.body.data && req.body.data.id) || (req.body && req.body.id);
  try{
    if(!id){ return res.json({ ok: true }); }

    const mpToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN || '';
    const fetchJson = (path) => new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.mercadopago.com',
        path,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${mpToken}` }
      };
      const req = https.request(options, (res)=>{
        let data=''; res.on('data', c=> data+=c); res.on('end', ()=>{
          try{ resolve(JSON.parse(data)); }catch(err){ reject(err); }
        });
      });
      req.on('error', reject); req.end();
    });

    // Try payment
    let payment = null;
    try{ payment = await fetchJson(`/v1/payments/${id}`); }catch(e){ payment = null; }

    if(payment && payment.id){
      const prefId = payment.preference_id || (payment.preference && payment.preference.id);
      const status = payment.status;
      const mpPaymentId = payment.id;
      const order = await Order.findOne({ mpPreferenceId: prefId });
      if(order){
        if(order.status !== 'paid' && status === 'approved'){
          order.status = 'paid'; order.mpPaymentId = mpPaymentId; await order.save();
          const asset = await Asset.findById(order.assetId); if(asset){ asset.soldTo = order.buyerId; await asset.save(); }
        }
      }
      return res.json({ ok: true });
    }

    // Try merchant order
    try{
      const merchant = await fetchJson(`/merchant_orders/${id}`);
      if(merchant && merchant.payments){
        for(const p of merchant.payments || []){
          const prefId = p.preference_id;
          const status = p.status;
          const mpPaymentId = p.id;
          const order = await Order.findOne({ mpPreferenceId: prefId });
          if(order && order.status !== 'paid' && status === 'approved'){
            order.status = 'paid'; order.mpPaymentId = mpPaymentId; await order.save();
            const asset = await Asset.findById(order.assetId); if(asset){ asset.soldTo = order.buyerId; await asset.save(); }
          }
        }
      }
    }catch(e){ /* ignore */ }
  }catch(e){ console.error('MP webhook error', e && (e.stack || e)); }
  res.json({ ok: true });
}

module.exports = { createPreference, webhook };
