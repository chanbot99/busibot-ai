/*************************************************************
 * secretPortal.js
 *************************************************************/

/*************************************************************
 * 1) Basic Password + Toggling Containers
 *************************************************************/
const loginContainer = document.getElementById('login-container');
const adminContainer = document.getElementById('admin-container');
const loginBtn = document.getElementById('login-btn');
const adminPasswordInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');

/**
 * On login, we POST the password to the server's /api/admin/login route.
 */
loginBtn.addEventListener('click', async () => {
    loginError.classList.add('hidden');
    const enteredPass = adminPasswordInput.value.trim();

    if (!enteredPass) {
        loginError.textContent = "Please enter a password.";
        loginError.classList.remove('hidden');
        return;
    }

    try {
        // Now using /api/admin/login (relative path)
        const res = await fetch("/api/admin/login", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: enteredPass })
        });

        if (res.ok) {
            loginContainer.classList.add('hidden');
            adminContainer.classList.remove('hidden');
            loadAllChatbots();
        } else if (res.status === 401) {
            loginError.textContent = "Invalid password.";
            loginError.classList.remove('hidden');
        } else {
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
 * 2) Creating a Chatbot
 *************************************************************/
const createChatbotBtn = document.getElementById('create-chatbot-btn');
const userEmailInput = document.getElementById('userEmail');
const depositAmountInput = document.getElementById('depositAmount');
const finalAmountInput = document.getElementById('finalAmount');
const monthlyAmountInput = document.getElementById('monthlyAmount');
const createMessage = document.getElementById('create-message');
const createError = document.getElementById('create-error');

createChatbotBtn.addEventListener('click', async () => {
    createMessage.classList.add('hidden');
    createError.classList.add('hidden');

    const userEmail = userEmailInput.value.trim();
    const depositAmount = parseFloat(depositAmountInput.value);
    const finalAmount = parseFloat(finalAmountInput.value);
    const monthlyAmount = parseFloat(monthlyAmountInput.value) || 0;

    if (!depositAmount || !finalAmount) {
        createError.textContent = "Deposit and Final amounts are required!";
        createError.classList.remove('hidden');
        return;
    }

    try {
        const createRes = await fetch("/api/admin/chatbots", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail,
                depositAmount,
                finalAmount,
                monthlyAmount,
                uniqueBotId: Math.random().toString(36).substring(2, 8)
            })
        });
        const createData = await createRes.json();

        if (!createRes.ok) {
            throw new Error(createData.error || 'Failed to create chatbot');
        }

        createMessage.textContent = "Chatbot created successfully!";
        createMessage.classList.remove('hidden');

        userEmailInput.value = '';
        depositAmountInput.value = '';
        finalAmountInput.value = '';
        monthlyAmountInput.value = '';

        // Immediately call /create-deposit-session if needed
        if (createData._id) {
            console.log("Creating deposit session for chatbot:", createData._id);
            const depositRes = await fetch("/api/create-deposit-session", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatbotId: createData._id })
            });
            // if (!depositRes.ok) { ... } // optionally handle errors
        }

        loadAllChatbots();
    } catch (err) {
        createError.textContent = err.message;
        createError.classList.remove('hidden');
    }
});

/*************************************************************
 * 3) Loading and Rendering Chatbots
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
        const res = await fetch("/api/admin/chatbots");
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

            sendEmailBtn.addEventListener('click', () => {
                sendFinalAndSubscriptionEmail(bot._id);
            });

            buttonsGroup.appendChild(sendEmailBtn);
        }
    });
}

/*************************************************************
 * 4) Send Final + Subscription Email
 *************************************************************/
async function sendFinalAndSubscriptionEmail(chatbotId) {
    try {
        const res = await fetch("/api/send-final-and-subscription-email", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatbotId })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to send email');
        }
        const result = await res.json();
        alert(`Email sent: ${result.message || "Success!"}`);
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
}
