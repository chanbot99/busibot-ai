// services/chatbotService.js

/**
 * chatbotService
 * -------------
 * Provides helper methods for CRUD and status updates on Chatbot documents.
 */

const Chatbot = require('../models/Chatbot');

/**
 * findChatbotById
 * ---------------
 */
async function findChatbotById(id) {
    console.log('[chatbotService] - findChatbotById called for id:', id);
    const chatbot = await Chatbot.findById(id);
    console.log('[chatbotService] - findChatbotById result:', chatbot);
    return chatbot;
}

/**
 * markDepositPaid
 * ---------------
 * Marks the chatbot's `depositPaid` as true.
 */
async function markDepositPaid(id) {
    console.log('[chatbotService] - markDepositPaid called for id:', id);
    const chatbot = await Chatbot.findById(id);

    if (!chatbot) {
        console.error('[chatbotService] - markDepositPaid: No chatbot found for id:', id);
        return null;
    }

    console.log('[chatbotService] - markDepositPaid: Found chatbot:', chatbot._id);

    chatbot.depositPaid = true;
    console.log('[chatbotService] - depositPaid set to true, saving...');
    await chatbot.save();

    console.log('[chatbotService] - markDepositPaid: depositPaid updated successfully for chatbot', chatbot._id);
    return chatbot;
}

/**
 * markFinalPaid
 * -------------
 * Marks the chatbot's `finalPaymentPaid` as true.
 */
async function markFinalPaid(id) {
    console.log('[chatbotService] - markFinalPaid called for id:', id);
    const chatbot = await Chatbot.findById(id);

    if (!chatbot) {
        console.error('[chatbotService] - markFinalPaid: No chatbot found for id:', id);
        return null;
    }

    console.log('[chatbotService] - markFinalPaid: Found chatbot:', chatbot._id);

    chatbot.finalPaymentPaid = true;
    console.log('[chatbotService] - finalPaymentPaid set to true, saving...');
    await chatbot.save();

    console.log('[chatbotService] - markFinalPaid: finalPaymentPaid updated successfully for chatbot', chatbot._id);
    return chatbot;
}

/**
 * finalizeChatbot
 * ---------------
 * Sets the chatbot status to 'finalized' once finalPaymentPaid is true,
 * and generates a code snippet for embedding.
 */
async function finalizeChatbot(id) {
    console.log('[chatbotService] - finalizeChatbot called for id:', id);
    const chatbot = await Chatbot.findById(id);

    if (!chatbot) {
        console.error('[chatbotService] - finalizeChatbot: No chatbot found for id:', id);
        return null;
    }

    if (!chatbot.finalPaymentPaid) {
        console.error('[chatbotService] - finalizeChatbot: final payment not done yet for chatbot:', chatbot._id);
        throw new Error('Final payment not done yet');
    }

    chatbot.status = 'finalized';
    const snippet = `
  <script 
    src="https://your-bot-cdn.com/widget.js"
    data-bot-id="${chatbot.uniqueBotId}">
  </script>
  `;
    chatbot.codeSnippet = snippet;

    console.log('[chatbotService] - finalizeChatbot: status set to "finalized", codeSnippet generated, saving...');
    await chatbot.save();
    console.log('[chatbotService] - finalizeChatbot: chatbot updated successfully:', chatbot._id);

    return chatbot;
}

module.exports = {
    findChatbotById,
    markDepositPaid,
    markFinalPaid,
    finalizeChatbot
};
