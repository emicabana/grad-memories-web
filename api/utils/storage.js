const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOADS = process.env.UPLOADS_DIR || path.join(__dirname, '..', '..', 'uploads');
const ORIGINALS = path.join(UPLOADS, 'originals');
const PREVIEWS = path.join(UPLOADS, 'previews');

[UPLOADS, ORIGINALS, PREVIEWS].forEach(p => { if(!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, ORIGINALS);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

module.exports = { upload, ORIGINALS, PREVIEWS };
