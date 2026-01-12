require('dotenv').config({path: '../.env'});
const mongoose = require('mongoose');
const Order = require('../api/models/Order');
const Asset = require('../api/models/Asset');

async function run(){
  const mongo = process.env.MONGODB_URI || 'mongodb://localhost:27017/gradmemories';
  await mongoose.connect(mongo, {useNewUrlParser: true, useUnifiedTopology: true});
  const assetId = '693c330674cd9f5eb3857d35';
  const buyerId = '693c13cfb40e7de81259553f';
  const existing = await Order.findOne({assetId, buyerId});
  if(existing){
    console.log('Order already exists:', existing._id);
    await Asset.findByIdAndUpdate(assetId, { soldTo: buyerId });
    await mongoose.disconnect();
    return;
  }
  const order = await Order.create({ buyerId, assetId, amountCents: 50000, status: 'paid', mpPreferenceId: 'test-pref-'+Date.now(), mpPaymentId: 'test-pay-'+Date.now() });
  await Asset.findByIdAndUpdate(assetId, { soldTo: buyerId });
  console.log('Created order:', order._id.toString());
  await mongoose.disconnect();
}

run().catch(err=>{ console.error(err); process.exit(1); });
