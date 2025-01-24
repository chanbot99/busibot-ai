/************************************************************
 * 0) Global Variables & DOM Elements
 ************************************************************/
let chatOpen = false; // Tracks if bottom-right chat is open

// DOM references for the bottom-right chat
const chatTab = document.getElementById('busibot-chat-tab');
const chatWidget = document.getElementById('busibot-chat-widget');
const chatMessages = document.getElementById('busibot-messages');
const notificationBadge = document.getElementById('busibot-notification-badge');
const userInput = document.getElementById('busibot-input');

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

// Basic userId for these 4 demos
let userId = "user-" + Math.floor(Math.random() * 100000);

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

    // Optionally, you could add a timestamp or avatars for the carousel bots
    msgContainer.appendChild(rowDiv);
    rowDiv.appendChild(bubbleDiv);
    msgContainer.scrollTop = msgContainer.scrollHeight;
}


/************************************************************
 * 3) Floating Bottom-Right Chat (Main Busibot.ai endpoint)
 ************************************************************/

/**
 * This is the remote endpoint for the official Busibot chat
 *  - DO NOT remove if you want to call this server
 */
const chatApiUrl = "https://busibot-monorepo.onrender.com/chat";

// A unique user ID for the bottom-right chat
const busibotUserId = localStorage.getItem('busibotUserId') || 'busibot-' + Date.now();
localStorage.setItem('busibotUserId', busibotUserId);

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
    // If user clicks the minimize button, just close it for now
    chatOpen = false;

    // Hide the chat widget
    const chatWidget = document.getElementById('busibot-chat-widget');
    chatWidget.style.display = 'none';

    // Re-show the "Let's Talk!" tab
    const chatTab = document.getElementById('busibot-chat-tab');
    chatTab.style.display = 'block';

    // Clear any notification badge
    const badge = document.getElementById('busibot-notification-badge');
    badge.style.display = 'none';
    badge.textContent = '';
}


/**
 * Send user message to the main Busibot.ai endpoint
 */
async function sendBusibotMessage() {
    // Access the textarea by ID
    const textarea = document.getElementById('busibot-textarea');
    const text = textarea.value.trim();
    if (!text) return; // ignore if empty

    // Insert user message in chat
    appendMessage('user', text);

    // Clear the textarea
    textarea.value = '';
    textarea.style.height = '30px'; // reset to default height

    // Now build the payload for your server
    const payload = {
        userId: busibotUserId, // or a unique ID for the user
        message: text
    };

    try {
        const response = await fetch(chatApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            appendMessage('bot', 'Error connecting to server.');
            return;
        }
        const data = await response.json();
        const botReply = data.botReply || 'No reply from server.';
        appendMessage('bot', botReply);

    } catch (err) {
        appendMessage('bot', 'Error: Unable to reach server.');
    }
}

/**
 * Appends messages in the bottom-right Busibot widget
 */
function appendMessage(sender, text) {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('message-row', sender);

    // Avatar
    const avatarImg = document.createElement('img');
    avatarImg.classList.add('avatar', sender);
    avatarImg.src = (sender === 'bot')
        ? './css/images/bot.png'
        : './css/images/user.png';

    // Bubble
    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble');
    bubbleDiv.textContent = text;

    // Timestamp (HH:MM only)
    const timestampDiv = document.createElement('div');
    timestampDiv.classList.add('timestamp');
    const now = new Date();
    timestampDiv.textContent = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    bubbleDiv.appendChild(timestampDiv);

    // Assemble
    rowDiv.appendChild(avatarImg);
    rowDiv.appendChild(bubbleDiv);
    chatMessages.appendChild(rowDiv);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    // If chat is closed and it's a bot message, show the badge
    if (!chatOpen && sender === 'bot') {
        playNotificationSound();
        notificationBadge.style.display = 'flex';
        notificationBadge.textContent = '1';
    }
}

function autoGrow(textarea) {
    // Reset height to auto so we can read the scrollHeight again
    textarea.style.height = 'auto';
    // Set the height to the scrollHeight, plus a little extra if desired
    textarea.style.height = textarea.scrollHeight + 'px';
}

/**
 * If user presses Enter without Shift or Ctrl, we'll send the message
 */
function checkEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
        event.preventDefault(); // prevent new line
        sendBusibotMessage();   // call your send function
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
    // Greet user in the bottom-right chat after 2 seconds
    setTimeout(() => {
        appendMessage('bot', "I'm here to assist if you need me!");
    }, 2000);
});
