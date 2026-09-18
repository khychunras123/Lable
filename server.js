const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Telegram Alert API endpoint
app.post('/api/telegram-alert', async (req, res) => {
    try {
        const { text, chatId } = req.body;
        const token = process.env.TELEGRAM_BOT_TOKEN || '8694331932:AAEif5VMmmF2ohUprtQxEeQHMPT1kvBGJ6M';
        const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID || '-5139897271';

        if (!text) {
            return res.status(400).json({ error: 'Message text is required' });
        }

        const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: targetChatId,
                text: text,
                parse_mode: 'HTML'
            })
        });

        const data = await telegramRes.json();
        return res.json(data);
    } catch (err) {
        console.error('Telegram API Error:', err);
        return res.status(500).json({ error: err.message });
    }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`👉 Open http://localhost:${PORT}`);
});
