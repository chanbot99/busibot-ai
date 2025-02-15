// services/paymentService.js

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * createDepositSession
 * --------------------
 * Creates a Stripe Checkout Session for collecting the deposit amount.
 */
async function createDepositSession(chatbot) {
    const depositInCents = Math.round(chatbot.depositAmount * 100);

    return await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Chatbot Development Deposit' },
                    unit_amount: depositInCents,
                },
                quantity: 1,
            },
        ],
        metadata: {
            chatbotId: chatbot._id.toString(),
            paymentType: 'deposit',
        },
        // If deposit is successful, go to payment-success
        success_url: 'https://busibot.ai/deposit-payment-success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://busibot.ai/payment-cancel.html',
    });
}

/**
 * createFinalSession
 * ------------------
 * Creates a Stripe Checkout Session for collecting the final payment.
 * Now we point success_url to /final-payment-success for a separate final success page.
 */
async function createFinalSession(chatbot) {
    const finalInCents = Math.round(chatbot.finalAmount * 100);

    return await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Chatbot Final Payment' },
                    unit_amount: finalInCents,
                },
                quantity: 1,
            },
        ],
        metadata: {
            chatbotId: chatbot._id.toString(),
            paymentType: 'final',
        },
        // Distinct route for final success:
        success_url: 'https://busibot.ai/final-payment-success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://busibot.ai/payment-cancel.html',
    });
}

/**
 * createFinalPlusSubscriptionSession
 * ----------------------------------
 * Creates a single Stripe Checkout Session combining:
 *   - A one-time final payment
 *   - A recurring monthly subscription
 */
async function createFinalPlusSubscriptionSession(chatbot) {
    const finalInCents = Math.round(chatbot.finalAmount * 100);
    const monthlyInCents = Math.round(chatbot.monthlyAmount * 100);

    return await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Final Chatbot Payment' },
                    unit_amount: finalInCents,
                },
                quantity: 1,
            },
            {
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Chatbot Monthly Subscription' },
                    recurring: { interval: 'month' },
                    unit_amount: monthlyInCents,
                },
                quantity: 1,
            },
        ],
        metadata: {
            chatbotId: chatbot._id.toString(),
            paymentType: 'final+subscription',
        },
        // This also can be changed if you want a distinct success page for subscriptions
        success_url: 'https://busibot.ai/final-payment-success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://busibot.ai/payment-cancel.html',
    });
}

module.exports = {
    createDepositSession,
    createFinalSession,
    createFinalPlusSubscriptionSession,
};
