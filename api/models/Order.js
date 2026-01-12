const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
  amountCents: Number,
  status: { type: String, enum: ['pending','paid','failed'], default: 'pending' },
  mpPreferenceId: String,
  mpPaymentId: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
