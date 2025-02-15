require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const Stripe = require('stripe');

// Import your routes
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

/**
 * 1) Connect to MongoDB
 */
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('MongoDB connected');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

/**
 * 2) Enable CORS
 *    If serving front end from the same domain, you can limit these origins.
 *    Keep them if you need cross-domain dev (localhost).
 */
app.use(cors({
    origin: [
        'https://busibot.ai',
        'http://localhost:3000'
    ],
    credentials: true
}));

/**
 * 3) Serve Static Files from "public/"
 * ------------------------------------
 * If your front-end is merged, all .html, .css, .js, images, etc.
 * are placed in the /public folder.
 * e.g. public/index.html, public/css/base.css, etc.
 */
app.use(express.static('public'));

/**
 * Example route for your secret portal (admin UI)
 * Serves the 'secretPortal.html' from public/secretPortal.html
 */
app.get('/secretPortal', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'secretPortal.html'));
});

/**
 * 4) Stripe Webhook Route (Raw Body Parsing)
 * ------------------------------------------
 * Mount /api/stripe-webhook with raw body parser BEFORE express.json().
 * Ensures the request body is raw for signature verification.
 */
app.use(
    '/api/stripe-webhook',
    bodyParser.raw({ type: 'application/json' }),
    webhookRoutes
);

/**
 * 5) Parse JSON for all NON-webhook routes
 */
app.use(express.json());

/**
 * 6) Healthcheck
 */
app.get('/api/healthcheck', (req, res) => {
    res.json({ status: 'ok' });
});

/**
 * 7) Admin Routes (/api/admin)
 */
app.use('/api/admin', adminRoutes);

/**
 * 8) Payment Routes (/api)
 */
app.use('/api', paymentRoutes);

/**
 * 9) Initialize Stripe (if needed elsewhere)
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * DYNAMIC PAYMENT-SUCCESS ROUTE
 * -----------------------------
 * If you'd like to verify the session and then serve payment-success.html,
 * define a route here (GET /payment-success).
 */
app.get('/payment-success', async (req, res) => {
    const sessionId = req.query.session_id;
    if (!sessionId) {
        return res.status(400).send('<h1>Missing session_id in query</h1>');
    }

    try {
        // Retrieve the checkout session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Check if the session is paid
        if (!session || session.payment_status !== 'paid') {
            return res.status(400).send('<h1>Payment not completed or invalid session</h1>');
        }

        // If valid, serve payment-success.html from /public
        return res.sendFile(path.join(__dirname, 'public', 'payment-success.html'));
    } catch (err) {
        console.error('Error verifying Stripe session:', err);
        return res.status(500).send('<h1>Server error verifying payment</h1>');
    }
});

app.get('/final-payment-success', async (req, res) => {
    const sessionId = req.query.session_id;
    if (!sessionId) {
        return res.status(400).send('<h1>Missing session_id in query</h1>');
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!session || session.payment_status !== 'paid') {
            return res.status(400).send('<h1>Payment not completed or invalid session</h1>');
        }

        // If valid, serve final-payment-success.html
        return res.sendFile(path.join(__dirname, 'public', 'final-payment-success.html'));
    } catch (err) {
        console.error('Error verifying Stripe session:', err);
        return res.status(500).send('<h1>Server error verifying payment</h1>');
    }
});

/**
 * 10) Start the Server
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
