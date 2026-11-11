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
        
        //Packliste anlegen
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

router.post('/:packlisteId/material', eingeloggt, async (req, res) => {
    const packlisteId = req.params.packlisteId; 
    const { bezeichnung, mengeSoll } = req.body;
    const fehler = { fehler: 'Eingaben unvollständig' };

    //Eingabe prüfen
    if (!bezeichnung || !mengeSoll || mengeSoll < 1) {
        return res.status(400).json(fehler);
    }

    try {
        //Status der Packliste prüfen
        const [packlisten] = await pool.query(
            'SELECT status FROM packliste WHERE packlisteId = ?',
            [packlisteId]
        );

        //Prüfen ob Packliste vorhanden ist
        if (!packlisten[0]) {
            return res.status(404).json({ fehler: 'Packliste nicht gefunden' });
        }

        //Prüfen ob der Status auf Entwurf ist
        if (packlisten[0].status != 'Entwurf') {
            return res.status(409).json({ fehler: 'Material kann nur im Status Entwurf hinzugefügt werden' });
        }

        //Material anlegen
        const [zeilen] = await pool.query(
            'INSERT INTO material (packlisteId, bezeichnung, mengeSoll) VALUES (?, ?, ?)',
            [packlisteId, bezeichnung, mengeSoll]
        );

        res.status(201).json({ materialId: zeilen.insertId })
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Serverfehler' });
    }
})

module.exports = router;