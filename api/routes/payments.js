const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const { createPreference, webhook, createPreferencePublic, createTransferenceOrder, submitTransferenceProof, getBankDetails } = require('../controllers/paymentController');

router.post('/create_preference', authRequired, createPreference);
// Public create preference (no auth) - use for frontend redirect to Mercado Pago when JWT isn't available
router.post('/create_preference_public', express.json(), createPreferencePublic);
router.post('/webhook/mercadopago', express.json({type: '*/*'}), webhook);

// Rutas para transferencia bancaria
router.post('/create_transference_order', express.json(), createTransferenceOrder);
router.post('/submit_transference_proof', submitTransferenceProof);
router.get('/bank_details', getBankDetails);

module.exports = router;
