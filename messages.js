const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Polling fallback or history retrieval
router.get('/:username', async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { senderId: req.params.username },
                { receiverId: req.params.username }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// A route to clear all messages instantly on panic
router.delete('/:username/panic', async (req, res) => {
    try {
        await Message.deleteMany({
            $or: [
                { senderId: req.params.username },
                { receiverId: req.params.username }
            ]
        });
        res.json({ success: true, message: "All history erased from server." });
    } catch (err) {
        res.status(500).json({ error: "Failed to erase history" });
    }
});

module.exports = router;
