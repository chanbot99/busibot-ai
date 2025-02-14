/*************************************************************
 * Configuration for Separate Backend Domain
 *************************************************************/
const API_BASE_URL = 'https://busibot-payments.fly.dev';

/*************************************************************
 * Basic Password + Toggling Containers
 *************************************************************/
const loginContainer = document.getElementById('login-container');
const adminContainer = document.getElementById('admin-container');
const loginBtn = document.getElementById('login-btn');
const adminPasswordInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');

/**
 * THIS IS NOT SECURE FOR PRODUCTION
 * but demonstrates a simple client-side password check.
 */
const ADMIN_PASS = "SuperSecret123"; // Example password

loginBtn.addEventListener('click', () => {
    const enteredPass = adminPasswordInput.value.trim();
    if (enteredPass === ADMIN_PASS) {
        // Hide the login container
        loginContainer.classList.add('hidden');
        // Show the admin container
        adminContainer.classList.remove('hidden');

        // Load existing chatbots
        loadAllChatbots();
    } else {
        loginError.textContent = "Invalid password.";
        loginError.classList.remove('hidden');
    }
});

/*************************************************************
 * Creating a Chatbot
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
    const depositAmount = parseInt(depositAmountInput.value, 10);
    const finalAmount = parseInt(finalAmountInput.value, 10);
    const monthlyAmount = parseInt(monthlyAmountInput.value, 10) || 0;

    // Basic validation
    if (!depositAmount || !finalAmount) {
        createError.textContent = "Deposit and Final amounts are required!";
        createError.classList.remove('hidden');
        return;
    }

    try {
        // POST to your *remote* server to create a chatbot doc
        const res = await fetch(`${API_BASE_URL}/api/admin/chatbots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail, depositAmount, finalAmount, monthlyAmount })
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Failed to create chatbot');
        }

        createMessage.textContent = "Chatbot created successfully!";
        createMessage.classList.remove('hidden');

        // Clear fields
        userEmailInput.value = '';
        depositAmountInput.value = '';
        finalAmountInput.value = '';
        monthlyAmountInput.value = '';

        // Reload the chatbot list
        loadAllChatbots();
    } catch (err) {
        createError.textContent = err.message;
        createError.classList.remove('hidden');
    }
});

/*************************************************************
 * Loading and Rendering Chatbots
 *************************************************************/
const chatbotList = document.getElementById('chatbot-list');

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
 * Render each Chatbot and show:
 * - Deposit Paid
 * - Final Paid
 * - HasPaidDeposit (Yes/No)
 * - If deposit is paid but final isn't, a button to send email for final + subscription
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
      <p>Deposit Amount (cents): ${bot.depositAmount}</p>
      <p>Final Amount (cents): ${bot.finalAmount}</p>
      <p>Monthly Amount (cents): ${bot.monthlyAmount || 0}</p>
      <p>Deposit Paid: ${bot.depositPaid}</p>
      <p>Final Paid: ${bot.finalPaymentPaid}</p>
      <p><strong>hasPaidDeposit:</strong> ${hasPaidDeposit}</p>
      <p>Status: ${bot.status}</p>
      <div class="buttons-group" id="buttons-group-${bot._id}"></div>
    `;

        chatbotList.appendChild(div);

        // If deposit is paid but final is not, show a button to send email
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
 * Function to Send the Final + Subscription Email
 * (Triggered when "Send Final + Subscription Email" is clicked)
 *************************************************************/
async function sendFinalAndSubscriptionEmail(chatbotId) {
    try {
        // POST to your *remote* server
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
