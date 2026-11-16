const parameter = new URLSearchParams(window.location.search); //URL durchsuchen
const packlisteId = parameter.get('id'); //id aus der URL in eine const packen

let packlisteStatus = '';
let materialListe = [];

async function packlisteLaden() {
    const antwort = await fetch('/api/packlisten/' + packlisteId); //Packliste holen
    const packliste = await antwort.json();

    packlisteStatus = packliste.status; //Status der Packliste 

    //Inahlt befüllen
    document.getElementById('packliste-name').textContent = packliste.name;
    document.getElementById('packliste-infos').textContent = 'Jobnummer ' + packliste.jobnummer + ', ' + packliste.startDatum + ' bis ' + packliste.endDatum + ', Status: ' + packliste.status;

    //Status Buttons sichtbar oder nicht sichtbar machen
    document.getElementById('material-formular').hidden = packlisteStatus != 'Entwurf';
    document.getElementById('aktivieren').hidden = packlisteStatus != 'Entwurf';
    document.getElementById('archivieren').hidden = packlisteStatus != 'Aktiv';
    //Box anlegen Formular sichtbar machen bei Status Entwurf
    document.getElementById('box-formular').hidden = packlisteStatus != 'Entwurf';
}

async function materialLaden() {
    const antwort = await fetch('/api/packlisten/' +packlisteId + '/material');
    const materialien = await antwort.json(); //JSON Text auspacken und in eine Liste ablegen
    materialListe = materialien; //Materialien in Material Liste (Array) schreiben

    const container = document.getElementById('container-material');
    container.innerHTML = '';

    //Jedes Material durchgehen und auf der Seite anzeigen
    for (const material of materialien) {
        const eintrag = document.createElement('div');
        eintrag.textContent = material.bezeichnung + ' | Soll: ' + material.mengeSoll + ' Gepackt: ' + material.mengeGepackt;
        
        //Bei aktiver Packliste die Felder für die Rückgabe anzeigen
        if (packlisteStatus == 'Aktiv') {
            const istFeld = document.createElement('input');
            istFeld.type = 'number';
            istFeld.min = 0;
            istFeld.placeholder = 'Menge Ist';
            istFeld.value = material.mengeIst; //Wenn etwas in der Datenbank steht, dann vorausfüllen. Wenn nicht dann ist das Feld leer

            const notizFeld = document.createElement('input');
            notizFeld.type = 'text';
            notizFeld.placeholder = 'Notiz';
            notizFeld.value = material.notiz;

            const speichernButton = document.createElement('button');
            speichernButton.textContent = 'Speichern';
            //Rückgabe Speichern Funktion aufrufen
            speichernButton.addEventListener('click', function () {
                rueckgabeSpeichern(material.materialId, istFeld.value, notizFeld.value);
            });

            eintrag.appendChild(istFeld);
            eintrag.appendChild(notizFeld);
            eintrag.appendChild(speichernButton);
        }

        //Material löschen
        if (packlisteStatus == 'Entwurf') { //Nur im Status Entwurf möglich
            const loeschenButton = document.createElement('button');
            loeschenButton.textContent = 'Löschen';
            loeschenButton.addEventListener('click', function () {
                materialLoeschen(material.materialId);
            });
            eintrag.appendChild(loeschenButton); //Button an den Eintrag hängen
        }
        
        container.appendChild(eintrag);
    }
}

async function boxenLaden() {
    const antwort = await fetch('/api/packlisten/' + packlisteId + '/box'); //Server nach den Boxen abfragen
    const boxen = await antwort.json();

    const container = document.getElementById('container-boxen');
    container.innerHTML = '';

    //Jede Box durchgehen
    for (const box of boxen) {
        const boxEintrag = document.createElement('div');
        
        const boxKopf = document.createElement('div');
        boxKopf.className = 'box-kopf';

        const titel = document.createElement('h3');
        titel.textContent = box.name; //Boxname eintragen
        boxKopf.appendChild(titel);

        //Löschen nur im Status Entwurf möglich
        if (packlisteStatus == 'Entwurf') {
            const loeschenButton = document.createElement('button');
            loeschenButton.textContent = 'Box löschen';
            loeschenButton.addEventListener('click', function () {
                boxLoeschen(box.boxId);
            });
            boxKopf.appendChild(loeschenButton);
        }

        boxEintrag.appendChild(boxKopf);

        //Jedes Material in dieser Box durchgehen
        for (const inhalt of box.inhalt) {
            const zeile = document.createElement('div');
            zeile.textContent = inhalt.bezeichnung + ': ' + inhalt.mengeGepackt;

            //Material aus Box entfernen nur im Status Entwurf möglich
            if (packlisteStatus == 'Entwurf') {
                const entfernenButton = document.createElement('button');
                entfernenButton.textContent = 'Entfernen';
                entfernenButton.addEventListener('click', function () {
                    inhaltEntfernen(box.boxId, inhalt.materialId);
                });
                zeile.appendChild(entfernenButton);
            }

            boxEintrag.appendChild(zeile); //Zeile in die Box einfügen
        }

        //Packen nur im Status Entwurf möglich
        if (packlisteStatus == 'Entwurf') {
            const auswahl = document.createElement('select'); //Dropdown Feld anlegen
            for (const material of materialListe) {
                const option = document.createElement('option'); //Auswahlmöglichkeit anlegen
                option.value = material.materialId;
                option.textContent = material.bezeichnung;
                auswahl.appendChild(option); //Option in das Dropdownfeld anhängen
            }

            const menge = document.createElement('input'); //Eingabefeld anlegen
            menge.type = 'number';
            menge.min = 0;
            menge.value = 1;

            const packenBtn = document.createElement('button'); //Button anlegen
            packenBtn.textContent = 'Packen';
            packenBtn.addEventListener('click', function () { //Beim Klick auf den Button wird die packen Funktion aufgerufen
                packen(box.boxId, auswahl.value, menge.value);
            });

            boxEintrag.appendChild(auswahl);
            boxEintrag.appendChild(menge);
            boxEintrag.appendChild(packenBtn);
        }

        //Fertige Box zusammenfügen und anzeigen
        container.appendChild(boxEintrag);
    }
}

async function rueckgabeSpeichern(materialId, mengeIst, notiz) {
    const fehler = document.getElementById('status-fehler');

    //Fehlermeldung anzeigen wenn MengeIst leer ist
    if (mengeIst === '') {
        fehler.textContent = 'Bitte Menge Ist eintragen'; //Fehlertext setzen
        fehler.hidden = false; //Fehlertext anzeigen
        return;
    }

    //Anfrage an das Backend senden
    const antwort = await fetch('/api/packlisten/' + packlisteId + '/material/' + materialId + '/rueckgabe', {
        method: 'PUT', //Ändern
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mengeIst, notiz })
    });

    if (antwort.ok) {
        fehler.hidden = true;
        materialLaden();
    }
    else {
        const daten = await antwort.json();
        fehler.textContent = daten.fehler;
        fehler.hidden = false;
    }
}

async function packen(boxId, materialId, mengeGepackt) {
    const fehler = document.getElementById('packen-fehler');

    //Anfrage an das Backend senden
    const antwort = await fetch('/api/packlisten/' + packlisteId + '/box/' + boxId + '/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId, mengeGepackt }) //Als JSON Objekt mitschicken
    });

    if (antwort.ok) {
        fehler.hidden = true;
        seiteLaden(); //Neu laden damit die neuen Mengen sichtbar sind
    }
    else {
        const daten = await antwort.json(); //Fehlerantwort auspacken
        fehler.textContent = daten.fehler; //Fehler vom Server rein schreiben
        fehler.hidden = false;
    }
}

//Status ändern
async function statusAendern(aktion) {
    const fehler = document.getElementById('status-fehler');

    //Anfrage an die Backend Route, aktion wird vom EventListener übergeben
    const antwort = await fetch('/api/packlisten/' + packlisteId + '/' + aktion, { method: 'POST' }); //Status beim Server ändern

    //Bei Erfolg im Server
    if (antwort.ok) {
        fehler.hidden = true;
        //Wenn auf archivieren geklickt wurde
        if (aktion === 'archivieren') {
            window.location.href = '/';
        }
        //Ansonsten wurde Status aktiviert
        else {
            seiteLaden();
        }
    }
    //Bei Fehler im Server
    else {
        const daten = await antwort.json();
        fehler.textContent = daten.fehler;
        fehler.hidden = false;
    }
} 

document.getElementById('aktivieren').addEventListener('click', function () {
    statusAendern('aktivieren'); //Aktivieren Route aufrufen
});
document.getElementById('archivieren').addEventListener('click', function () {
    statusAendern('archivieren'); // Archivieren Route aufrufen
});

const materialButton = document.getElementById('material-anlegen');
materialButton.addEventListener('click', materialAnlegen);

//Materialien anlegen
async function materialAnlegen() {
    const bezeichnung = document.getElementById('bezeichnung').value;
    const mengeSoll = document.getElementById('mengeSoll').value;
    const fehler = document.getElementById('material-fehler');

    //Wenn Eingabe fehlt oder Menge unter 1 ist
    if (!bezeichnung || !mengeSoll || mengeSoll < 1) {
        fehler.hidden = false;
        return;
    }

    //Anfrage an die Backend Route
    const antwort = await fetch('/api/packlisten/' + packlisteId + '/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bezeichnung, mengeSoll }) //Bezeichnung und Menge als JSON-Text mitschicken
    });

    //Bei Erfolg
    if (antwort.ok) {
        fehler.hidden = true;
        document.getElementById('bezeichnung').value = ''; //Felder leeren
        document.getElementById('mengeSoll').value = ''; 
        seiteLaden(); //Seite neu laden, damit das Material in der Liste erscheint
    }
    //Bei Fehler
    else {
        fehler.hidden = false;
    }
}

//Neue Box anlegen
async function boxAnlegen() {
    //Eingaben lesen
    const name = document.getElementById('boxName').value;
    const fehler = document.getElementById('box-fehler');

    //Prüfung ob Name eingetragen wurde
    if (!name) {
        fehler.hidden = false;
        return;
    }

    //Anfrage an die Backend Route
    const antwort = await fetch('/api/packlisten/' + packlisteId + '/box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }) //Name als JSON schicken
    });

    //Bei Erfolg
    if (antwort.ok) {
        fehler.hidden = true;
        document.getElementById('boxName').value = '';
        seiteLaden();
    } 
    //Bei Fehler
    else {
        fehler.hidden = false;
    }
}

const boxBtn = document.getElementById('box-anlegen');
boxBtn.addEventListener('click', boxAnlegen);

//Material löschen
async function materialLoeschen(materialId) { //materialId vom Button holen

    const fehler = document.getElementById('status-fehler');

    //Anfrage an die Backend Lösch-Route
    const antwort = await fetch('/api/packlisten/' + packlisteId + '/material/' + materialId, {
        method: 'DELETE'
    });

    //Bei Erfolg
    if (antwort.ok) {
        fehler.hidden = true;
        seiteLaden();
    }
    //Bei Fehler
    else {
        const daten = await antwort.json();
        fehler.textContent = daten.fehler;
        fehler.hidden = false;
    }
}

//Box löschen
async function boxLoeschen(boxId) { //boxId kommt vom Button

    const fehler = document.getElementById('packen-fehler');

    //Anfrage an die Backend Lösch-Route
    const antwort = await fetch('/api/packlisten/' + packlisteId + '/box/' + boxId, {
        method: 'DELETE'
    });

    //Bei Erfolg
    if (antwort.ok) {
        fehler.hidden = true;
        seiteLaden();
    }
    //Bei Fehler
    else {
        const daten = await antwort.json();
        fehler.textContent = daten.fehler;
        fehler.hidden = false;
    }
}

//Material aus einer Box entfernen
async function inhaltEntfernen(boxId, materialId) { //Id kommt vom Button
    const fehler = document.getElementById('packen-fehler');

    //Anfrage an die Backend Lösch-Route
    const antwort = await fetch('/api/packlisten/' + packlisteId + '/box/' + boxId + '/material/' + materialId, {
        method: 'DELETE'
    });

    //Bei Erfolg
    if (antwort.ok) {
        fehler.hidden = true;
        seiteLaden();
    }
    //Bei Fehler
    else {
        const daten = await antwort.json();
        fehler.textContent = daten.fehler;
        fehler.hidden = false;
    }
}

//Alles der Reihe nach laden
async function seiteLaden() {
    await packlisteLaden();
    await materialLaden();
    await boxenLaden();
}
seiteLaden();