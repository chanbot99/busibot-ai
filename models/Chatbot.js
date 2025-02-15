// models/Chatbot.js

/**
 * Chatbot Schema
 * -------------
 * Defines the structure of the 'chatbots' collection in MongoDB.
 * Each chatbot document tracks:
 *   - depositAmount, finalAmount, monthlyAmount: stored in 'dollars' (float).
 *   - depositPaid, finalPaymentPaid: boolean flags for payment status.
 *   - uniqueBotId: unique identifier required for each chatbot.
 *   - subscription details (subscriptionId, subscriptionActive).
 *   - status: e.g. 'pending', 'test', or 'finalized'.
 *
 * Note: Storing money as a float can lead to precision issues in certain use cases.
 * For high-precision financial apps, consider storing amounts as integers (cents) or Decimal128.
 */

const mongoose = require('mongoose');

const chatbotSchema = new mongoose.Schema({
    // The user who owns or is associated with the chatbot (optional reference).
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // User email
    userEmail: {
        type: String,
        default: null
    },

    // Indicates if the initial deposit has been paid.
    depositPaid: {
        type: Boolean,
        default: false
    },

    // Deposit amount in dollars (float). Required.
    depositAmount: {
        type: Number,
        required: true
    },

    // Indicates if the final payment is completed.
    finalPaymentPaid: {
        type: Boolean,
        default: false
    },

    // Final payment amount in dollars (float). Required.
    finalAmount: {
        type: Number,
        required: true
    },

    // Monthly subscription fee in dollars (float), defaults to 0 if no subscription.
    monthlyAmount: {
        type: Number,
        default: 0
    },

    // Status of the chatbot lifecycle: 'pending', 'test', 'finalized', etc.
    status: {
        type: String,
        default: 'pending'
    },

    // A unique identifier for the chatbot (required).
    // Must be unique to avoid collisions across chatbots.
    uniqueBotId: {
        type: String,
        unique: true,
        required: true
    },

    // Optional code snippet for embedding the chatbot on a site, set upon finalization.
    codeSnippet: {
        type: String
    },

    // Timestamp for when the chatbot doc was first created.
    createdAt: {
        type: Date,
        default: Date.now
    },

    // Subscription ID if using Stripe subscriptions, etc.
    subscriptionId: {
        type: String
    },

    // Indicates if the chatbot’s subscription is active.
    subscriptionActive: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Chatbot', chatbotSchema);
