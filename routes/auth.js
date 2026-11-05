const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

//Login
router.post('/login', async (req, res) => {
    const { email, passwort } = req.body;
    const fehler = { fehler: 'E-Mail oder Passwort falsch' };

    //Prüfung auf leere Felder
    if (!email || !passwort) {
        return res.status(401).json(fehler);
    }

    //Datenbankabfrage
    try {
        const [zeilen] = await pool.query(
            'SELECT benutzerId, vorname, nachname, passwortHash, rolle FROM benutzer WHERE email = ?',
            [email]
        );
        const benutzer = zeilen[0];
        
        //Passwort prüfen
        const passwortRichtig = benutzer && await bcrypt.compare(passwort, benutzer.passwortHash);
        if (!passwortRichtig) {
            return res.status(401).json(fehler);
        }

        req.session.benutzer = {
            id: benutzer.benutzerId,
            vorname: benutzer.vorname,
            nachname: benutzer.nachname,
            rolle: benutzer.rolle
        };

        res.json(req.session.benutzer);
    } 
    catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Serverfehler' });
    }
});

//Logout
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ status: 'ok' });
    });
});

//Check
router.get('/me', (req, res) => {
    if (!req.session.benutzer) {
        return res.status(401).json({ fehler: 'Nicht eingeloggt' });
    }
    res.json(req.session.benutzer);
});

module.exports = router;