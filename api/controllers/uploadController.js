const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const Asset = require('../models/Asset');
const { PREVIEWS, ORIGINALS } = require('../utils/storage');

async function handleUpload(req, res){
  if(!req.file) return res.status(400).json({ error: 'No file' });
  const file = req.file;
  const ext = path.extname(file.filename).toLowerCase();
  const mime = file.mimetype;
  const asset = new Asset({ filename: file.originalname, originalPath: file.path, mimeType: mime, size: file.size, sellerId: req.user._id });

  // Generate preview with watermark
  const previewName = 'preview-' + file.filename;
  const previewPath = path.join(PREVIEWS, previewName);

  try{
    if(mime.startsWith('image/')){
      // image watermark: text at bottom-right, resized to fit
      // First get original dimensions to scale watermark appropriately
      const metadata = await sharp(file.path).metadata();
      const targetWidth = Math.min(metadata.width || 800, 1600);
      const ratio = targetWidth / (metadata.width || 800);
      
      // Create watermark SVG scaled to image size
      const svgWidth = Math.max(150, Math.min(800, targetWidth / 2));
      const svgHeight = Math.max(60, svgWidth / 4);
      const fontSize = Math.max(12, Math.min(48, svgWidth / 6));
      
      const svgText = `<svg width="${svgWidth}" height="${svgHeight}">
        <style>
          .title{ fill:rgba(255,255,255,0.8); font-size:${fontSize}px; font-family: Arial, Helvetica, sans-serif; }
        </style>
        <text x="5" y="${fontSize}" class="title">GradMemories</text>
      </svg>`;
      
      await sharp(file.path)
        .resize({ width: targetWidth, withoutEnlargement: true })
        .composite([{ input: Buffer.from(svgText), gravity: 'southeast' }])
        .jpeg({ quality: 80 })
        .toFile(previewPath);
    } else if(mime.startsWith('video/')){
      // video watermark using ffmpeg, produce lower-res mp4
      await new Promise((resolve, reject) => {
        ffmpeg(file.path)
          .outputOptions(['-vf', "drawtext=fontfile=/Windows/Fonts/arial.ttf:text='GradMemories':fontcolor=white@0.8:fontsize=24:box=1:boxcolor=black@0.3:boxborderw=5:x=w-tw-10:y=h-th-10", '-preset', 'veryfast'])
          .size('?x720')
          .save(previewPath)
          .on('end', resolve)
          .on('error', reject);
      });
    } else {
      // fallback: copy original as preview
      fs.copyFileSync(file.path, previewPath);
    }

    asset.previewPath = previewPath;
    await asset.save();
    res.json({ ok: true, asset });
  }catch(e){
    console.error(e);
    res.status(500).json({ error: 'Processing failed', details: e.message });
  }
}

module.exports = { handleUpload };
