require('dotenv').config();
const express = require('express');
const pool = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', datenbank: 'verbunden' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'fehler', datenbank: 'nicht erreichbar' });
    }
});

const PORT = process.env.PORT 
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});