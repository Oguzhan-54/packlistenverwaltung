const parameter = new URLSearchParams(window.location.search); //URL durchsuchen
const packlisteId = parameter.get('id'); //id aus der URL in eine const packen

let packlisteStatus = '';

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
}
packlisteLaden();

async function materialLaden() {
    const antwort = await fetch('/api/packlisten/' +packlisteId + '/material');
    const materialien = await antwort.json(); //JSON Text auspacken und in eine Liste ablegen

    const container = document.getElementById('container-material');
    container.innerHTML = '';

    //Jedes Material durchgehen und auf der Seite anzeigen
    for (const material of materialien) {
        const eintrag = document.createElement('div');
        eintrag.textContent = material.bezeichnung + ' Gepackt: ' + material.mengeGepackt + ' Soll: ' + material.mengeSoll;
        
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
        
        container.appendChild(eintrag);
    }
}
materialLaden();

async function boxenLaden() {
    const antwort = await fetch('/api/packlisten/' + packlisteId + '/box'); //Server nach den Boxen abfragen
    const boxen = await antwort.json();

    const container = document.getElementById('container-boxen');
    container.innerHTML = '';

    //Jede Box durchgehen
    for (const box of boxen) {
        const boxEintrag = document.createElement('div');
        boxEintrag.textContent = box.name; //Box Name in das leere Div schreiben

        //Jedes Material in dieser Box durchgehen
        for (const inhalt of box.inhalt) {
            const zeile = document.createElement('div');
            zeile.textContent = inhalt.bezeichnung + ': ' + inhalt.mengeGepackt;
            boxEintrag.appendChild(zeile);
        }

        //Fertige Box zusammenfügen und anzeigen
        container.appendChild(boxEintrag);
    }
}
boxenLaden();

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