/**
 * webhookRoutes.js
 * ---------------
 * We define a single POST "/" route that receives the raw body from Stripe.
 * Since we mount this file at "/api/stripe-webhook", the full path is:
 *   POST /api/stripe-webhook
 */

const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/webhookController');

// POST /api/stripe-webhook
// (we use POST "/" here because app.js mounts the entire router at "/api/stripe-webhook")
router.post('/', WebhookController.handleStripeWebhook);

module.exports = router;
