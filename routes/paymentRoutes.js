// paymentRoutes.js
// ---------------
// Houses routes for deposit session creation, final+subscription emailing, session info retrieval, and finalizing the chatbot.

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { Stripe } = require('stripe');
const Chatbot = require('../models/Chatbot');
const PaymentService = require('../services/paymentService');
const chatbotService = require('../services/chatbotService'); // <--- your service
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /send-final-and-subscription-email
 * ---------------------------------------
 * Creates a final+subscription Stripe Checkout Session & emails it to the client.
 * Expects { chatbotId } in req.body.
 */
router.post('/send-final-and-subscription-email', async (req, res) => {
    try {
        const { chatbotId } = req.body;
        if (!chatbotId) {
            return res.status(400).json({ error: 'chatbotId is required' });
        }

        // 1) Find the chatbot
        const chatbot = await Chatbot.findById(chatbotId);
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        // 2) Must have depositPaid = true
        if (!chatbot.depositPaid) {
            return res.status(400).json({ error: 'Deposit not paid yet' });
        }

        // 3) Create final+subscription session
        const session = await PaymentService.createFinalPlusSubscriptionSession(chatbot);
        if (!session.url) {
            return res.status(500).json({ error: 'Failed to create Stripe session' });
        }

        // 4) Email user if available
        if (!chatbot.userEmail) {
            return res.status(400).json({ error: 'No userEmail associated with this chatbot' });
        }

        // IonOS email config
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

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Failed to send final+subscription email:', err);
                return res.status(500).json({ error: 'Failed to send email' });
            }
            console.log('Final+subscription email sent:', info.response);
            return res.json({ message: 'Final+subscription email sent successfully!' });
        });

    } catch (err) {
        console.error('Error in send-final-and-subscription-email:', err);
        return res.status(500).json({ error: 'Server error sending final+subscription email' });
    }
});

/**
 * POST /finalize-chatbot
 * ----------------------
 * Calls chatbotService.finalizeChatbot to finalize the record,
 * ensures finalPaymentPaid is true, then returns a snippet.
 * Expects { chatbotId } in req.body.
 */
router.post('/finalize-chatbot', async (req, res) => {
    try {
        const { chatbotId } = req.body;
        if (!chatbotId) {
            return res.status(400).json({ error: 'Missing chatbotId' });
        }

        // Instead of redoing the logic, call your service:
        const chatbot = await chatbotService.finalizeChatbot(chatbotId);
        if (!chatbot) {
            return res.status(404).json({ error: 'Chatbot not found' });
        }

        // finalizeChatbot will throw if finalPaymentPaid = false
        // If we reached here, it means it was successful
        return res.json({
            success: true,
            message: 'Chatbot finalized successfully!',
            codeSnippet: chatbot.codeSnippet
        });

    } catch (err) {
        console.error('Error finalizing chatbot:', err);

        // If we threw an error "Final payment not done yet", handle that
        if (err.message === 'Final payment not done yet') {
            return res.status(400).json({ error: err.message });
        }

        return res.status(500).json({ error: 'Server error finalizing chatbot' });
    }
});

/**
 * GET /payments/session-info
 * --------------------------
 * Retrieves Stripe checkout session details for receipt display
 * (transaction ID, amount, date, chatbotId in metadata, etc.)
 */
router.get('/payments/session-info', async (req, res) => {
    const sessionId = req.query.session_id;
    if (!sessionId) {
        return res.status(400).json({ error: 'No session_id provided' });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent'],
        });

        const amountInDollars = (session.amount_total / 100).toFixed(2);
        const transactionId = session.payment_intent?.id || session.id;
        const paymentEpoch = session.payment_intent?.created || session.created;
        const paymentDate = new Date(paymentEpoch * 1000).toLocaleString();
        const chatbotId = session.metadata?.chatbotId || 'N/A';

        return res.json({
            transactionId,
            amountPaid: `$${amountInDollars}`,
            paymentDate,
            chatbotId,
        });
    } catch (err) {
        console.error('Error retrieving session info from Stripe:', err);
        return res.status(500).json({ error: 'Failed to retrieve session info' });
    }
});

/**
 * POST /create-deposit-session
 * -----------------------------
 * Creates a Stripe deposit session & optionally emails a deposit link.
 * Expects { chatbotId } in req.body.
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

        // Return session url for the client/admin if needed
        res.json({ url: session.url });

    } catch (err) {
        console.error('Error in /create-deposit-session:', err);
        res.status(500).json({ error: 'Error creating deposit session' });
    }
});

module.exports = router;
