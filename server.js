const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve files from webapp folder

// Initialize DB if not exists
const initDb = () => {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            orders: [],
            ingredients: [],
            users: [
                { username: 'admin', password: '123', role: 'admin', name: 'Admin ผู้ดูแลระบบ' },
                { username: 'owner', password: '123', role: 'owner', name: 'เจ้าของร้าน 1' },
                { username: 'staff1', password: '123', role: 'staff', name: 'พนักงาน 1' }
            ],
            settings: {}
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    }
};

initDb();

const readDb = () => {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
};

const writeDb = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// ================= API ENDPOINTS =================

// Users
app.get('/api/users', (req, res) => {
    const db = readDb();
    res.json(db.users || []);
});

app.post('/api/users', (req, res) => {
    const db = readDb();
    db.users = req.body;
    writeDb(db);
    res.json({ success: true });
});

// Orders
app.get('/api/orders', (req, res) => {
    const db = readDb();
    res.json(db.orders || []);
});

app.post('/api/orders', (req, res) => {
    const db = readDb();
    db.orders = req.body;
    writeDb(db);
    res.json({ success: true });
});

// Adding single order
app.post('/api/orders/add', (req, res) => {
    console.log("📥 Received new order:", req.body.orderId);
    const db = readDb();
    if (!db.orders) db.orders = [];
    db.orders.push(req.body);
    writeDb(db);
    res.json({ success: true, orderId: req.body.orderId });
});

// Ingredients
app.get('/api/ingredients', (req, res) => {
    const db = readDb();
    res.json(db.ingredients || []);
});

app.post('/api/ingredients', (req, res) => {
    const db = readDb();
    db.ingredients = req.body;
    writeDb(db);
    res.json({ success: true });
});

// Stock-in data
app.get('/api/stockin', (req, res) => {
    const db = readDb();
    res.json(db.stockin || {});
});

app.post('/api/stockin', (req, res) => {
    const db = readDb();
    db.stockin = req.body;
    writeDb(db);
    res.json({ success: true });
});

// Stock-out (manual deductions)
app.get('/api/stockout', (req, res) => {
    const db = readDb();
    res.json(db.stockout || []);
});

app.post('/api/stockout', (req, res) => {
    const db = readDb();
    db.stockout = req.body;
    writeDb(db);
    res.json({ success: true });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================`);
    console.log(`🚀 Habeef Local Server Running!`);
    console.log(`🌐 Local Access: http://localhost:${PORT}`);
    console.log(`📱 LAN Access:   Check your IPv4 Address and add :${PORT}`);
    console.log(`======================================\n`);
});
