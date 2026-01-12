const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  filename: String,
  originalPath: String,
  previewPath: String,
  mimeType: String,
  size: Number,
  priceCents: { type: Number, default: 0 },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  soldTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Asset', AssetSchema);
