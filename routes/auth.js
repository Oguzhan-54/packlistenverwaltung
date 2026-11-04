const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

//Login
router.post('login', async (req, res) => {
    const { email, passwort } = req.body;
    const fehler = { fehler: 'E-Mail oder Passwort falsch' };

    if (!email || !passwort) {
        return res.status(401).json(fehler);
    }

    try {
        const [zeilen] = await pool.query(
            'SELECT benutzerId, vorname, nachname, passwortHash, rolle FROM benutzer WHERE email = ?',
            [email]
        );
        const benutzer = zeilen[0];
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