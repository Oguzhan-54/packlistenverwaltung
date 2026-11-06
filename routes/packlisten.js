const express = require('express');
const pool = require('../db');
const { eingeloggt } = require('../middleware/berechtigung');

const router = express.Router();

//Packlisten einsehen
router.get('/', eingeloggt, async (req, res) => {
    //Packliste aus Datenbank holen
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

//Packliste anlegen und in Datenbank speichern
router.post('/', eingeloggt, async (req, res) => {
    const { name, jobnummer, startDatum, endDatum } = req.body;
    const fehler = { fehler: 'Eingaben unvollständig' };
    //Prüfen, ob Eingaben vollständig sind
    if (!name || !jobnummer || !startDatum || !endDatum) {
        return res.status(400).json(fehler);
    }

    let verbindung;

    try {
        //Packliste in Datenbank speichern
        verbindung = await pool.getConnection(); //Verbindung holen
        await verbindung.beginTransaction(); //Transaction starten
        
        const [zeilen] = await verbindung.query(
            'INSERT INTO packliste (name, jobnummer, startDatum, endDatum, erstelltVon) VALUES (?, ?, ?, ?, ?)',
            [name, jobnummer, startDatum, endDatum, req.session.benutzer.id]
        );

        //Automatisch erste Box anlegen
        await verbindung.query(
            'INSERT INTO box (packlisteId, name) VALUES (?, ?)',
            [zeilen.insertId, 'Box 1'] //Name Box 1 wird eingetragen
        )

        await verbindung.commit(); //Erfolg

        res.status(201).json({ packlisteId: zeilen.insertId });
    }
    //Falls Fehler, z.B doppelte Jobnummer oder endDatum vor startDatum
    catch (err) {
        if (verbindung){
            await verbindung.rollback(); //Wenn was schief läuft, dann rollback
        }
        console.error(err);
        res.status(500).json({ fehler: 'Serverfehler' });      
    }

    finally {
        if (verbindung){
            verbindung.release(); //Verbindung zurückgeben
        }
    }
});

module.exports = router;