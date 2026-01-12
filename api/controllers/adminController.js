const Asset = require('../models/Asset');

async function listAssets(req, res){
  const assets = await Asset.find().populate('sellerId', 'email');
  res.json({ ok: true, assets });
}

async function updateAsset(req, res){
  const id = req.params.id;
  const patch = {};
  const { priceCents, filename } = req.body;
  if(priceCents !== undefined) patch.priceCents = Number(priceCents);
  if(filename) patch.filename = filename;
  try{
    const asset = await Asset.findByIdAndUpdate(id, patch, { new: true });
    if(!asset) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, asset });
  }catch(e){
    res.status(400).json({ error: e.message });
  }
}

module.exports = { listAssets, updateAsset };
