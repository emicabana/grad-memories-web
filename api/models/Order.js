const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
  amountCents: Number,
  status: { type: String, enum: ['pending','paid','failed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['mercadopago', 'transferencia'], default: 'mercadopago' },
  mpPreferenceId: String,
  mpPaymentId: String,
  // Para transferencia bancaria
  proofOfPaymentUrl: String,
  transferenceReference: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
