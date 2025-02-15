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
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        // Construct and verify the event with the raw body + signature
        event = stripe.webhooks.constructEvent(
            req.body,
            req.headers['stripe-signature'],
            endpointSecret
        );
    } catch (err) {
        // If signature verification fails, respond with 400.
        console.error('Webhook signature verification failed:', err.message);
        return res.sendStatus(400);
    }

    // Handle event by type
    switch (event.type) {
        case 'checkout.session.completed':
            await handleCheckoutSessionCompleted(event.data.object);
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
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
    try {
        const { chatbotId, paymentType } = session.metadata || {};
        if (!chatbotId || !paymentType) {
            console.error('No chatbotId or paymentType in metadata');
            return;
        }

        // Determine which payment type was completed
        switch (paymentType) {
            case 'deposit':
                await ChatbotService.markDepositPaid(chatbotId);
                console.log(`Deposit paid for chatbot ${chatbotId}`);
                break;

            case 'final':
                await ChatbotService.markFinalPaid(chatbotId);
                console.log(`Final payment paid for chatbot ${chatbotId}`);
                break;

            case 'final+subscription':
                // Mark final portion as paid
                await ChatbotService.markFinalPaid(chatbotId);
                // Optionally update subscription info, e.g.:
                // chatbot.subscriptionActive = true;
                // chatbot.subscriptionId = session.subscription;
                // (depends on your code logic in ChatbotService)
                console.log(`Final + subscription paid for chatbot ${chatbotId}`);
                break;

            default:
                console.log(`Unhandled paymentType: ${paymentType}`);
        }
    } catch (err) {
        console.error('Error in handleCheckoutSessionCompleted:', err);
    }
}
