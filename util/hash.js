// hash.js
const bcrypt = require('bcrypt');

(async () => {
    const password = "";
    const saltRounds = 10;

    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log("Generated hash:", hash);

        // For sanity check, compare it immediately
        const match = await bcrypt.compare(password, hash);
        console.log("match =", match); // should be true
    } catch (err) {
        console.error("Error:", err);
    }
})();
