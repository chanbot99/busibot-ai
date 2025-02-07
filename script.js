/************************************************************
 * 0) Global Variables & DOM Elements
 ************************************************************/
localStorage.removeItem('busibotThreadId');
// ===========================
//  Change this to your server
// ===========================
const BOT_SERVER_URL = "https://busibot-monorepo.onrender.com";

// We'll no longer track a thread ID
let userId = "user-" + Math.floor(Math.random() * 100000);

// ADDED: We'll create a new session ID each page load
let sessionId = null;

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
const containerData = [
    {
        containerEl: document.getElementById('chat-realestate'),
        inputEl: document.getElementById('input-realestate'),
        sendBtn: document.getElementById('send-realestate'),
        messagesEl: document.getElementById('messages-realestate'),
        endpoint: "https://busibot-demo-real-estate.onrender.com/chat",
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
        quickQuestions: [
            { label: "This Week's Specials", type: "question" },
            { label: "Hours of Operation", type: "question" },
            { label: "Current Inventory", type: "question" },
            { label: "Custom Order", type: "question" }
        ]
    },
    {
        containerEl: document.getElementById('chat-boutique'),
        inputEl: document.getElementById('input-boutique'),
        sendBtn: document.getElementById('send-boutique'),
        messagesEl: document.getElementById('messages-boutique'),
        endpoint: "https://busibot-demo-boutique.onrender.com/chat",
        quickQuestions: [
            { label: "Can I order Online", type: "question" },
            { label: "Hours of Operation", type: "question" },
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
        quickQuestions: [
            { label: "Schedule Repair", type: "question" },
            { label: "Electrical Upgrades", type: "question" },
            { label: "Pricing & Quotes", type: "question" },
            { label: "Emergency Services", type: "question" }
        ]
    }
];

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

    for (let i = 0; i < len; i++) {
        if (i !== leftIndex && i !== centerIndex && i !== rightIndex) {
            containerData[i].containerEl.classList.add('hidden');
        }
    }

    containerData[centerIndex].inputEl.disabled = false;
    containerData[centerIndex].sendBtn.disabled = false;
    containerData[centerIndex].inputEl.placeholder = "Type a message...";
}
updateCarousel();

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
 * 2B) We remove the /start thread logic entirely
 ************************************************************/

/************************************************************
 * 2C) Bot Initialization & UI
 ************************************************************/
containerData.forEach((botData) => {
    initCarouselBot(botData);
});

function initCarouselBot(botData) {
    addWelcomeBannerToCarousel(botData.messagesEl);
    setTimeout(() => {
        appendCarouselBotTypedMessage(
            botData.messagesEl,
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

async function appendCarouselBotTypedMessage(messagesEl, fullText) {
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

    await new Promise(resolve => setTimeout(resolve, 800));
    typingIndicator.remove();

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
    const { inputEl, messagesEl, endpoint } = botData;

    if (inputEl.disabled) return;
    const text = inputEl.value.trim();
    if (!text) return;

    appendCarouselMessage(messagesEl, "user", text);
    inputEl.value = "";

    try {
        console.log("Sending request with sessionId:", sessionId); // Debugging
        const payload = { userId, message: text };
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-session-id': sessionId // Ensure this matches the backend's expected header
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            await appendCarouselBotTypedMessage(messagesEl, "Error communicating with server.");
            return;
        }

        const data = await res.json();
        console.log(data);

        const botReply = data.content || "No reply received.";
        await appendCarouselBotTypedMessage(messagesEl, botReply);

    } catch (err) {
        console.error("Error connecting to server:", err);
        await appendCarouselBotTypedMessage(messagesEl, "Error connecting to server.");
    }
}

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

// [Event listeners] for each carousel
containerData.forEach((botData, idx) => {
    const { sendBtn, inputEl } = botData;
    sendBtn.addEventListener('click', () => sendMessage(idx));
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

    const typingIndicator = showTypingIndicator();

    try {
        // ADDED: "sessionid" in request header
        const payload = { message: text };
        const response = await fetch(`${BOT_SERVER_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'sessionid': sessionId
            },
            body: JSON.stringify(payload)
        });

        typingIndicator.remove();

        if (!response.ok) {
            appendMessage('bot', 'Error communicating with the server.');
            return;
        }

        const data = await response.json();
        const botReply = data.response || 'No reply from server.';
        await typeTextBubble(botReply);

    } catch (err) {
        typingIndicator.remove();
        console.error("Error calling /chat:", err);
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
    bubbleDiv.textContent = text;

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
window.addEventListener('load', () => {
    sessionId = Date.now() + "-" + Math.random().toString(36).substring(2);
    console.log("Session ID initialized:", sessionId); // Debugging

    addWelcomeBanner();
    setTimeout(() => {
        appendMessage('bot', "👋 I'm here to assist if you need me!");
        appendWrappedQuestionsBubble();
    }, 2000);
});

const contactModal = document.getElementById('contact-modal');
const openFormButtons = document.querySelectorAll('.open-form');
const closeFormButton = document.querySelector('.close-btn');

openFormButtons.forEach(button => {
    button.addEventListener('click', () => {
        contactModal.style.display = 'block';
    });
});

closeFormButton.addEventListener('click', () => {
    contactModal.style.display = 'none';
});
window.addEventListener('click', (event) => {
    if (event.target === contactModal) {
        contactModal.style.display = 'none';
    }
});

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
 * The Busibot (bottom-right) STILL uses these 5 quick questions
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

/************************************************************
 * 5) Typing Animation for Hero Section
 ************************************************************/
function typeText(element, text, speed, delay = 0) {
    return new Promise((resolve) => {
        setTimeout(() => {
            let i = 0;
            const interval = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, speed);
        }, delay);
    });
}

async function initTypingAnimation() {
    const titleElement = document.getElementById('typed-title');
    const subtitleElement = document.getElementById('typed-subtitle');
    const descriptionElement = document.getElementById('typed-description');

    titleElement.textContent = '';
    subtitleElement.textContent = '';
    descriptionElement.textContent = '';
    titleElement.classList.add('typed-text');
    subtitleElement.classList.add('typed-text');
    descriptionElement.classList.add('typed-text');

    await typeText(titleElement, 'Empower Your Business with AI Chatbots', 18);
    await typeText(subtitleElement, 'AI-driven solutions that scale with your business', 18, 50);
    await typeText(descriptionElement, 'Revolutionize customer engagement, reduce costs, and scale effortlessly with Busibot.', 20, 50);

    titleElement.classList.remove('typed-text');
    subtitleElement.classList.remove('typed-text');
    descriptionElement.classList.remove('typed-text');
    descriptionElement.classList.add('caret');
}

window.addEventListener('load', () => {
    initTypingAnimation();
});

// Dark Mode Toggle
const themeToggle = document.getElementById('theme-toggle');
const storedTheme = localStorage.getItem('theme');

// Set initial theme
if (storedTheme) {
    document.documentElement.setAttribute('data-theme', storedTheme);
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update toggle text
    themeToggle.querySelector('.toggle-text').textContent =
        newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
});

// Initialize toggle text
if (storedTheme === 'dark') {
    themeToggle.querySelector('.toggle-text').textContent = 'Light Mode';
}
