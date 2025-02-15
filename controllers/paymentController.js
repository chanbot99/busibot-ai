// controllers/paymentController.js

/**
 * PaymentController
 * ---------------
 * This controller handles all payment-related logic, including:
 *  - Creating Stripe Checkout sessions (deposit/final/final+subscription).
 *  - Finalizing a chatbot once paid.
 *
 * Depends on:
 *  - ChatbotService (for DB lookups and status updates).
 *  - PaymentService (for Stripe session creation).
 */

const ChatbotService = require('../services/chatbotService');
const PaymentService = require('../services/paymentService');

// Exported controller methods
module.exports = {
    createDepositSession,
    createFinalSession,
    createFinalSubscriptionSession, // For combined final + subscription
    finalizeChatbot,
};

/**
 * createDepositSession
 * --------------------
 * Creates a Stripe Checkout Session for the deposit payment.
 * Expects `chatbotId` in the request body.
 *
 * 1. Finds the chatbot by ID.
 * 2. If found, calls PaymentService to create the session.
 * 3. Responds with the session URL or an error.
 */
async function createDepositSession(req, res) {
    try {
        const { chatbotId } = req.body;

        // 1) Look up the chatbot
        const chatbot = await ChatbotService.findChatbotById(chatbotId);
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        // 2) Create the deposit session via PaymentService
        const session = await PaymentService.createDepositSession(chatbot);

        // 3) Return the Stripe Checkout URL
        return res.json({ url: session.url });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error creating deposit session' });
    }
}

/**
 * createFinalSession
 * ------------------
 * Creates a Stripe Checkout Session for the final payment.
 * Expects `chatbotId` in the request body.
 *
 * 1. Finds the chatbot by ID.
 * 2. If found, calls PaymentService to create the session.
 * 3. Responds with the session URL or an error.
 */
async function createFinalSession(req, res) {
    try {
        const { chatbotId } = req.body;

        // 1) Look up the chatbot
        const chatbot = await ChatbotService.findChatbotById(chatbotId);
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        // 2) Create the final payment session
        const session = await PaymentService.createFinalSession(chatbot);

        // 3) Return the Stripe Checkout URL
        return res.json({ url: session.url });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error creating final payment session' });
    }
}

/**
 * createFinalSubscriptionSession
 * ------------------------------
 * Creates a single Stripe Checkout Session combining:
 *   - Final one-time payment
 *   - Monthly subscription
 * Expects `chatbotId` in the request body.
 *
 * 1. Finds the chatbot by ID.
 * 2. (Optional) Verify depositPaid if needed.
 * 3. Calls PaymentService to generate the combined session.
 * 4. Returns the session URL or an error.
 */
async function createFinalSubscriptionSession(req, res) {
    try {
        const { chatbotId } = req.body;

        // 1) Look up the chatbot
        const chatbot = await ChatbotService.findChatbotById(chatbotId);
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        // 2) Optionally verify deposit is paid
         if (!chatbot.depositPaid) {
           return res.status(400).json({ error: 'Deposit not paid yet' });
         }

        // 3) Create the final+subscription session
        const session = await PaymentService.createFinalPlusSubscriptionSession(chatbot);

        // 4) Return the Stripe Checkout URL
        return res.json({ url: session.url });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error creating final+subscription session' });
    }
}

/**
 * finalizeChatbot
 * ---------------
 * Finalizes a chatbot once the final payment is confirmed.
 * Expects `chatbotId` in the request body.
 *
 * 1. Calls ChatbotService to finalize (checks finalPaymentPaid).
 * 2. Returns the generated code snippet or an error if not paid.
 */
async function finalizeChatbot(req, res) {
    try {
        const { chatbotId } = req.body;

        // 1) Attempt to finalize via ChatbotService (checks finalPaymentPaid)
        const chatbot = await ChatbotService.finalizeChatbot(chatbotId);
        if (!chatbot) {
            return res
                .status(404)
                .json({ error: 'Chatbot not found or finalizing failed' });
        }

        // 2) Return success info + snippet
        return res.json({
            success: true,
            message: 'Chatbot finalized!',
            codeSnippet: chatbot.codeSnippet,
        });

    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
}
