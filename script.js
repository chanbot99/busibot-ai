/************************************************************
 * 0) Global Variables & DOM Elements
 ************************************************************/
localStorage.removeItem('busibotThreadId');
// ===========================
//  Change this to your server
// ===========================
const BOT_SERVER_URL = "https://busibot-monorepo.onrender.com"; // e.g. "http://localhost:8080" or "https://mydomain.com"

// We'll store our thread ID for the bottom-right Busibot chat
let busibotThreadId = null; // always start fresh

// This userId was already in your code for the carousel bots
let userId = "user-" + Math.floor(Math.random() * 100000);

let chatOpen = false; // Tracks if bottom-right chat is open

// DOM references for the bottom-right chat
const chatTab = document.getElementById('busibot-chat-tab');
const chatWidget = document.getElementById('busibot-chat-widget');
const chatMessages = document.getElementById('busibot-messages');
const notificationBadge = document.getElementById('busibot-notification-badge');

/************************************************************
 * 1) Particles.js Initialization
 ************************************************************/
particlesJS("particles-js", {
    "particles": {
        "number": { "value": 150, "density": { "enable": true, "value_area": 800 } },
        "color": { "value": "#0299eb" },
        "shape": { "type": "circle" },
        "size": { "value": 3, "random": true },
        "line_linked": {
            "enable": true,
            "distance": 150,
            "color": "#047aba",
            "opacity": 0.4,
            "width": 1
        },
        "move": { "enable": true, "speed": 2 }
    },
    "retina_detect": true
});

/************************************************************
 * 2) Carousel of Demo Bots (Real Estate, Bakery, Boutique, Electrical)
 ************************************************************/
const containerData = [
    {
        containerEl: document.getElementById('chat-realestate'),
        inputEl: document.getElementById('input-realestate'),
        sendBtn: document.getElementById('send-realestate'),
        messagesEl: document.getElementById('messages-realestate'),
        endpoint: "https://busibot-demo-real-estate.onrender.com/chat"
    },
    {
        containerEl: document.getElementById('chat-bakery'),
        inputEl: document.getElementById('input-bakery'),
        sendBtn: document.getElementById('send-bakery'),
        messagesEl: document.getElementById('messages-bakery'),
        endpoint: "https://busibot-demo-bakery.onrender.com/chat"
    },
    {
        containerEl: document.getElementById('chat-boutique'),
        inputEl: document.getElementById('input-boutique'),
        sendBtn: document.getElementById('send-boutique'),
        messagesEl: document.getElementById('messages-boutique'),
        endpoint: "https://busibot-demo-boutique.onrender.com/chat"
    },
    {
        containerEl: document.getElementById('chat-electrical'),
        inputEl: document.getElementById('input-electrical'),
        sendBtn: document.getElementById('send-electrical'),
        messagesEl: document.getElementById('messages-electrical'),
        endpoint: "https://busibot-demo-eletrical.onrender.com/chat"
    }
];

// Keep track of which bot is active (center) in the carousel
let activeIndex = 0;

function updateCarousel() {
    containerData.forEach(d => {
        d.containerEl.classList.remove('left','center','right','hidden');
        d.inputEl.disabled = true;
        d.inputEl.placeholder = "";
        d.sendBtn.disabled = true;
    });

    const len = containerData.length;
    const leftIndex = (activeIndex - 1 + len) % len;
    const centerIndex = activeIndex;
    const rightIndex = (activeIndex + 1) % len;

    containerData[leftIndex].containerEl.classList.add('left');
    containerData[centerIndex].containerEl.classList.add('center');
    containerData[rightIndex].containerEl.classList.add('right');

    // Hide all others
    for (let i = 0; i < len; i++) {
        if (i !== leftIndex && i !== centerIndex && i !== rightIndex) {
            containerData[i].containerEl.classList.add('hidden');
        }
    }

    // Enable input & send button for active (center) bot
    containerData[centerIndex].inputEl.disabled = false;
    containerData[centerIndex].sendBtn.disabled = false;
    containerData[centerIndex].inputEl.placeholder = "Type a message...";
}
updateCarousel();

// Carousel arrow controls
const arrowLeft = document.getElementById('arrow-left');
const arrowRight = document.getElementById('arrow-right');
arrowLeft.addEventListener('click', () => {
    activeIndex = (activeIndex - 1 + containerData.length) % containerData.length;
    updateCarousel();
});
arrowRight.addEventListener('click', () => {
    activeIndex = (activeIndex + 1) % containerData.length;
    updateCarousel();
});

// Event listeners for sending messages to each bot
containerData.forEach((botData, idx) => {
    const { sendBtn, inputEl } = botData;
    sendBtn.addEventListener('click', () => sendMessage(idx));
    inputEl.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendMessage(idx);
    });
});

/**
 * Send message to a specific carousel bot
 */
async function sendMessage(botIdx) {
    const { inputEl, messagesEl, endpoint } = containerData[botIdx];
    if (inputEl.disabled) return;

    const text = inputEl.value.trim();
    if (!text) return;

    // Append user's message
    appendCarouselMessage(messagesEl, "user", text);
    inputEl.value = "";

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, message: text })
        });
        if (!res.ok) {
            appendCarouselMessage(messagesEl, "bot", "Error communicating with server.");
            return;
        }
        const data = await res.json();
        appendCarouselMessage(messagesEl, "bot", data.botReply || "No reply received.");
    } catch (err) {
        appendCarouselMessage(messagesEl, "bot", "Error connecting to server.");
    }
}

/**
 * Appends messages within each carousel bot's messages container
 */
function appendCarouselMessage(msgContainer, sender, text) {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('message-row', sender);

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble');
    bubbleDiv.textContent = text;

    msgContainer.appendChild(rowDiv);
    rowDiv.appendChild(bubbleDiv);
    msgContainer.scrollTop = msgContainer.scrollHeight;
}


/************************************************************
 * 3) Floating Bottom-Right Chat (Main Busibot.ai endpoint)
 ************************************************************/

/**
 *  Thread creation: We'll call this once at startup (or first message)
 *  to retrieve a thread_id from our Node.js server's /start endpoint.
 */
async function initBusibotThread() {
    try {
        const response = await fetch(`${BOT_SERVER_URL}/start`);
        if (!response.ok) {
            console.error("Error fetching /start:", response.statusText);
            return null;
        }
        const data = await response.json();
        busibotThreadId = data.thread_id;
        console.log("Thread initialized:", busibotThreadId);
        return busibotThreadId;
    } catch (err) {
        console.error("Could not initialize thread:", err);
        return null;
    }
}

/**
 * Toggles the bottom-right chat
 */
function toggleBusibotChat() {
    chatOpen = !chatOpen; // flip the boolean

    const chatWidget = document.getElementById('busibot-chat-widget');
    const chatTab = document.getElementById('busibot-chat-tab');

    if (chatOpen) {
        // Show the main chat
        chatWidget.style.display = 'flex';
        // Hide the tab
        chatTab.style.display = 'none';

        // Hide notification badge if any
        const badge = document.getElementById('busibot-notification-badge');
        badge.style.display = 'none';
        badge.textContent = '';
    } else {
        // Hide the main chat
        chatWidget.style.display = 'none';
        // Re-show the tab
        chatTab.style.display = 'block';
    }
}

function minimizeBusibotChat() {
    chatOpen = false;
    const chatWidget = document.getElementById('busibot-chat-widget');
    chatWidget.style.display = 'none';

    const chatTab = document.getElementById('busibot-chat-tab');
    chatTab.style.display = 'flex';

    // Clear any notification badge
    const badge = document.getElementById('busibot-notification-badge');
    badge.style.display = 'none';
    badge.textContent = '';
}

/**
 * Reusable function to show "typing..." indicator
 */
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message-row', 'bot', 'typing-indicator');

    typingDiv.innerHTML = `
    <img class="avatar bot" src="./css/images/bot.png" alt="Bot Avatar" />
    <div class="bubble typing-bubble">
      <span class="dots"></span>
      <span class="dots"></span>
      <span class="dots"></span>
    </div>
  `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
}

/**
 * Reveal text character-by-character for the bot
 */
function typeTextBubble(fullText) {
    return new Promise((resolve) => {
        const rowDiv = document.createElement("div");
        rowDiv.classList.add("message-row", "bot");

        const avatarImg = document.createElement("img");
        avatarImg.classList.add("avatar", "bot");
        avatarImg.src = "./css/images/bot.png";

        const bubbleDiv = document.createElement("div");
        bubbleDiv.classList.add("bubble");

        rowDiv.appendChild(avatarImg);
        rowDiv.appendChild(bubbleDiv);
        chatMessages.appendChild(rowDiv);

        let index = 0;
        const timer = setInterval(() => {
            bubbleDiv.textContent = fullText.slice(0, index + 1);
            index++;
            chatMessages.scrollTop = chatMessages.scrollHeight;

            if (index >= fullText.length) {
                clearInterval(timer);
                resolve();
            }
        }, 30);
    });
}

async function sendBusibotMessage() {
    const textarea = document.getElementById('busibot-textarea');
    const text = textarea.value.trim();
    if (!text) return; // ignore empty

    // 1) user message
    appendMessage('user', text);

    // 2) clear
    textarea.value = '';

    // 3) ensure we have a thread
    if (!busibotThreadId) {
        busibotThreadId = await initBusibotThread();
        if (!busibotThreadId) {
            appendMessage('bot', 'Error initializing chat session.');
            return;
        }
    }

    // 4) show typing
    const typingIndicator = showTypingIndicator();

    // 5) fetch
    try {
        const payload = { thread_id: busibotThreadId, message: text };
        const response = await fetch(`${BOT_SERVER_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            typingIndicator.remove();
            appendMessage('bot', 'Error communicating with the server.');
            return;
        }

        const data = await response.json();
        const botReply = data.response || 'No reply from server.';

        // remove typing
        typingIndicator.remove();

        // type out the final message
        await typeTextBubble(botReply);

    } catch (err) {
        console.error("Error calling /chat:", err);
        typingIndicator.remove();
        appendMessage('bot', 'Error: Unable to reach server.');
    }
}

/**
 * Appends a user/bot message in the bottom-right chat
 */
function appendMessage(sender, text) {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('message-row', sender);

    const avatarImg = document.createElement('img');
    avatarImg.classList.add('avatar', sender);
    avatarImg.src = (sender === 'bot')
        ? './css/images/bot.png'
        : './css/images/user.png';

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble');

    if (sender === 'bot') {
        bubbleDiv.innerHTML = formatBotReply(text);
    } else {
        bubbleDiv.textContent = text;
    }

    // Timestamp
    const timestampDiv = document.createElement('div');
    timestampDiv.classList.add('timestamp');
    const now = new Date();
    timestampDiv.textContent = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    bubbleDiv.appendChild(timestampDiv);

    rowDiv.appendChild(avatarImg);
    rowDiv.appendChild(bubbleDiv);
    chatMessages.appendChild(rowDiv);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (!chatOpen && sender === 'bot') {
        playNotificationSound();
        notificationBadge.style.display = 'flex';
        notificationBadge.textContent = '1';
    }
}

/**
 * Auto-grow the textarea
 */
function autoGrow(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

/**
 * Send message on Enter (without shift or ctrl)
 */
function checkEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
        event.preventDefault();
        sendBusibotMessage();
    }
}

function playNotificationSound() {
    const audio = document.getElementById('notification-sound');
    if (audio) {
        audio.play().catch(err => {
            console.warn('Audio playback prevented by browser:', err);
        });
    }
}


/************************************************************
 * 4) Automatic Greeting after Page Load
 ************************************************************/
window.addEventListener('load', async () => {
    if (!busibotThreadId) {
        await initBusibotThread();
    }

    addWelcomeBanner();

    setTimeout(() => {
        appendMessage('bot', "I'm here to assist if you need me!");
        appendWrappedQuestionsBubble();
    }, 2000);
});

/**
 * Replaces your old "form" with a modal that now has a HubSpot form
 * The contact modal open/close logic stays the same, but we removed the old custom form
 */

const contactModal = document.getElementById('contact-modal');
const openFormButtons = document.querySelectorAll('.open-form');
const closeFormButton = document.querySelector('.close-btn');

// Open the modal when any "Get Started" button is clicked
openFormButtons.forEach(button => {
    button.addEventListener('click', () => {
        contactModal.style.display = 'block';
    });
});

// Close modal when X button is clicked
closeFormButton.addEventListener('click', () => {
    contactModal.style.display = 'none';
});

// Close modal if user clicks outside content area
window.addEventListener('click', (event) => {
    if (event.target === contactModal) {
        contactModal.style.display = 'none';
    }
});

/**
 * Replace your old form submission code with this new approach:
 * HubSpot embedded form is handled by HubSpot, so no custom submission logic needed.
 */

/**
 * Minimal text formatting for bot replies (replacing newlines with <br>)
 */
function formatBotReply(text) {
    const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const html = marked.parse(escaped);
    return html;
}

function addWelcomeBanner() {
    const chatMessages = document.getElementById('busibot-messages');
    const welcomeDiv = document.createElement('div');
    welcomeDiv.classList.add('busibot-welcome-banner');

    welcomeDiv.innerHTML = `
    <img src="css/logo/FullLogo_Transparent.png" alt="Busibot Logo" class="busibot-welcome-logo" />
    <h3>Your AI Agent</h3>
    <p>Hi, how can I help you today?</p>
  `;
    chatMessages.appendChild(welcomeDiv);
}

/**
 * Creates a single row with 5 side-by-side bubbles:
 * - "Get Started Now" => opens contact modal
 * - 4 other question bubbles => fill chat input, ask question
 */
function appendWrappedQuestionsBubble() {
    const items = [
        { label: "Get Started Now", type: "contact" },
        { label: "Why Busibot.ai?", type: "question" },
        { label: "Show Me Pricing", type: "question" },
        { label: "How Does It Work?", type: "question" },
        { label: "Use Cases", type: "question" }
    ];

    const rowDiv = document.createElement('div');
    rowDiv.classList.add('message-row', 'user', 'multi-question-row');

    items.forEach(item => {
        const bubbleDiv = document.createElement('div');
        bubbleDiv.classList.add('bubble', 'question-bubble');
        bubbleDiv.textContent = item.label;

        bubbleDiv.addEventListener('click', () => {
            if (item.type === "contact") {
                document.getElementById('contact-modal').style.display = 'block';
            } else {
                const mainTextarea = document.getElementById('busibot-textarea');
                mainTextarea.value = item.label;
                sendBusibotMessage();
            }
            rowDiv.remove();
        });

        rowDiv.appendChild(bubbleDiv);
    });

    chatMessages.appendChild(rowDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
