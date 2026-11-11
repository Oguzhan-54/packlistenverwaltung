const express = require('express');
const pool = require('../db');
const { eingeloggt, admin } = require('../middleware/berechtigung');

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

//Material zur Packliste hinzufügen
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
});

//Material einsehen
router.get('/:packlisteId/material', eingeloggt, async (req, res) => {
    const packlisteId = req.params.packlisteId; 

    try {
        const [material] = await pool.query(
            'SELECT materialId, bezeichnung, mengeSoll, mengeIst, notiz FROM material WHERE packlisteId = ?',
            [packlisteId]
        );

        res.json(material);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Serverfehler' });
    }

});

//Boxen zur Packliste hinzufügen
router.post('/:packlisteId/box', eingeloggt, async (req, res) => {
    const packlisteId = req.params.packlisteId;
    const { name } = req.body;
    const fehler = { fehler: 'Eingaben unvollständig' };

    //Prüfen ob Name eingetragen wurde
    if (!name) {
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
            return res.status(409).json({ fehler: 'Boxen können nur im Status Entwurf hinzugefügt werden' });
        }

        const [zeilen] = await pool.query(
            'INSERT INTO box (packlisteId, name) VALUES (?, ?)',
            [packlisteId, name] 
        )

        res.status(201).json({ boxId: zeilen.insertId });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Serverfehler' });
    }
});

//Boxen einsehen
router.get('/:packlisteId/box', eingeloggt, async (req, res) => {
    const packlisteId = req.params.packlisteId; 

    try {
        const [box] = await pool.query(
            'SELECT boxId, name FROM box WHERE packlisteId = ?',
            [packlisteId]
        );

        res.json(box);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Serverfehler' });
    }
});

//Material zur Box hinzufügen
router.post('/:packlisteId/box/:boxId/material', eingeloggt, async (req, res) => {
    const packlisteId = req.params.packlisteId;
    const boxId = req.params.boxId;
    const { materialId, mengeGepackt } = req.body;
    const fehler = { fehler: 'Eingaben unvollständig' };

    //Eingabe prüfen
    if (!materialId || mengeGepackt < 0) {
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
            return res.status(409).json({ fehler: 'Material kann nur zur Box im Status Entwurf hinzugefügt werden' });
        }

        //Prüfen, ob die Box zur Packliste gehört
        const [boxen] = await pool.query(
            'SELECT boxId FROM box WHERE boxId = ? AND packlisteId = ?',
            [boxId, packlisteId]
        );

        if (!boxen[0]) {
            return res.status(404).json({ fehler: 'Box gehört nicht zur Packliste' });
        }

        //Prüfen, ob das Material zur Packliste gehört
        const [material] = await pool.query(
            'SELECT mengeSoll FROM material WHERE materialId = ? AND packlisteId = ?',
            [materialId, packlisteId]
        );

        //Wenn es kein Material gibt
        if (!material[0]) {
            return res.status(404).json({ fehler: 'Material gehört nicht zur Packliste' });
        }

        //Prüfen, ob MengeGepackt größer als MengeSoll ist
        const [summen] = await pool.query(
            'SELECT mengeGepackt FROM box_material WHERE materialId = ? AND boxId != ?',
            [materialId, boxId]
        );

        //Summe aus materialGepackt ausrechnen
        let summe = 0;
        for (const zeile of summen) {
            summe = summe + zeile.mengeGepackt;
        }

        //Wenn mengeGepackt > mengeSoll ist dann Fehlermeldung
        if (summe + Number(mengeGepackt) > material[0].mengeSoll) {
            return res.status(409).json({ fehler: 'Menge Gepackt kann nicht größer als Menge soll sein' });
        }

        //Material in Box hinzufügen
        const [zeilen] = await pool.query(
            'INSERT INTO box_material (boxId, materialId, mengeGepackt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE mengeGepackt = ?',
            [boxId, materialId, mengeGepackt, mengeGepackt]
        );

        res.status(201).json({ boxId, materialId, mengeGepackt })
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Serverfehler' });
    }
});

//Status der Packliste ändern
router.post('/:packlisteId/aktivieren', eingeloggt, admin, async (req, res) => {
    const packlisteId = req.params.packlisteId;

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
            return res.status(409).json({ fehler: 'Status ist nicht Entwurf' });
        }

        const[zeilen] = await pool.query(
            'UPDATE packliste SET status = ? WHERE packlisteId = ?',
            ['Aktiv', packlisteId]
        )

        res.json({ status: 'Aktiv' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Serverfehler' });
    }
});

module.exports = router;