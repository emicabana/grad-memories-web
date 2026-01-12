const express = require('express');
const router = express.Router();
const { authRequired, requireRole } = require('../middleware/auth');
const { listAssets, updateAsset } = require('../controllers/adminController');

router.get('/assets', authRequired, requireRole('admin'), listAssets);
router.put('/assets/:id', authRequired, requireRole('admin'), updateAsset);

module.exports = router;
