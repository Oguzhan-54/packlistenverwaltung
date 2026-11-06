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

module.exports = router;