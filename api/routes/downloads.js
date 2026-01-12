const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const { downloadOriginal } = require('../controllers/downloadController');

router.get('/:assetId', authRequired, downloadOriginal);

module.exports = router;
