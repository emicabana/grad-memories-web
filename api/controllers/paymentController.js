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

    const baseUrl = (process.env.SERVER_URL || 'http://localhost:3000').replace(/\/+$|\s+/g,'');
    const backUrlBase = baseUrl.startsWith('https://') ? baseUrl : 'https://example.com';
    const preference = {
      items: [ { title: asset.filename, quantity: 1, currency_id: 'ARS', unit_price: (asset.priceCents || 0) / 100 } ],
      external_reference: order._id.toString(),
      back_urls: {
        success: `${backUrlBase}/checkout/success`,
        failure: `${backUrlBase}/checkout/failure`,
        pending: `${backUrlBase}/checkout/pending`
      }
    };

    // Only include a notification_url when SERVER_URL is HTTPS (Mercado Pago requires a reachable HTTPS callback)
    try{
      if(baseUrl.startsWith('https://')){
        preference.notification_url = `${baseUrl}/api/payments/webhook/mercadopago`;
      } else {
        const fs = require('fs');
        fs.appendFileSync('logs/mp_debug.log', `Skipping notification_url because SERVER_URL is not https: ${baseUrl}\n`);
      }
    }catch(e){ /* allow preference creation to continue even if logging fails */ }

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
    try{ fs.appendFileSync('logs/mp_debug.log', `POST BODY: ${JSON.stringify(preference)}\n`); }catch(e){}
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
    // Allow direct simulation payloads in non-production for local testing
    if(req.body && req.body.__simulate && process.env.NODE_ENV !== 'production'){
      const sim = req.body;
      const prefId = sim.preference_id || sim.preferenceId || sim.preference || sim.mpPreferenceId || sim.external_reference;
      const status = (sim.status || (sim.payment && sim.payment.status)) || 'approved';
      const mpPaymentId = sim.id || (sim.payment && sim.payment.id) || ('SIM-'+Date.now());
      const order = prefId ? await Order.findOne({ mpPreferenceId: prefId }) : null;
      if(order){
        if(order.status !== 'paid' && status === 'approved'){
          order.status = 'paid'; order.mpPaymentId = mpPaymentId; await order.save();
          const asset = await Asset.findById(order.assetId); if(asset){ asset.soldTo = order.buyerId; await asset.save(); }
        }
        return res.json({ ok: true, simulated: true });
      }
      return res.json({ ok: false, error: 'order_not_found', prefId: prefId || null });
    }

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
      const orders = await Order.find({ mpPreferenceId: prefId });
      for(const order of orders){
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
          const orders = await Order.find({ mpPreferenceId: prefId });
          for(const order of orders){
            if(order && order.status !== 'paid' && status === 'approved'){
              order.status = 'paid'; order.mpPaymentId = mpPaymentId; await order.save();
              const asset = await Asset.findById(order.assetId); if(asset){ asset.soldTo = order.buyerId; await asset.save(); }
            }
          }
        }
      }
    }catch(e){ /* ignore */ }
  }catch(e){ console.error('MP webhook error', e && (e.stack || e)); }
  res.json({ ok: true });
}

module.exports = { createPreference, webhook };
// Public preference creation (no auth) - for demos where client can't provide server JWT
async function createPreferencePublic(req, res){
  try{
    const fs = require('fs');
    fs.appendFileSync('logs/mp_debug.log', `createPreferencePublic start ${new Date().toISOString()}\n`);
    const { items } = req.body;
    if(!items || !Array.isArray(items) || items.length===0) return res.status(400).json({ error: 'No items provided' });
    const Asset = require('../models/Asset');
    const Order = require('../models/Order');

    // Create one Order per cart item (pending)
    const createdOrders = [];
    for(const it of items){
      const assetId = it.assetId || it.id;
      if(!assetId) continue;
      const asset = await Asset.findById(assetId);
      if(!asset) continue;
      if(asset.soldTo) return res.status(400).json({ error: `Asset ${assetId} already sold` });
      const o = new Order({ buyerId: null, assetId: asset._id, amountCents: asset.priceCents, status: 'pending' });
      await o.save();
      createdOrders.push(o);
    }
    if(createdOrders.length===0) return res.status(400).json({ error: 'No valid items to create order' });

    // Build preference items for Mercado Pago from cart
    const mpItems = items.map(it=>({ title: it.title || it.filename || 'Item', quantity: Number(it.qty||1), currency_id: 'ARS', unit_price: Number(it.price||0) }));
    const baseUrl = (process.env.SERVER_URL || 'http://localhost:3000').replace(/\/+$|\s+/g,'');
    const backUrlBase = baseUrl.startsWith('https://') ? baseUrl : 'https://example.com';
    const preference = {
      items: mpItems,
      // external_reference will hold the array of order ids so we can identify them later
      external_reference: JSON.stringify(createdOrders.map(o=>o._id.toString())),
      back_urls: {
        success: `${backUrlBase}/checkout/success`,
        failure: `${backUrlBase}/checkout/failure`,
        pending: `${backUrlBase}/checkout/pending`
      }
    };

    // Only include notification_url when HTTPS
    if(baseUrl.startsWith('https://')) preference.notification_url = `${baseUrl}/api/payments/webhook/mercadopago`;

    // Call Mercado Pago
    const https = require('https');
    const mpToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN || '';
    if(!mpToken) throw new Error('MP_ACCESS_TOKEN not configured');
    const postData = JSON.stringify(preference);
    const options = { hostname: 'api.mercadopago.com', path: '/checkout/preferences', method: 'POST', headers: { 'Content-Type':'application/json', 'Content-Length': Buffer.byteLength(postData), 'Authorization': `Bearer ${mpToken}` } };
    const mpPref = await new Promise((resolve,reject)=>{
      const reqp = https.request(options, (resp)=>{ let data=''; resp.on('data', c=>data+=c); resp.on('end', ()=>{ try{ resolve(JSON.parse(data)); }catch(e){ reject(e); } }); }); reqp.on('error', reject); reqp.write(postData); reqp.end();
    });
    // Update all created orders with mpPreferenceId
    const prefId = mpPref.id || mpPref.preference_id || null;
    if(prefId){
      const OrderModel = require('../models/Order');
      await OrderModel.updateMany({ _id: { $in: createdOrders.map(o=>o._id) } }, { $set: { mpPreferenceId: prefId } });
    }
    return res.json({ ok:true, init_point: mpPref.init_point || mpPref.sandbox_init_point, preference: mpPref });
  }catch(e){ console.error('createPreferencePublic error', e); return res.status(500).json({ error:'server_error', details: e && e.message }); }
}

// Crear orden para pago por transferencia
async function createTransferenceOrder(req, res){
  try{
    const bankConfig = require('../config/bankConfig');
    const { items } = req.body;
    
    if(!items || !Array.isArray(items) || items.length === 0){
      return res.status(400).json({ error: 'No items provided' });
    }

    // Calcular monto total
    let totalCents = 0;
    const createdOrders = [];
    
    for(const item of items){
      const assetId = item.assetId || item.id;
      if(!assetId) continue;
      
      const asset = await Asset.findById(assetId);
      if(!asset || asset.soldTo){
        console.log('Asset already sold or not found:', assetId);
        continue;
      }
      
      const order = new Order({
        buyerId: req.user ? req.user._id : null,
        assetId: asset._id,
        amountCents: asset.priceCents,
        status: 'pending',
        paymentMethod: 'transferencia'
      });
      await order.save();
      createdOrders.push(order);
      totalCents += asset.priceCents;
    }

    if(createdOrders.length === 0){
      return res.status(400).json({ error: 'No valid assets found' });
    }

    const totalAmount = (totalCents / 100).toFixed(2);
    const whatsappPhone = bankConfig.contactWhatsApp || '+5495029031';
    const whatsappMessage = encodeURIComponent(
      `Hola, acabo de hacer una transferencia bancaria por $${totalAmount} ARS. ` +
      `Mi referencia es: ${createdOrders[0]._id}. ` +
      `Adjuntaré el comprobante a continuación.`
    );
    
    return res.json({
      ok: true,
      orders: createdOrders.map(o => ({ _id: o._id})),
      bankDetails: bankConfig.bankDetails,
      totalAmount: totalAmount,
      whatsappLink: `https://wa.me/${whatsappPhone.replace(/\D/g, '')}?text=${whatsappMessage}`
    });
  }catch(e){
    console.error('createTransferenceOrder error', e);
    return res.status(500).json({ error: 'server_error', details: e && e.message });
  }
}

// Procesar comprobante de transferencia
async function submitTransferenceProof(req, res){
  try{
    const { orderId, reference } = req.body;
    if(!orderId || !req.files || !req.files.proof){
      return res.status(400).json({ error: 'Missing order ID or proof file' });
    }

    const order = await Order.findById(orderId);
    if(!order){
      return res.status(404).json({ error: 'Order not found' });
    }

    // Guardar comprobante en disco
    const storage = require('../utils/storage');
    const fileName = `transfer_proof_${orderId}_${Date.now()}.jpg`;
    const proofPath = `uploads/transfer_proofs/${fileName}`;
    
    await new Promise((resolve, reject) => {
      require('fs').mkdir('uploads/transfer_proofs', { recursive: true }, (err) => {
        if(err) reject(err);
        else resolve();
      });
    });

    await req.files.proof.mv(proofPath);

    // Actualizar orden
    order.proofOfPaymentUrl = proofPath;
    order.transferenceReference = reference || 'N/A';
    order.status = 'pending'; // Pendiente de confirmación
    await order.save();

    // Generar link directo a WhatsApp para el cliente confirmar
    const whatsappPhone = process.env.CONTACT_WHATSAPP || '+5495029031';
    const whatsappMsg = encodeURIComponent(`He enviado el comprobante de pago - Referencia: ${orderId}`);
    
    return res.json({
      ok: true,
      message: 'Comprobante subido correctamente',
      whatsappLink: `https://wa.me/${whatsappPhone.replace(/\D/g, '')}?text=${whatsappMsg}`
    });
  }catch(e){
    console.error('submitTransferenceProof error', e);
    return res.status(500).json({ error: 'server_error', details: e && e.message });
  }
}

// Obtener datos bancarios
async function getBankDetails(req, res){
  try{
    const bankConfig = require('../config/bankConfig');
    return res.json({
      ok: true,
      bankDetails: bankConfig.bankDetails
    });
  }catch(e){
    console.error('getBankDetails error', e);
    return res.status(500).json({ error: 'server_error' });
  }
}

module.exports = { createPreference, webhook, createPreferencePublic, createTransferenceOrder, submitTransferenceProof, getBankDetails };
