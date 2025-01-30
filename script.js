/************************************************************
 * 0) Global Variables & DOM Elements
 ************************************************************/

// ===========================
//  Change this to your server
// ===========================
const BOT_SERVER_URL = "https://busibot-monorepo.onrender.com"; // e.g. "http://localhost:8080" or "https://mydomain.com"

// We'll store our thread ID for the bottom-right Busibot chat
let busibotThreadId = localStorage.getItem('busibotThreadId') || null;

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
//let realEstateQuestionsShown = false;

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
        // Optionally store it so we keep the same thread across refreshes
        localStorage.setItem('busibotThreadId', busibotThreadId);
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
    // If user clicks the minimize button, just close it for now
    chatOpen = false;

    // Hide the chat widget
    const chatWidget = document.getElementById('busibot-chat-widget');
    chatWidget.style.display = 'none';

    // Re-show the "Let's Talk!" tab
    const chatTab = document.getElementById('busibot-chat-tab');
    chatTab.style.display = 'flex';

    // Clear any notification badge
    const badge = document.getElementById('busibot-notification-badge');
    badge.style.display = 'none';
    badge.textContent = '';
}

/**
 * Send user message to the main Busibot.ai endpoint
 * but now referencing /start (once) and /chat with our thread_id.
 */
// 1) Reusable function to show "typing..." indicator
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

    // Then append
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return typingDiv;
}

// 2) Reusable function to reveal text character-by-character
function typeTextBubble(fullText) {
    return new Promise((resolve) => {
        // Create a new message row for the bot
        const rowDiv = document.createElement("div");
        rowDiv.classList.add("message-row", "bot");

        // Bot avatar
        const avatarImg = document.createElement("img");
        avatarImg.classList.add("avatar", "bot");
        avatarImg.src = "./css/images/bot.png";

        // Bubble that will fill text gradually
        const bubbleDiv = document.createElement("div");
        bubbleDiv.classList.add("bubble");

        // Assemble
        rowDiv.appendChild(avatarImg);
        rowDiv.appendChild(bubbleDiv);
        chatMessages.appendChild(rowDiv);

        let index = 0;
        // Reveal text in intervals (e.g. 30ms per char)
        const timer = setInterval(() => {
            bubbleDiv.textContent = fullText.slice(0, index + 1);
            index++;
            chatMessages.scrollTop = chatMessages.scrollHeight;

            if (index >= fullText.length) {
                clearInterval(timer);
                resolve(); // done typing
            }
        }, 30);
    });
}

async function sendBusibotMessage() {
    const textarea = document.getElementById('busibot-textarea');
    const text = textarea.value.trim();
    if (!text) return; // ignore if empty

    // 1) Insert user message in chat
    appendMessage('user', text);

    // 2) Clear the textarea
    textarea.value = '';

    // 3) Ensure we have a valid thread ID
    if (!busibotThreadId) {
        busibotThreadId = await initBusibotThread();
        if (!busibotThreadId) {
            appendMessage('bot', 'Error initializing chat session.');
            return;
        }
    }

    // 4) Show "Bot is typing..." indicator
    const typingIndicator = showTypingIndicator();

    // 5) Build payload and fetch server response
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

        // 6) Remove the typing indicator now that we have a final response
        typingIndicator.remove();

        // 7) Type out the bot's message instead of appending instantly
        await typeTextBubble(botReply);

    } catch (err) {
        console.error("Error calling /chat:", err);
        typingIndicator.remove();
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

    // If it's the bot, let's format the reply with <br> tags
    if (sender === 'bot') {
        bubbleDiv.innerHTML = formatBotReply(text);
    } else {
        // For user messages, we can just do plain text
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

/**
 * Automatically grow textarea on input
 */
function autoGrow(textarea) {
    textarea.style.height = 'auto';
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
window.addEventListener('load', async () => {
    // Attempt to restore a thread ID
    if (!busibotThreadId) {
        await initBusibotThread();
    }

    // Insert the banner *before* the first message
    addWelcomeBanner();

    // Delay a small greeting
    setTimeout(() => {
        appendMessage('bot', "I'm here to assist if you need me!");
        // Show default questions for Real Estate bot (index 0 in containerData)
        appendClickableQuestions(0, [
            "What are the average home prices in my area?",
            "Are there any open houses near me this weekend?",
            "What’s my home’s estimated value?"
        ]);
    }, 2000);
});

/**
 * Appends a "user-like" message row with multiple clickable questions.
 * @param {number} botIdx - The index in containerData for the Real Estate bot (likely 0).
 * @param {string[]} questions - Array of default question strings.
 */
function appendClickableQuestions(botIdx, questions) {
    const { messagesEl, inputEl } = containerData[botIdx];

    // Create a new row
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('message-row', 'user'); // styled as "user" for now

    // Bubble container
    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble', 'default-question-bubble');

    // For each default question, create a clickable button
    questions.forEach(questionText => {
        const btn = document.createElement('button');
        btn.classList.add('default-question-btn');
        btn.textContent = questionText;

        // When clicked, auto-fill input and send
        btn.addEventListener('click', () => {
            inputEl.value = questionText;
            sendMessage(botIdx);
            // Optional: remove these quick-questions
            rowDiv.remove();
        });
        bubbleDiv.appendChild(btn);
    });

    rowDiv.appendChild(bubbleDiv);
    messagesEl.appendChild(rowDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}


/************************************************************
 * 5) Contact Form Modal for Pricing Section
 ************************************************************/

// DOM Elements for the Contact Form
const contactModal = document.getElementById('contact-modal');
const openFormButtons = document.querySelectorAll('.open-form');
const closeFormButton = document.querySelector('.close-btn');
const contactForm = document.getElementById('contact-form');

// Open the modal when any "Get Started" button is clicked
openFormButtons.forEach(button => {
    button.addEventListener('click', () => {
        contactModal.style.display = 'block';
    });
});

// Close the modal when the close button is clicked
closeFormButton.addEventListener('click', () => {
    contactModal.style.display = 'none';
});

// Close the modal when clicking outside the modal content
window.addEventListener('click', (event) => {
    if (event.target === contactModal) {
        contactModal.style.display = 'none';
    }
});

// Handle form submission
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Gather form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        website: document.getElementById('website').value,
        budget: document.getElementById('budget').value,
        message: document.getElementById('message').value,
    };

    // Basic validation
    if (!formData.name || !formData.email || !formData.phone || !formData.budget || !formData.message) {
        alert('Please fill out all required fields.');
        return;
    }

    // Simulate form submission (replace with actual API call)
    try {
        console.log('Form Data Submitted:', formData);
        alert('Thank you for your inquiry! We will contact you shortly.');
        contactModal.style.display = 'none';
        contactForm.reset();
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('There was an error submitting your form. Please try again.');
    }
});

// For the close button inside the modal
document.querySelector('.close-btn').addEventListener('click', function() {
    document.getElementById('contact-modal').style.display = 'none';
});

/**
 * Safely convert a plain text string into HTML with <br> for line breaks.
 * Minimal approach—only handles newlines.
 * If you use user-generated content, sanitize properly.
 */
function formatBotReply(text) {
    // Minimal HTML escape for safety
    const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Convert to HTML using a markdown library
    const html = marked.parse(escaped);
    return html;
}

function addWelcomeBanner() {
    const chatMessages = document.getElementById('busibot-messages');

    // Create a container for the logo and text
    const welcomeDiv = document.createElement('div');
    welcomeDiv.classList.add('busibot-welcome-banner');

    // Use innerHTML or create elements individually
    welcomeDiv.innerHTML = `
    <img src="css/logo/FullLogo_Transparent.png" alt="Busibot Logo" class="busibot-welcome-logo" />
    <h3>Your AI Agent</h3>
    <p>Hi, how can I help you today?</p>
  `;

    // Append to the messages container
    chatMessages.appendChild(welcomeDiv);
}

