const path = require('path');
const fs = require('fs');
const Asset = require('../models/Asset');
const Order = require('../models/Order');

async function downloadOriginal(req, res){
  const assetId = req.params.assetId;
  const userId = req.user._id;
  const order = await Order.findOne({ assetId: assetId, buyerId: userId, status: 'paid' });
  if(!order) return res.status(403).json({ error: 'No purchase found' });
  const asset = await Asset.findById(assetId);
  if(!asset) return res.status(404).json({ error: 'Asset not found' });
  const filePath = asset.originalPath;
  if(!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });
  res.setHeader('Content-Disposition', `attachment; filename="${asset.filename}"`);
  res.setHeader('Content-Type', asset.mimeType || 'application/octet-stream');
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}

module.exports = { downloadOriginal };
