const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const { createPreference, webhook } = require('../controllers/paymentController');

router.post('/create_preference', authRequired, createPreference);
router.post('/webhook/mercadopago', express.json({type: '*/*'}), webhook);

module.exports = router;
