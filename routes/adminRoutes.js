/**
 * adminRoutes.js
 * --------------
 * Handles admin-related endpoints, including:
 *   - Secure login using a hashed admin password (no username).
 *   - Creating and listing Chatbot documents.
 *
 * Endpoints:
 *   - POST /login        - Validates admin password against a stored hash
 *   - POST /chatbots     - Create a new Chatbot record
 *   - GET  /chatbots     - Retrieve all Chatbots, sorted by creation date (descending)
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Chatbot = require('../models/Chatbot');

/**
 * 0) Admin Login
 * --------------
 * POST /login
 *
 * Expects: { password: "somePassword" } in the request body.
 *
 * Compares `password` with the hashed password stored in ENV (ADMIN_PASSWORD_HASH).
 * If valid, responds with 200 OK. If invalid, 401 Unauthorized.
 *
 * In a real production app, you'd typically:
 *   - Issue a session or JWT token upon success
 *   - Validate that token for subsequent admin operations
 *   - Or place the rest of the routes behind an authentication middleware
 */
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ error: 'No password provided' });
        }

        const storedHash = process.env.ADMIN_PASSWORD_HASH;
        if (!storedHash) {
            console.error('No ADMIN_PASSWORD_HASH in environment');
            return res.status(500).json({ error: 'Server misconfiguration: no password hash' });
        }

        // Compare user-supplied password with hashed password
        const match = await bcrypt.compare(password, storedHash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // If valid, simply send 200. (Consider sessions or tokens for real apps.)
        return res.sendStatus(200);

    } catch (err) {
        console.error('Error checking admin password:', err);
        return res.status(500).json({ error: 'Server error while authenticating' });
    }
});

/**
 * 1) Create a New Chatbot
 * -----------------------
 * POST /chatbots
 *
 * Expects JSON body containing:
 *   - userEmail      (string, optional)
 *   - depositAmount  (number, required in dollars)
 *   - finalAmount    (number, required in dollars)
 *   - monthlyAmount  (number, optional in dollars)
 *   - uniqueBotId    (string, required by schema if you want to set it here)
 *
 * The route initializes:
 *   - depositPaid     = false
 *   - finalPaymentPaid= false
 *   - status          = 'pending'
 *
 * Returns: JSON representation of the newly created chatbot or an error message.
 */
router.post('/chatbots', async (req, res) => {
    try {
        const { userEmail, depositAmount, finalAmount, monthlyAmount, uniqueBotId } = req.body;

        // Create a new Chatbot document with the provided data
        const newBot = await Chatbot.create({
            userEmail: userEmail || null,
            depositAmount,
            finalAmount,
            monthlyAmount: monthlyAmount || 0,
            depositPaid: false,
            finalPaymentPaid: false,
            status: 'pending',
            uniqueBotId
        });

        // Send back the newly created chatbot record
        res.json(newBot);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create chatbot' });
    }
});

/**
 * 2) Get All Chatbots
 * -------------------
 * GET /chatbots
 *
 * Retrieves all chatbot documents from MongoDB,
 * sorted by `createdAt` in descending order.
 *
 * Returns: Array of Chatbot objects or an error message.
 */
router.get('/chatbots', async (req, res) => {
    try {
        const chatbots = await Chatbot.find().sort({ createdAt: -1 });
        res.json(chatbots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get chatbots' });
    }
});

module.exports = router;
