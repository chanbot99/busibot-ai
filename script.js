/************************************************************
 * 0) Global Variables & DOM Elements
 ************************************************************/
localStorage.removeItem('busibotThreadId');
// ===========================
//  Change this to your server
// ===========================
const BOT_SERVER_URL = "https://busibot-monorepo.onrender.com"; // e.g. "http://localhost:8080" or "https://mydomain.com"

// We'll store the Busibot thread ID separately (bottom-right chat)
let busibotThreadId = null;

// Each carousel bot will store its own threadId in containerData
let userId = "user-" + Math.floor(Math.random() * 100000);

let chatOpen = false; // Tracks if bottom-right chat is open

// Bottom-right chat DOM
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
// We removed the { label: "Contact Me!", type: "contact" } for each carousel bot.
const containerData = [
    {
        containerEl: document.getElementById('chat-realestate'),
        inputEl: document.getElementById('input-realestate'),
        sendBtn: document.getElementById('send-realestate'),
        messagesEl: document.getElementById('messages-realestate'),
        endpoint: "https://busibot-demo-real-estate.onrender.com/chat",
        startUrl: "https://busibot-demo-real-estate.onrender.com/start",
        threadId: null,
        quickQuestions: [
            { label: "Available Properties", type: "question" },
            { label: "Schedule a Viewing", type: "question" },
            { label: "Neighborhood Info", type: "question" },
            { label: "Mortgage Rates", type: "question" }
        ]
    },
    {
        containerEl: document.getElementById('chat-bakery'),
        inputEl: document.getElementById('input-bakery'),
        sendBtn: document.getElementById('send-bakery'),
        messagesEl: document.getElementById('messages-bakery'),
        endpoint: "https://busibot-demo-bakery.onrender.com/chat",
        startUrl: "https://busibot-demo-bakery.onrender.com/start",
        threadId: null,
        quickQuestions: [
            { label: "Today's Specials", type: "question" },
            { label: "Vegan Options", type: "question" },
            { label: "Delivery Options", type: "question" },
            { label: "Custom Cakes", type: "question" }
        ]
    },
    {
        containerEl: document.getElementById('chat-boutique'),
        inputEl: document.getElementById('input-boutique'),
        sendBtn: document.getElementById('send-boutique'),
        messagesEl: document.getElementById('messages-boutique'),
        endpoint: "https://busibot-demo-boutique.onrender.com/chat",
        startUrl: "https://busibot-demo-boutique.onrender.com/start",
        threadId: null,
        quickQuestions: [
            { label: "Latest Collection", type: "question" },
            { label: "Size Availability", type: "question" },
            { label: "Return Policy", type: "question" },
            { label: "In-Store Events", type: "question" }
        ]
    },
    {
        containerEl: document.getElementById('chat-electrical'),
        inputEl: document.getElementById('input-electrical'),
        sendBtn: document.getElementById('send-electrical'),
        messagesEl: document.getElementById('messages-electrical'),
        endpoint: "https://busibot-demo-eletrical.onrender.com/chat",
        startUrl: "https://busibot-demo-eletrical.onrender.com/start",
        threadId: null,
        quickQuestions: [
            { label: "Schedule Repair", type: "question" },
            { label: "Electrical Upgrades", type: "question" },
            { label: "Pricing & Quotes", type: "question" },
            { label: "Emergency Services", type: "question" }
        ]
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

/************************************************************
 * 2B) Initialize Thread IDs for Each Bot
 ************************************************************/
async function initCarouselThread(botData) {
    // Attempt to get a thread_id from /start
    try {
        const response = await fetch(botData.startUrl);
        if (!response.ok) {
            console.error(`Error fetching /start for ${botData.startUrl}:`, response.statusText);
            return null;
        }
        const data = await response.json();
        botData.threadId = data.thread_id;
        console.log(`${botData.startUrl} => Thread ID:`, botData.threadId);
    } catch (err) {
        console.error(`Could not initialize thread for ${botData.startUrl}:`, err);
        botData.threadId = null;
    }
}

// Initialize all carousel bot threads
async function initAllCarouselThreads() {
    for (const botData of containerData) {
        await initCarouselThread(botData);
    }
}

/************************************************************
 * 2C) Bot Initialization & UI
 ************************************************************/
// For each bot, we show a welcome + question bubbles
containerData.forEach((botData) => {
    initCarouselBot(botData);
});

// Also do thread creation on page load so they have an ID ready
window.addEventListener('load', async () => {
    // Initialize each bot's thread
    await initAllCarouselThreads();
});

/**
 * Initialize each carousel bot UI:
 * - Adds a welcome banner
 * - Delays then greets user
 * - Adds quick question bubbles
 */
function initCarouselBot(botData) {
    // 1) Add a custom welcome banner at the top
    addWelcomeBannerToCarousel(botData.messagesEl);

    // 2) Short delay, then greet user + show question bubbles
    setTimeout(() => {
        appendCarouselBotTypedMessage(botData.messagesEl,
            "👋 Hello, I'm your AI assistant! How can I help you today?"
        ).then(() => {
            appendWrappedQuestionsBubbleToCarousel(
                botData.messagesEl,
                botData.inputEl,
                botData.sendBtn,
                botData.quickQuestions
            );
        });
    }, 1000);
}

/**
 * Add a "welcome banner" (like Busibot) to each carousel chat
 */
function addWelcomeBannerToCarousel(messagesEl) {
    const welcomeDiv = document.createElement('div');
    welcomeDiv.classList.add('busibot-welcome-banner');
    welcomeDiv.innerHTML = `
        <img src="css/logo/FullLogo_Transparent.png" alt="Busibot Logo" class="busibot-welcome-logo" />
        <h3>Your AI Agent</h3>
        <p>Hi, how can I help you today?</p>
    `;
    messagesEl.appendChild(welcomeDiv);
}

/**
 * Creates a single row of question bubbles from the array
 */
function appendWrappedQuestionsBubbleToCarousel(messagesEl, inputEl, sendBtn, items) {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('message-row', 'user', 'multi-question-row');

    items.forEach(item => {
        const bubbleDiv = document.createElement('div');
        bubbleDiv.classList.add('bubble', 'question-bubble');
        bubbleDiv.textContent = item.label;

        bubbleDiv.addEventListener('click', () => {
            inputEl.value = item.label;
            sendBtn.click();
            rowDiv.remove();
        });

        rowDiv.appendChild(bubbleDiv);
    });

    messagesEl.appendChild(rowDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

/**
 * Show "typing..." indicator, then type out the bot's text (with an avatar)
 */
async function appendCarouselBotTypedMessage(messagesEl, fullText) {
    // 1) Show typing indicator (includes an avatar)
    const typingIndicator = document.createElement('div');
    typingIndicator.classList.add('message-row', 'bot', 'typing-indicator');
    typingIndicator.innerHTML = `
        <img class="avatar bot" src="./css/images/bot.png" alt="Bot Avatar" />
        <div class="bubble typing-bubble">
            <span class="dots"></span>
            <span class="dots"></span>
            <span class="dots"></span>
        </div>
    `;
    messagesEl.appendChild(typingIndicator);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // 2) small delay to simulate "thinking"
    await new Promise(resolve => setTimeout(resolve, 800));

    // 3) remove typing indicator
    typingIndicator.remove();

    // 4) type out the text
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("message-row", "bot");

    const bubbleDiv = document.createElement("div");
    bubbleDiv.classList.add("bubble");

    rowDiv.appendChild(bubbleDiv);
    messagesEl.appendChild(rowDiv);

    let index = 0;
    const timer = setInterval(() => {
        bubbleDiv.textContent = fullText.slice(0, index + 1);
        index++;
        messagesEl.scrollTop = messagesEl.scrollHeight;

        if (index >= fullText.length) {
            clearInterval(timer);
            // (Optional) add a timestamp
            const timestampDiv = document.createElement('div');
            timestampDiv.classList.add('timestamp');
            timestampDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            bubbleDiv.appendChild(timestampDiv);
        }
    }, 30);
}

/**
 * Send message to a specific carousel bot
 */
async function sendMessage(botIdx) {
    const botData = containerData[botIdx];
    const { inputEl, messagesEl, endpoint, threadId } = botData;

    if (inputEl.disabled) return;
    const text = inputEl.value.trim();
    if (!text) return;

    // Append user's message instantly
    appendCarouselMessage(messagesEl, "user", text);
    inputEl.value = "";

    // If no threadId, attempt to re-initialize
    if (!threadId) {
        console.warn("No thread ID found for this bot. Attempting to initialize...");
        await initCarouselThread(botData);
    }

    try {
        const payload = {
            userId,
            message: text,
            thread_id: botData.threadId || null
        };

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            await appendCarouselBotTypedMessage(messagesEl, "Error communicating with server.");
            return;
        }

        const data = await res.json();
        console.log(data);

        // If your server uses data.response for the AI text:
        const botReply = data.response || "No reply received.";

        // type out the final text with a typing indicator
        await appendCarouselBotTypedMessage(messagesEl, botReply);

    } catch (err) {
        await appendCarouselBotTypedMessage(messagesEl, "Error connecting to server.");
    }
}

/**
 * Appends user messages instantly
 * (For bot messages, we do typed approach above)
 */
function appendCarouselMessage(msgContainer, sender, text) {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('message-row', sender);

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble');
    bubbleDiv.textContent = text;

    rowDiv.appendChild(bubbleDiv);
    msgContainer.appendChild(rowDiv);
    msgContainer.scrollTop = msgContainer.scrollHeight;
}

/**
 * [Event listeners] - make sure "Send" triggers sendMessage
 */
containerData.forEach((botData, idx) => {
    const { sendBtn, inputEl } = botData;

    // On Send button click
    sendBtn.addEventListener('click', () => sendMessage(idx));

    // On Enter key in the input
    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage(idx);
        }
    });
});

/************************************************************
 * 3) Floating Bottom-Right Chat (Main Busibot.ai endpoint)
 ************************************************************/
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

function toggleBusibotChat() {
    chatOpen = !chatOpen;
    if (chatOpen) {
        chatWidget.style.display = 'flex';
        chatTab.style.display = 'none';
        notificationBadge.style.display = 'none';
        notificationBadge.textContent = '';
    } else {
        chatWidget.style.display = 'none';
        chatTab.style.display = 'block';
    }
}

function minimizeBusibotChat() {
    chatOpen = false;
    chatWidget.style.display = 'none';
    chatTab.style.display = 'flex';
    notificationBadge.style.display = 'none';
    notificationBadge.textContent = '';
}

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
    if (!text) return;

    appendMessage('user', text);
    textarea.value = '';

    if (!busibotThreadId) {
        busibotThreadId = await initBusibotThread();
        if (!busibotThreadId) {
            appendMessage('bot', 'Error initializing chat session.');
            return;
        }
    }

    const typingIndicator = showTypingIndicator();

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

        typingIndicator.remove();
        await typeTextBubble(botReply);

    } catch (err) {
        console.error("Error calling /chat:", err);
        typingIndicator.remove();
        appendMessage('bot', 'Error: Unable to reach server.');
    }
}

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
    timestampDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

function autoGrow(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

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
    // If bottom-right Busibot doesn't have a thread yet, initialize it:
    if (!busibotThreadId) {
        await initBusibotThread();
    }

    addWelcomeBanner();

    setTimeout(() => {
        appendMessage('bot', "👋 I'm here to assist if you need me!");
        // Busibot (bottom-right) still uses these same 5 questions:
        appendWrappedQuestionsBubble();
    }, 2000);
});

const contactModal = document.getElementById('contact-modal');
const openFormButtons = document.querySelectorAll('.open-form');
const closeFormButton = document.querySelector('.close-btn');

// Open the modal
openFormButtons.forEach(button => {
    button.addEventListener('click', () => {
        contactModal.style.display = 'block';
    });
});

// Close modal
closeFormButton.addEventListener('click', () => {
    contactModal.style.display = 'none';
});
window.addEventListener('click', (event) => {
    if (event.target === contactModal) {
        contactModal.style.display = 'none';
    }
});

function formatBotReply(text) {
    const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const html = marked.parse(escaped);
    return html;
}

function addWelcomeBanner() {
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
 * The Busibot (bottom-right) STILL uses these 5 quick questions,
 * which remain unchanged.
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
