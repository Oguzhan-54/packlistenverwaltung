const express = require('express');
const pool = require('../db');
const { eingeloggt } = require('../middleware/berechtigung');

const router = express.Router();

router.get('/', eingeloggt, async (req, res) => {

    try {
        const [zeilen] = await pool.query(
            'SELECT packlisteId, name, jobnummer, startDatum, endDatum, status FROM packliste WHERE status IN ("Entwurf", "Aktiv")'
        );
        const packlisten = zeilen;

        res.json(packlisten);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Serverfehler' });
    }
});

router.post('/', eingeloggt, async (req, res) => {
    const { name, jobnummer, startDatum, endDatum } = req.body;
    const fehler = { fehler: 'Eingaben unvollständig' };

    if (!name || !jobnummer || !startDatum || !endDatum) {
        return res.status(400).json(fehler);
    }

    try {
        const [zeilen] = await pool.query(
            'INSERT INTO packliste (name, jobnummer, startDatum, endDatum, erstelltVon) VALUES (?, ?, ?, ?, ?)',
            [name, jobnummer, startDatum, endDatum, req.session.benutzer.id]
        );

        res.status(201).json({ packlisteId: zeilen.insertId });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Serverfehler' });      
    }
});






module.exports = router;