async function packlistenLaden() {
    const antwort = await fetch('/api/packlisten');
    const packlisten = await antwort.json(); //JSON Text auspacken und in eine Liste ablegen

    const container = document.getElementById('container-packlisten');
    container.innerHTML = '';

    //Jede Packliste durchgehen und auf der Seite anzeigen
    for (const packliste of packlisten) {
        const eintrag = document.createElement('div');

        const link = document.createElement('a');
        link.href = 'packliste.html?id=' + packliste.packlisteId;

        const kopfzeile = document.createElement('div');
        kopfzeile.className = 'karte-kopf'; 

        const jobnummer = document.createElement('span');
        jobnummer.textContent = packliste.jobnummer; //Jobnummer eintragen

        const status = document.createElement('span');
        status.textContent = packliste.status; //Status eintragen
        status.className = 'status status-' + packliste.status.toLowerCase();

        kopfzeile.appendChild(jobnummer); //Jobnummer in die obere Zeile
        kopfzeile.appendChild(status); //Status in die obere Zeile

        const name = document.createElement('h3');
        name.textContent = packliste.name; //Name eintragen

        const datum = document.createElement('p');
        datum.textContent = packliste.startDatum + ' - ' + packliste.endDatum;

        link.appendChild(kopfzeile);
        link.appendChild(name);
        link.appendChild(datum);
        eintrag.appendChild(link); 

        container.appendChild(eintrag);
    }
}
packlistenLaden();