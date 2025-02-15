// controllers/webhookController.js

/**
 * WebhookController
 * -----------------
 * This controller handles incoming Stripe webhook events.
 * It verifies the event signature, then processes relevant events
 * such as checkout.session.completed to update chatbot payment status.
 */

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const ChatbotService = require('../services/chatbotService');

module.exports = {
    handleStripeWebhook,
};

/**
 * handleStripeWebhook
 * -------------------
 * Entry point for Stripe webhooks.
 *
 * 1) Verifies the Stripe event using the webhook secret.
 * 2) Dispatches to the appropriate handler based on event.type.
 */
async function handleStripeWebhook(req, res) {
    console.log('[WebhookController] - Received webhook request');

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        // Construct and verify the event with the raw body + signature
        event = stripe.webhooks.constructEvent(
            req.body,
            req.headers['stripe-signature'],
            endpointSecret
        );
        console.log('[WebhookController] - Webhook signature verified successfully');
    } catch (err) {
        // If signature verification fails, respond with 400.
        console.error('[WebhookController] - Webhook signature verification failed:', err.message);
        return res.sendStatus(400);
    }

    console.log(`[WebhookController] - Event type: ${event.type}`);

    // Handle event by type
    switch (event.type) {
        case 'checkout.session.completed':
            console.log('[WebhookController] - Handling checkout.session.completed event');
            await handleCheckoutSessionCompleted(event.data.object);
            break;

        default:
            console.log(`[WebhookController] - Unhandled event type: ${event.type}`);
    }

    // Respond to Stripe that we've received the event
    return res.json({ received: true });
}

/**
 * handleCheckoutSessionCompleted
 * ------------------------------
 * Processes a completed Checkout Session:
 *  - Reads chatbotId & paymentType from session.metadata.
 *  - Calls the corresponding ChatbotService method to update DB status:
 *    - deposit => markDepositPaid
 *    - final => markFinalPaid
 *    - final+subscription => markFinalPaid + optional subscription logic
 */
async function handleCheckoutSessionCompleted(session) {
    console.log('[WebhookController] - handleCheckoutSessionCompleted invoked');
    console.log('[WebhookController] - session object:', session);

    try {
        const { chatbotId, paymentType } = session.metadata || {};
        console.log('[WebhookController] - Extracted metadata:', { chatbotId, paymentType });

        if (!chatbotId || !paymentType) {
            console.error('[WebhookController] - No chatbotId or paymentType in metadata');
            return;
        }

        // Determine which payment type was completed
        switch (paymentType) {
            case 'deposit':
                console.log(`[WebhookController] - Payment Type: deposit for chatbotId: ${chatbotId}`);
                await ChatbotService.markDepositPaid(chatbotId);
                console.log(`[WebhookController] - Deposit paid for chatbot ${chatbotId}`);
                break;

            case 'final':
                console.log(`[WebhookController] - Payment Type: final for chatbotId: ${chatbotId}`);
                await ChatbotService.markFinalPaid(chatbotId);
                console.log(`[WebhookController] - Final payment paid for chatbot ${chatbotId}`);
                break;

            case 'final+subscription':
                console.log(`[WebhookController] - Payment Type: final+subscription for chatbotId: ${chatbotId}`);
                // Mark final portion as paid
                await ChatbotService.markFinalPaid(chatbotId);
                // Optionally update subscription fields
                console.log(`[WebhookController] - Final + subscription paid for chatbot ${chatbotId}`);
                break;

            default:
                console.log(`[WebhookController] - Unhandled paymentType: ${paymentType}`);
        }
    } catch (err) {
        console.error('[WebhookController] - Error in handleCheckoutSessionCompleted:', err);
    }
}
