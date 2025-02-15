// paymentRoutes.js
// ---------------
// This file defines routes for handling payment-related actions that don't
// fit neatly into the PaymentController, such as emailing deposit links or
// final+subscription links via Nodemailer, or advanced logic triggered by admin UI.

const express = require('express');
const router = express.Router();
const Chatbot = require('../models/Chatbot');
const PaymentService = require('../services/paymentService');
const nodemailer = require('nodemailer');
const PaymentController = require('../controllers/paymentController');

/**
 * Send Final + Subscription Email
 * -------------------------------
 * POST /send-final-and-subscription-email
 *
 * This endpoint is called by the admin front end to:
 *  1) Verify the chatbot exists and deposit is paid.
 *  2) Create a final+subscription Stripe Checkout Session.
 *  3) Automatically send an HTML email with a "pay" button link to the user's email.
 *
 * Expects a JSON body with:
 *   - chatbotId: the _id of the chatbot document
 */
router.post('/send-final-and-subscription-email', async (req, res) => {
    try {
        const { chatbotId } = req.body;
        if (!chatbotId) {
            return res.status(400).json({ error: 'chatbotId is required' });
        }

        // 1) Find the chatbot record
        const chatbot = await Chatbot.findById(chatbotId);
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        // Ensure deposit was paid before sending final + subscription email
        if (!chatbot.depositPaid) {
            return res.status(400).json({ error: 'Deposit not paid yet' });
        }

        // 2) Create the single Checkout session for final + subscription
        const session = await PaymentService.createFinalPlusSubscriptionSession(chatbot);
        if (!session.url) {
            return res.status(500).json({ error: 'Failed to create Stripe session' });
        }

        // 3) If we have an email address, send it automatically
        if (!chatbot.userEmail) {
            return res.status(400).json({ error: 'No userEmail associated with this chatbot' });
        }

        // Configure Nodemailer with your IONOS SMTP details
        const transporter = nodemailer.createTransport({
            host: 'smtp.ionos.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // You can style this button & text however you like in HTML
        const mailOptions = {
            from: 'no-reply@busibot.ai',
            to: chatbot.userEmail,
            subject: 'Your Final Payment & Monthly Subscription Link',
            text: `Hello,

Your chatbot is ready! Click the link below to pay the final balance and begin your monthly subscription:
${session.url}

Thank you for using Busibot AI.
Best regards,
Busibot Team`,
            html: `
                <p>Hello,</p>
                <p>Your chatbot is ready! Please click the button below to pay the remaining balance and begin your monthly subscription:</p>
                <p>
                  <a href="${session.url}" 
                    style="display:inline-block;padding:10px 20px;font-weight:bold;color:#ffffff;background:#007bff;
                           text-decoration:none;border-radius:5px;">
                    Pay Final + Subscription
                  </a>
                </p>
                <p>Thank you for using Busibot AI.<br />
                Best regards,<br />
                Busibot Team</p>
            `
        };

        // Send the email and respond when complete
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Failed to send final+subscription email:', err);
                return res.status(500).json({ error: 'Failed to send email' });
            }
            console.log('Final+subscription email sent:', info.response);
            // 4) Return success
            return res.json({ message: 'Final+subscription email sent successfully!' });
        });

    } catch (err) {
        console.error('Error in send-final-and-subscription-email:', err);
        return res.status(500).json({ error: 'Server error sending final+subscription email' });
    }
});

/**
 * create-deposit-session (Custom)
 * -------------------------------
 * POST /create-deposit-session
 *
 * Creates a Stripe Checkout Session for the deposit payment and
 * optionally emails an HTML deposit link button to the user if userEmail exists.
 *
 * Request body:
 *   - chatbotId: the _id of the chatbot
 */
router.post('/create-deposit-session', async (req, res) => {
    try {
        const { chatbotId } = req.body;
        const chatbot = await Chatbot.findById(chatbotId);
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        const session = await PaymentService.createDepositSession(chatbot);
        if (!session.url) {
            return res.status(500).json({ error: 'Failed to create Stripe session' });
        }

        // If userEmail is present, email the deposit link as a button
        if (chatbot.userEmail) {
            const transporter = nodemailer.createTransport({
                host: 'smtp.ionos.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: 'no-reply@busibot.ai',
                to: chatbot.userEmail,
                subject: 'Your Deposit Payment Link',
                text: `Hello,

Here is your deposit payment link:
${session.url}

Please click the link to complete the deposit. Thank you!

Best regards,
Busibot AI`,
                html: `
                    <p>Hello,</p>
                    <p>Please click the button below to complete your deposit payment:</p>
                    <p>
                      <a href="${session.url}"
                         style="display:inline-block;padding:10px 20px;font-weight:bold;color:#ffffff;background:#28a745;
                                text-decoration:none;border-radius:5px;">
                        Pay Deposit
                      </a>
                    </p>
                    <p>Thank you for using Busibot AI.<br />
                    Best regards,<br />
                    Busibot Team</p>
                `
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('Failed to send email:', err);
                } else {
                    console.log('Deposit link email sent:', info.response);
                }
            });
        }

        // Return the session URL so the front end can display it if needed
        res.json({ url: session.url });

    } catch (err) {
        console.error('Error in /create-deposit-session:', err);
        res.status(500).json({ error: 'Error creating deposit session' });
    }
});

module.exports = router;
