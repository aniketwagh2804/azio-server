const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
    // In this MVP, authentication is purely handled locally using hardcoded dictionaries or 
    // a secure on-device store to avoid leaving any backend traces for wrong passwords.
    // We only need backend for registering the device FCM token for push notifications and assigning the socket.

    const { username, fcm_token } = req.body;
    // Store FCM token for "disguised push notifications"
    // e.g., User Model update ...
    res.json({ success: true, message: "Registered device for notifications." });
});

module.exports = router;
