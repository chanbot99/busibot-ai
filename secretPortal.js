/*************************************************************
 * secretPortal.js
 * --------
 * Front-end logic for the Busibot Admin dashboard. This script:
 *  - Sends the admin password to the server for verification (no more hard-coded password).
 *  - Creates new chatbot records by sending POST requests to the backend.
 *  - Fetches and displays the list of chatbots.
 *  - Provides a button to send final+subscription payment links once deposit is paid.
 *************************************************************/

/*************************************************************
 * 1) Configuration for Separate Backend Domain
 *************************************************************/
const API_BASE_URL = 'https://busibot-payments.fly.dev';

/*************************************************************
 * 2) Basic Password + Toggling Containers
 *************************************************************/
const loginContainer = document.getElementById('login-container');
const adminContainer = document.getElementById('admin-container');
const loginBtn = document.getElementById('login-btn');
const adminPasswordInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');

/**
 * On login, we POST the password to the server's /api/admin/login route.
 * The server verifies the password via hashed credentials.
 * If valid, we hide the login UI and load the admin dashboard.
 * If invalid, we display an error message.
 */
loginBtn.addEventListener('click', async () => {
    // Clear any previous error
    loginError.classList.add('hidden');

    const enteredPass = adminPasswordInput.value.trim();
    if (!enteredPass) {
        loginError.textContent = "Please enter a password.";
        loginError.classList.remove('hidden');
        return;
    }

    try {
        // Send the entered password to the server for verification
        const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: enteredPass })
        });

        if (res.ok) {
            // Password is valid: hide login, show admin UI, load chatbots
            loginContainer.classList.add('hidden');
            adminContainer.classList.remove('hidden');
            loadAllChatbots();
        } else if (res.status === 401) {
            // Invalid password
            loginError.textContent = "Invalid password.";
            loginError.classList.remove('hidden');
        } else {
            // Some other error
            const data = await res.json();
            loginError.textContent = data.error || "Unknown login error.";
            loginError.classList.remove('hidden');
        }
    } catch (err) {
        console.error("Login request failed:", err);
        loginError.textContent = "Network error trying to log in.";
        loginError.classList.remove('hidden');
    }
});

/*************************************************************
 * 3) Creating a Chatbot
 *************************************************************/
const createChatbotBtn = document.getElementById('create-chatbot-btn');
const userEmailInput = document.getElementById('userEmail');
const depositAmountInput = document.getElementById('depositAmount');
const finalAmountInput = document.getElementById('finalAmount');
const monthlyAmountInput = document.getElementById('monthlyAmount');
const createMessage = document.getElementById('create-message');
const createError = document.getElementById('create-error');

/**
 * When the "Create Chatbot" button is clicked, read the
 * input fields, generate a random uniqueBotId, and POST
 * the data to the server's /chatbots endpoint.
 */
createChatbotBtn.addEventListener('click', async () => {
    // Hide any previous success/error messages
    createMessage.classList.add('hidden');
    createError.classList.add('hidden');

    // Gather input values
    const userEmail = userEmailInput.value.trim();
    const depositAmount = parseFloat(depositAmountInput.value);
    const finalAmount = parseFloat(finalAmountInput.value);
    const monthlyAmount = parseFloat(monthlyAmountInput.value) || 0;

    // Generate a simple 6-char random ID
    const uniqueBotId = Math.random().toString(36).substring(2, 8);

    // Basic validation
    if (!depositAmount || !finalAmount) {
        createError.textContent = "Deposit and Final amounts are required!";
        createError.classList.remove('hidden');
        return;
    }

    try {
        // 1) POST to create the new chatbot doc
        const createRes = await fetch(`${API_BASE_URL}/api/admin/chatbots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail,
                depositAmount,
                finalAmount,
                monthlyAmount,
                uniqueBotId
            })
        });
        const createData = await createRes.json();

        // Check for creation errors
        if (!createRes.ok) {
            throw new Error(createData.error || 'Failed to create chatbot');
        }

        // 2) If successful, show success + clear fields
        createMessage.textContent = "Chatbot created successfully!";
        createMessage.classList.remove('hidden');

        userEmailInput.value = '';
        depositAmountInput.value = '';
        finalAmountInput.value = '';
        monthlyAmountInput.value = '';

        // 3) Immediately call /create-deposit-session
        // to generate+email the deposit link, if userEmail is set
        if (createData._id) {
            console.log("Creating deposit session for chatbot:", createData._id);
            const depositRes = await fetch(`${API_BASE_URL}/api/create-deposit-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatbotId: createData._id })
            });

            if (!depositRes.ok) {
                console.warn("Failed to create deposit session automatically.");
                // We won't block the overall creation if deposit session fails,
                // but you could show a warning to the user if you want.
            }
        }

        // 4) Reload the chatbot list in the admin UI
        loadAllChatbots();

    } catch (err) {
        // Show error to the user
        createError.textContent = err.message;
        createError.classList.remove('hidden');
    }
});

/*************************************************************
 * 4) Loading and Rendering Chatbots
 *************************************************************/
const chatbotList = document.getElementById('chatbot-list');

/**
 * loadAllChatbots
 * ---------------
 * Fetches the list of chatbots from the backend and renders them.
 */
async function loadAllChatbots() {
    chatbotList.innerHTML = 'Loading...';
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/chatbots`);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Failed to load chatbots');
        }

        renderChatbots(data);

    } catch (err) {
        chatbotList.innerHTML = `<p class="error">${err.message}</p>`;
    }
}

/**
 * renderChatbots
 * --------------
 * Displays each chatbot in the list, showing payment statuses.
 * If depositPaid is true but finalPaymentPaid is false,
 * shows a button to send the final+subscription email link.
 */
function renderChatbots(chatbots) {
    if (!chatbots || chatbots.length === 0) {
        chatbotList.innerHTML = '<p>No chatbots found.</p>';
        return;
    }

    chatbotList.innerHTML = '';
    chatbots.forEach(bot => {
        const hasPaidDeposit = bot.depositPaid ? 'Yes' : 'No';

        const div = document.createElement('div');
        div.classList.add('chatbot-item');
        div.innerHTML = `
            <h3>Chatbot ID: ${bot._id}</h3>
            <p>User Email: ${bot.userEmail || "N/A"}</p>
            <p>Deposit Amount (dollars): ${bot.depositAmount}</p>
            <p>Final Amount (dollars): ${bot.finalAmount}</p>
            <p>Monthly Amount (dollars): ${bot.monthlyAmount || 0}</p>
            <p>Deposit Paid: ${bot.depositPaid}</p>
            <p>Final Paid: ${bot.finalPaymentPaid}</p>
            <p><strong>hasPaidDeposit:</strong> ${hasPaidDeposit}</p>
            <p>Status: ${bot.status}</p>
            <div class="buttons-group" id="buttons-group-${bot._id}"></div>
        `;

        chatbotList.appendChild(div);

        // If deposit is paid but final is NOT, show a button to send final+subscription email
        if (bot.depositPaid && !bot.finalPaymentPaid) {
            const buttonsGroup = div.querySelector(`#buttons-group-${bot._id}`);
            const sendEmailBtn = document.createElement('button');
            sendEmailBtn.textContent = "Send Final + Subscription Email";

            // On click, triggers the function to send the email link
            sendEmailBtn.addEventListener('click', () => {
                sendFinalAndSubscriptionEmail(bot._id);
            });

            buttonsGroup.appendChild(sendEmailBtn);
        }
    });
}

/*************************************************************
 * 5) Send Final + Subscription Email
 *************************************************************/
async function sendFinalAndSubscriptionEmail(chatbotId) {
    try {
        // POST to the server route that generates the final+subscription session
        // and emails the link to the user's email.
        const res = await fetch(`${API_BASE_URL}/api/send-final-and-subscription-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatbotId })
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Failed to send email');
        }

        alert(`Email sent: ${data.message || "Success!"}`);

    } catch (err) {
        alert(`Error: ${err.message}`);
    }
}
