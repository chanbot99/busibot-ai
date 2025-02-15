// services/chatbotService.js

/**
 * chatbotService
 * -------------
 * Provides helper methods for CRUD and status updates on Chatbot documents.
 *
 * Depends on the Mongoose Chatbot model.
 * Functions are designed to:
 *   1) Query or update a chatbot by ID.
 *   2) Handle deposit or final payment flags.
 *   3) Finalize a chatbot once paid.
 */

const Chatbot = require('../models/Chatbot');

/**
 * findChatbotById
 * ---------------
 * @param {String} id - The MongoDB _id of the chatbot document.
 * @returns {Promise<Object|null>} - Returns the chatbot document or null if not found.
 */
async function findChatbotById(id) {
    return await Chatbot.findById(id);
}

/**
 * markDepositPaid
 * ---------------
 * Marks the chatbot's `depositPaid` as true.
 *
 * @param {String} id - The chatbot _id.
 * @returns {Promise<Object|null>} - Updated chatbot document, or null if not found.
 */
async function markDepositPaid(id) {
    const chatbot = await Chatbot.findById(id);
    if (!chatbot) return null;

    chatbot.depositPaid = true;
    await chatbot.save();
    return chatbot;
}

/**
 * markFinalPaid
 * -------------
 * Marks the chatbot's `finalPaymentPaid` as true.
 *
 * @param {String} id - The chatbot _id.
 * @returns {Promise<Object|null>} - Updated chatbot document, or null if not found.
 */
async function markFinalPaid(id) {
    const chatbot = await Chatbot.findById(id);
    if (!chatbot) return null;

    chatbot.finalPaymentPaid = true;
    // Optionally update chatbot.status or perform additional logic here.
    await chatbot.save();
    return chatbot;
}

/**
 * finalizeChatbot
 * ---------------
 * Sets the chatbot status to 'finalized' once finalPaymentPaid is true,
 * and generates a code snippet for embedding.
 *
 * @param {String} id - The chatbot _id.
 * @throws {Error} If final payment is not done yet.
 * @returns {Promise<Object|null>} - Updated chatbot doc, or null if not found.
 */
async function finalizeChatbot(id) {
    const chatbot = await Chatbot.findById(id);
    if (!chatbot) return null;

    // Ensure the final payment is completed
    if (!chatbot.finalPaymentPaid) {
        throw new Error('Final payment not done yet');
    }

    // Mark status as finalized and create code snippet
    chatbot.status = 'finalized';
    const snippet = `
  <script 
    src="https://your-bot-cdn.com/widget.js"
    data-bot-id="${chatbot.uniqueBotId}">
  </script>
  `;
    chatbot.codeSnippet = snippet;

    await chatbot.save();
    return chatbot;
}

module.exports = {
    findChatbotById,
    markDepositPaid,
    markFinalPaid,
    finalizeChatbot
};
