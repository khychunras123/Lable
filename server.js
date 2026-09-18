const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial sample data if no data file exists
const defaultOrders = [
    {
        id: "F38BA5",
        customerName: "Seng Leang",
        phone: "085467475(Cellcard)",
        location: "សៀមរាប",
        address: "សៀមរាប ចុងកៅស៊ូ",
        products: "ATTACK SHARK L50 PRO | Black x1 = $52.00",
        itemsList: [{ name: "ATTACK SHARK L50 PRO (Black)", qty: 1, price: 52.00 }],
        itemPrice: 52.00,
        deliveryFee: 0.00,
        totalAmount: 52.00,
        paymentStatus: "PAID",
        paymentMethod: "Paid (ABA Bank (ACC Store) ($))",
        shipper: "វីរៈប៊ុនថាំ (VET)",
        date: "18/09/2026",
        time: "18:37",
        pageName: "INO Tech Studio",
        sellerStaff: "Chunras",
        notes: "ប្រញាប់ដឹកមុនម៉ោង 5 ល្ងាច",
        qrData: "ACC-F38BA5-085467475-52USD"
    },
    {
        id: "A89C12",
        customerName: "Keo Pich",
        phone: "012889977(Smart)",
        location: "ភ្នំពេញ",
        address: "ផ្ទះលេខ 23 ផ្លូវ 271 សង្កាត់ទឹកល្អក់3 ខណ្ឌទួលគោក",
        products: "Logitech G Pro X Superlight 2 | White x1 = $145.00",
        itemsList: [{ name: "Logitech G Pro X Superlight 2 (White)", qty: 1, price: 145.00 }],
        itemPrice: 145.00,
        deliveryFee: 1.50,
        totalAmount: 146.50,
        paymentStatus: "COD",
        paymentMethod: "COD (ប្រមូលប្រាក់ពេលដឹកជញ្ជូន)",
        shipper: "J&T Express",
        date: "18/09/2026",
        time: "14:20",
        pageName: "INO Tech Studio",
        sellerStaff: "Chunras",
        notes: "ទូរស័ព្ទមុនពេលទៅដល់",
        qrData: "ACC-A89C12-012889977-146.5USD"
    }
];

if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(defaultOrders, null, 2), 'utf-8');
}

// Helper functions for reading/writing JSON
function readJsonFile(filePath, fallback = []) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error(`Error reading ${filePath}:`, e);
    }
    return fallback;
}

function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.error(`Error writing ${filePath}:`, e);
        return false;
    }
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// API: Get all orders
app.get('/api/orders', (req, res) => {
    const orders = readJsonFile(ORDERS_FILE, defaultOrders);
    res.json(orders);
});

// API: Save / Replace all orders
app.post('/api/orders', (req, res) => {
    const orders = req.body;
    if (Array.isArray(orders)) {
        writeJsonFile(ORDERS_FILE, orders);
        return res.json({ success: true, count: orders.length });
    }
    return res.status(400).json({ error: 'Orders must be an array' });
});

// API: Get settings
app.get('/api/settings', (req, res) => {
    const settings = readJsonFile(SETTINGS_FILE, null);
    res.json(settings);
});

// API: Save settings
app.post('/api/settings', (req, res) => {
    const settings = req.body;
    if (settings && typeof settings === 'object') {
        writeJsonFile(SETTINGS_FILE, settings);
        return res.json({ success: true });
    }
    return res.status(400).json({ error: 'Invalid settings object' });
});

// API: Sync orders live from Telegram Bot getUpdates
app.get('/api/telegram-sync', async (req, res) => {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN || '8694331932:AAEif5VMmmF2ohUprtQxEeQHMPT1kvBGJ6M';
        const telegramRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
        const data = await telegramRes.json();
        return res.json(data);
    } catch (err) {
        console.error('Telegram Sync Error:', err);
        return res.status(500).json({ error: err.message });
    }
});

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
