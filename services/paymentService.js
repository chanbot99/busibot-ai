// services/paymentService.js

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
        // Use a dynamic route for success
        success_url: 'https://busibot.ai/payment-success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://busibot.ai/payment-cancel.html',
    });
}

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
        // Same approach
        success_url: 'https://busibot.ai/payment-success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://busibot.ai/payment-cancel.html',
    });
}

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
        success_url: 'https://busibot.ai/payment-success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://busibot.ai/payment-cancel.html',
    });
}

module.exports = {
    createDepositSession,
    createFinalSession,
    createFinalPlusSubscriptionSession,
};
