/***************************************************************
 * Particles init
 ***************************************************************/
particlesJS("particles-js", {
    "particles": {
        "number": {
            "value": 150,
            "density": { "enable": true, "value_area": 800 }
        },
        "color": { "value": "#07b080" },
        "shape": { "type": "circle" },
        "size": { "value": 3, "random": true },
        "line_linked": {
            "enable": true,
            "distance": 150,
            "color": "#049169",
            "opacity": 0.4,
            "width": 1
        },
        "move": { "enable": true, "speed": 2 }
    },
    "retina_detect": true
});


/***************************************************************
 * 1. Container data for 4 bots
 ***************************************************************/
const containerData = [
    {
        containerEl: document.getElementById('chat-bakery'),
        inputEl: document.getElementById('input-bakery'),
        sendBtn: document.getElementById('send-bakery'),
        messagesEl: document.getElementById('messages-bakery'),
        endpoint: "https://demo-bakery-bot.onrender.com/chat"
    },
    {
        containerEl: document.getElementById('chat-boutique'),
        inputEl: document.getElementById('input-boutique'),
        sendBtn: document.getElementById('send-boutique'),
        messagesEl: document.getElementById('messages-boutique'),
        endpoint: "https://demo-boutique-bot.onrender.com/chat"
    },
    {
        containerEl: document.getElementById('chat-electrical'),
        inputEl: document.getElementById('input-electrical'),
        sendBtn: document.getElementById('send-electrical'),
        messagesEl: document.getElementById('messages-electrical'),
        endpoint: "https://demo-electrical-bot.onrender.com/chat"
    },
    {
        containerEl: document.getElementById('chat-realestate'),
        inputEl: document.getElementById('input-realestate'),
        sendBtn: document.getElementById('send-realestate'),
        messagesEl: document.getElementById('messages-realestate'),
        endpoint: "https://demo-realestate-bot.onrender.com/chat"
    }
];

// Let's start with index=0 as center, or whichever you want:
let activeIndex = 0;

/***************************************************************
 * 2. updateCarousel => physically position containers
 ***************************************************************/
function updateCarousel() {
    // Clear all classes + disable
    containerData.forEach(d => {
        d.containerEl.classList.remove('left','center','right','hidden');
        d.inputEl.disabled = true;
        d.inputEl.placeholder = "(Inactive)";
        d.sendBtn.disabled = true;
    });

    const len = containerData.length;

    // left, center, right
    const leftIndex = (activeIndex - 1 + len) % len;
    const centerIndex = activeIndex;
    const rightIndex = (activeIndex + 1) % len;

    // Mark them
    containerData[leftIndex].containerEl.classList.add('left');
    containerData[centerIndex].containerEl.classList.add('center');
    containerData[rightIndex].containerEl.classList.add('right');

    // The leftover is hidden
    for (let i = 0; i < len; i++) {
        if (i !== leftIndex && i !== centerIndex && i !== rightIndex) {
            containerData[i].containerEl.classList.add('hidden');
        }
    }

    // Enable the center input + button
    containerData[centerIndex].inputEl.disabled = false;
    containerData[centerIndex].sendBtn.disabled = false;
    containerData[centerIndex].inputEl.placeholder = "Type a message...";
}

updateCarousel();

/***************************************************************
 * 3. Arrows
 ***************************************************************/
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

/***************************************************************
 * 4. Send logic for each container
 ***************************************************************/
let userId = "user-" + Math.floor(Math.random() * 100000);

containerData.forEach((botData, idx) => {
    const { sendBtn, inputEl } = botData;
    sendBtn.addEventListener('click', () => sendMessage(idx));
    inputEl.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendMessage(idx);
    });
});

async function sendMessage(botIdx) {
    const { inputEl, messagesEl, endpoint } = containerData[botIdx];
    if (inputEl.disabled) return;

    const text = inputEl.value.trim();
    if (!text) return;

    appendMessage(messagesEl, "user", text);
    inputEl.value = "";

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, message: text })
        });
        if (!res.ok) {
            appendMessage(messagesEl, "bot", "Error communicating with server.");
            return;
        }
        const data = await res.json();
        appendMessage(messagesEl, "bot", data.botReply || "No reply received.");
    } catch (err) {
        appendMessage(messagesEl, "bot", "Error connecting to server.");
    }
}

function appendMessage(msgContainer, sender, text) {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('message-row');

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.textContent = text;

    if (sender === 'bot') {
        msgDiv.classList.add('bot-message');
    } else {
        msgDiv.classList.add('user-message');
    }

    rowDiv.appendChild(msgDiv);
    msgContainer.appendChild(rowDiv);
    msgContainer.scrollTop = msgContainer.scrollHeight;
}
