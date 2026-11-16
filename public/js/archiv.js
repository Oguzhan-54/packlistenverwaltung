//Archivierte Packlisten laden
async function archivLaden() {
    //Anfrage an den Server
    const antwort = await fetch('/api/packlisten/archiv');
    const packlisten = await antwort.json(); //Antwort auspacken und in eine Liste schreiben

    const container = document.getElementById('container-packlisten');
    container.innerHTML = '';

    for (const packliste of packlisten) {
        const eintrag = document.createElement('div');

        const link = document.createElement('a');
        link.href = 'packliste.html?id=' + packliste.packlisteId; //Link führt zur Detailseite mit der Nummer der Packliste

        const kopfzeile = document.createElement('div');
        kopfzeile.className = 'karte-kopf';

        const jobnummer = document.createElement('span');
        jobnummer.textContent = packliste.jobnummer; //Jobnummer eintragen

        const status = document.createElement('span');
        status.textContent = packliste.status; //Status eintragen
        status.className = 'status status-' + packliste.status.toLowerCase(); //Klassen

        kopfzeile.appendChild(jobnummer); //Jobnummer in die obere Zeile
        kopfzeile.appendChild(status); //Status in die obere Zeile

        const name = document.createElement('h3');
        name.textContent = packliste.name; //Name eintragen

        const datum = document.createElement('p'); //Absatz für das Datum
        datum.textContent = packliste.startDatum + ' - ' + packliste.endDatum;

        link.appendChild(kopfzeile);
        link.appendChild(name);
        link.appendChild(datum);

        eintrag.appendChild(link); //Link in das div packen
        container.appendChild(eintrag); //div auf die Seite packen damit es sichtbar wird
    }
}
archivLaden();