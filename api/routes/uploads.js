const express = require('express');
const router = express.Router();
const { upload } = require('../utils/storage');
const { authRequired, requireRole } = require('../middleware/auth');
const { handleUpload } = require('../controllers/uploadController');

// Only admins can upload assets for sale
router.post('/', authRequired, requireRole('admin'), upload.single('file'), handleUpload);

module.exports = router;
