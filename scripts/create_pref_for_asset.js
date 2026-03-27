require('dotenv').config({path: '../.env'});
const mongoose = require('mongoose');
const https = require('https');
const Asset = require('../api/models/Asset');
const Order = require('../api/models/Order');

async function run(){
  const mongo = process.env.MONGODB_URI || 'mongodb://localhost:27017/gradmemories';
  await mongoose.connect(mongo, { useNewUrlParser: true, useUnifiedTopology: true });

  const assetId = '693f476bc421c94330e3317b';
  const buyerId = '693c13cfb40e7de81259553f';

  const asset = await Asset.findById(assetId);
  if(!asset){ console.error('Asset not found', assetId); process.exit(1); }

  let order = await Order.findOne({ assetId: asset._id, buyerId });
  if(!order){
    order = await Order.create({ buyerId, assetId: asset._id, amountCents: asset.priceCents, status: 'pending' });
    console.log('Order created:', order._id.toString());
  } else {
    console.log('Existing order:', order._id.toString());
  }

  const preference = {
    items: [{ title: asset.filename || 'asset', quantity:1, currency_id:'ARS', unit_price: (asset.priceCents||0)/100 }],
    external_reference: order._id.toString(),
    back_urls: {
      success: `${process.env.SERVER_URL || 'http://localhost:3000'}/checkout/success`,
      failure: `${process.env.SERVER_URL || 'http://localhost:3000'}/checkout/failure`,
      pending: `${process.env.SERVER_URL || 'http://localhost:3000'}/checkout/pending`
    },
    notification_url: `${process.env.SERVER_URL || 'http://localhost:3000'}/api/webhook/mercadopago`
  };

  const mpToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-1544836007225622-121317-32debfa8783e5eeb16e59312dbdc67b8-468078336';

  const postData = JSON.stringify(preference);
  const options = {
    hostname: 'api.mercadopago.com',
    path: '/checkout/preferences',
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': 'Bearer '+mpToken
    }
  };

  const mpPref = await new Promise((resolve, reject)=>{
    const req = https.request(options, (res)=>{
      let data=''; res.on('data', c=> data+=c); res.on('end', ()=>{
        try{ resolve(JSON.parse(data)); }catch(e){ reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  order.mpPreferenceId = mpPref.id || mpPref.preference_id || '';
  await order.save();

  console.log('Preference created: id=', order.mpPreferenceId);
  console.log('init_point=', mpPref.init_point || mpPref.sandbox_init_point || null);
  await mongoose.disconnect();
}

run().catch(err=>{ console.error('error', err && (err.stack || err)); process.exit(1); });
